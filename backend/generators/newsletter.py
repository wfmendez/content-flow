import re
from generators.base import generate_with_tracking


def generate_newsletter_item(title: str, summary: str, url: str) -> dict:
    """
    Genera un ítem de newsletter en HTML con metadatos de IA incluidos.
    """
    prompt = f"""Eres el editor de una newsletter sobre tecnología, IA y startups.
Escribe una sección de newsletter en HTML.

Tendencia: {title}
Contexto: {summary}
Fuente: {url}

FORMATO REQUERIDO (HTML limpio, sin CSS externo):
<h2>[Título atractivo para el asunto del email]</h2>
<p>[Introducción directa, 2-3 frases]</p>
<ul>
  <li>[Punto clave 1]</li>
  <li>[Punto clave 2]</li>
  <li>[Punto clave 3]</li>
</ul>
<p><strong>Por qué importa:</strong> [1-2 frases de perspectiva práctica]</p>
<p><a href="{url}">→ Leer artículo completo</a></p>

REGLAS:
- Máximo 250 palabras
- Tono directo y valioso, sin relleno
- Escribe en español"""

    result = generate_with_tracking(prompt)
    body = result["text"]

    # Extraer título del <h2>
    match = re.search(r'<h2[^>]*>(.*?)</h2>', body, re.IGNORECASE | re.DOTALL)
    email_title = match.group(1).strip() if match else title[:200]

    return {
        "title": email_title[:200],
        "body": body,
        "prompt_used": prompt,
        "ai_model": result["ai_model"],
        "tokens_input": result["tokens_input"],
        "tokens_output": result["tokens_output"],
        "generation_cost_usd": result["generation_cost_usd"],
    }
