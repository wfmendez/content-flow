import re
from generators.base import generate_with_gemini


def generate_blog_post(title: str, summary: str, url: str) -> dict:
    """
    Genera un artículo de blog en Markdown en UNA sola llamada a Gemini.
    El título SEO se extrae del H1 generado en el cuerpo.
    """
    prompt = f"""Eres un escritor técnico experto en tecnología, IA y startups.
Crea un artículo de blog completo en formato Markdown.

Tendencia: {title}
Contexto: {summary}
Fuente: {url}

INSTRUCCIONES:
- Primera línea: título SEO como H1 (# Título)
- Introducción que enganche (2-3 párrafos)
- 3-4 secciones con subtítulos H2 (##)
- Al menos una lista con puntos clave
- Sección "¿Por qué importa esto?" con perspectiva práctica
- Conclusión con takeaways accionables
- Última línea: "---\nFuente: [Ver artículo original]({url})"
- Tono educativo, claro, para profesionales de tecnología
- Entre 600-900 palabras
- Escribe en español"""

    body = generate_with_gemini(prompt)

    # Extraer título del H1
    match = re.search(r'^#\s+(.+)$', body, re.MULTILINE)
    seo_title = match.group(1).strip() if match else title[:200]

    return {
        "title": seo_title[:200],
        "body": body,
    }
