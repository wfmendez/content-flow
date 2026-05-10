import logging
import re
import time
from typing import List, Dict, Any
import google.generativeai as genai
from config import settings

logger = logging.getLogger(__name__)

# Configurar Gemini al importar
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    _gemini_model = genai.GenerativeModel("gemini-1.5-flash")
    logger.info("[AI] Gemini 1.5 Flash configurado.")
else:
    _gemini_model = None
    logger.warning("[AI] GEMINI_API_KEY no configurada — IA deshabilitada.")

# Backoff exponencial: reintentos ante rate limit 429
_MAX_RETRIES = 3
_BASE_DELAY  = 10  # segundos


def generate_with_gemini(prompt: str) -> str:
    """
    Genera texto con Gemini 1.5 Flash.
    Implementa exponential backoff para rate limit del free tier.
    Fallback a Groq (Llama 3.3 70B) si Gemini falla permanentemente.
    """
    if _gemini_model:
        for attempt in range(_MAX_RETRIES):
            try:
                response = _gemini_model.generate_content(prompt)
                return response.text.strip()
            except Exception as e:
                err = str(e)
                if "429" in err or "quota" in err.lower() or "rate" in err.lower():
                    wait = _BASE_DELAY * (2 ** attempt)
                    logger.warning(f"[Gemini] Rate limit (intento {attempt+1}/{_MAX_RETRIES}). Esperando {wait}s...")
                    time.sleep(wait)
                else:
                    logger.error(f"[Gemini] Error no recuperable: {e}")
                    break

        logger.warning("[Gemini] Agotados los reintentos. Intentando Groq...")

    return _generate_with_groq(prompt)


def _generate_with_groq(prompt: str) -> str:
    """Fallback: Groq con Llama 3.3 70B (free tier: 14,400 req/día)."""
    if not settings.GROQ_API_KEY:
        raise RuntimeError(
            "Gemini no disponible y GROQ_API_KEY no configurado. "
            "Añade tu key en .env: https://console.groq.com"
        )
    from groq import Groq
    client = Groq(api_key=settings.GROQ_API_KEY)
    chat = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.75,
        max_tokens=2048,
    )
    return chat.choices[0].message.content.strip()


def estimate_tokens(text: str) -> int:
    """Rough heuristic: ~4 chars per token (works across most LLMs)."""
    return max(1, len(text) // 4)


def calculate_cost_usd(input_tokens: int, output_tokens: int, model: str) -> float:
    """
    Approximate cost based on public pricing (as of 2025-01).
    Gemini 1.5 Flash: $0.075/1M input · $0.30/1M output
    Groq (Llama 3.3): effectively $0 on free tier
    """
    if "gemini" in model:
        return round((input_tokens * 0.075 + output_tokens * 0.30) / 1_000_000, 6)
    return 0.0


def generate_with_tracking(prompt: str) -> dict:
    """
    Calls generate_with_gemini and returns text + AI metadata dict.
    Used by generators to attach transparency info to each draft.
    """
    model = "gemini-1.5-flash" if _gemini_model else "llama-3.3-70b-versatile"
    input_tokens = estimate_tokens(prompt)
    text = generate_with_gemini(prompt)
    output_tokens = estimate_tokens(text)
    return {
        "text": text,
        "ai_model": model,
        "tokens_input": input_tokens,
        "tokens_output": output_tokens,
        "generation_cost_usd": calculate_cost_usd(input_tokens, output_tokens, model),
    }


def score_trends_batch(items: List[Dict[str, Any]]) -> List[int]:
    """
    Puntúa una lista de trends en UNA sola llamada a la IA.

    Evita el rate limit del free tier (15 RPM de gemini-2.0-flash) usando
    batch prompting: 1 request → N scores. Fallback a 7 si la IA falla,
    para no descartar artículos por error transitorio.

    Args:
        items: Lista de dicts con claves 'title' y 'summary'.
    Returns:
        Lista de enteros 1-10, en el mismo orden que items.
    """
    if not items:
        return []

    numbered = "\n".join(
        f"{i+1}. {item['title']}"
        for i, item in enumerate(items)
    )

    prompt = f"""Puntúa del 1 al 10 la relevancia de cada artículo para crear contenido
de valor en LinkedIn, blogs y newsletters de tecnología/startups.
Responde ÚNICAMENTE con números separados por comas, mismo orden. Sin texto extra.
Ejemplo: 8,5,9,3,7

Artículos:
{numbered}

Puntuaciones:"""

    try:
        result = generate_with_gemini(prompt)
        raw_scores = re.findall(r'\d+', result)
        scores = [max(1, min(10, int(s))) for s in raw_scores]
        while len(scores) < len(items):
            scores.append(7)
        return scores[:len(items)]
    except Exception as e:
        logger.error(f"[AI] Error en batch scoring: {e}")
        return [7] * len(items)  # Fallback: dejar pasar (score > MIN_RELEVANCE_SCORE=6)
