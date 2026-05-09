from generators.base import generate_with_gemini


def generate_linkedin_post(title: str, summary: str, url: str) -> dict:
    """
    Genera un post optimizado para LinkedIn en UNA sola llamada a Gemini.
    El título interno se extrae de la primera línea del cuerpo generado.
    """
    prompt = f"""Eres un experto en marketing de contenidos en LinkedIn con 10 años de experiencia.
Crea un post profesional para LinkedIn basado en esta tendencia.

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
- Tono: profesional pero cercano
- Máximo 1200 caracteres
- Máximo 3-4 emojis estratégicos
- Escribe en español"""

    raw = generate_with_gemini(prompt)

    # Extraer título y cuerpo del formato estructurado
    title_line, body = "", raw
    if "TITULO:" in raw and "---" in raw:
        parts = raw.split("---", 1)
        title_line = parts[0].replace("TITULO:", "").strip()
        body = parts[1].strip()

    return {
        "title": title_line[:200] if title_line else title[:200],
        "body": body,
    }
