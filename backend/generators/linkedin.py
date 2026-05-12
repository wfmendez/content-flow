from generators.base import generate_with_tracking


def generate_linkedin_post(
    title: str,
    summary: str,
    url: str,
    brand_name: str = "",
    tone: str = "profesional",
    audience: str = "",
) -> dict:
    """
    Genera un post optimizado para LinkedIn con metadatos de IA incluidos.
    Acepta parámetros de voz de marca para personalizar el tono.
    """
    brand_ctx = ""
    if brand_name or tone or audience:
        brand_ctx = f"""
VOZ DE MARCA:
- Marca: {brand_name or 'ContentFlow'}
- Tono: {tone}
- Audiencia objetivo: {audience or 'Profesionales de tecnología y startups'}
"""

    prompt = f"""Eres un experto en marketing de contenidos en LinkedIn con 10 años de experiencia.
Crea un post profesional para LinkedIn basado en esta tendencia.
{brand_ctx}
Tendencia: {title}
Contexto: {summary}
Fuente: {url}

FORMATO DE RESPUESTA (respeta exactamente):
TITULO: [título interno de máximo 8 palabras]
---
[cuerpo del post]

REGLAS DEL CUERPO:
- Gancho impactante en la primera línea (genera curiosidad)
- 3-4 puntos clave con viñetas o numeración
- Reflexión personal o perspectiva única al final
- Pregunta para fomentar comentarios
- 3-5 hashtags relevantes al final
- Tono: {tone}
- Máximo 1200 caracteres
- Máximo 3-4 emojis estratégicos
- Escribe en español"""

    result = generate_with_tracking(prompt)
    raw = result["text"]

    # Extraer título y cuerpo del formato estructurado
    title_line, body = "", raw
    if "TITULO:" in raw and "---" in raw:
        parts = raw.split("---", 1)
        title_line = parts[0].replace("TITULO:", "").strip()
        body = parts[1].strip()

    return {
        "title": title_line[:200] if title_line else title[:200],
        "body": body,
        "prompt_used": prompt,
        "ai_model": result["ai_model"],
        "tokens_input": result["tokens_input"],
        "tokens_output": result["tokens_output"],
        "generation_cost_usd": result["generation_cost_usd"],
    }
