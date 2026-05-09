// ── Demo Mode data ────────────────────────────────────────────────────────────
// Shown when the backend is unreachable (portfolio / offline mode)

const now = Date.now()
const ago = (ms) => new Date(now - ms).toISOString()

export const DEMO_TREND_STATS = {
  total: 30,
  pending: 18,
  processed: 12,
}

export const DEMO_CONTENT_STATS = {
  total: 12,
  pending: 8,
  approved: 3,
  rejected: 1,
  published: 4,
}

export const DEMO_TRENDS = [
  {
    id: 101,
    title: 'Claude 3.5 Sonnet supera a GPT-4o en benchmarks de código',
    source: 'rss',
    relevance_score: 9.2,
    processed: false,
    summary: 'Anthropic lanza modelo con mejoras en razonamiento y velocidad de respuesta.',
    url: 'https://anthropic.com',
    created_at: ago(3_600_000),
  },
  {
    id: 102,
    title: 'Llama 3.1 405B disponible en Meta AI — modelo open source más grande',
    source: 'reddit',
    subreddit: 'MachineLearning',
    relevance_score: 8.7,
    processed: true,
    summary: 'Meta libera su modelo más poderoso bajo licencia comercial permitiendo uso en producción.',
    url: 'https://reddit.com/r/MachineLearning',
    created_at: ago(7_200_000),
  },
  {
    id: 103,
    title: 'Google DeepMind presenta AlphaFold 3 con soporte a moléculas orgánicas',
    source: 'rss',
    relevance_score: 7.5,
    processed: false,
    summary: 'La nueva versión extiende predicción a ADN, ARN y ligandos pequeños.',
    url: 'https://deepmind.com',
    created_at: ago(14_400_000),
  },
  {
    id: 104,
    title: 'OpenAI lanza o3-mini para razonamiento matemático avanzado',
    source: 'reddit',
    subreddit: 'artificial',
    relevance_score: 8.1,
    processed: true,
    summary: 'Modelo de razonamiento llega con precios 80 % más bajos que o1.',
    url: 'https://reddit.com/r/artificial',
    created_at: ago(21_600_000),
  },
  {
    id: 105,
    title: 'Microsoft integra Phi-3.5 directamente en Windows 11 Copilot+',
    source: 'rss',
    relevance_score: 6.8,
    processed: false,
    summary: 'Los modelos on-device prometen privacidad sin enviar datos a la nube.',
    url: 'https://microsoft.com',
    created_at: ago(86_400_000),
  },
]

export const DEMO_DRAFTS = [
  {
    id: 201,
    title: '5 razones por las que Claude 3.5 Sonnet cambia el desarrollo de software',
    body: `🚀 El desarrollo de software está a punto de transformarse radicalmente.

Claude 3.5 Sonnet acaba de establecer un nuevo estándar en benchmarks de código y aquí están las 5 razones por las que deberías prestarle atención:

**1. Comprensión de contexto extendida (200 K tokens)**
Puede analizar proyectos completos, no solo fragmentos aislados.

**2. Razonamiento multi-paso superior**
Resuelve bugs complejos paso a paso, explicando cada decisión de forma transparente.

**3. Velocidad 2× mayor que su predecesor**
Las revisiones de código que tomaban minutos ahora toman segundos.

**4. Integración nativa con herramientas**
Funciona con VSCode, GitHub y terminales directamente gracias a computer-use.

**5. Precio competitivo**
$3/MTok input vs $15/MTok de GPT-4 Turbo — misma calidad, menor costo.

¿Estás usando IA en tu flujo de trabajo de desarrollo? Comparte tu experiencia 👇

#AI #DesarrolloSoftware #Claude #Anthropic #LLM`,
    status: 'pending',
    channel: 'linkedin',
    created_at: ago(1_800_000),
    trend: { title: 'Claude 3.5 Sonnet supera a GPT-4o en benchmarks de código' },
  },
  {
    id: 202,
    title: 'Llama 3.1 405B: El modelo open source que democratiza la IA empresarial',
    body: `# Llama 3.1 405B: La IA que cualquier empresa puede usar

Meta acaba de liberar el modelo de lenguaje open source más poderoso de la historia.

## ¿Qué significa esto para tu empresa?

Hasta ahora, acceder a modelos de IA de alta calidad requería depender de servicios cloud con costos impredecibles y preocupaciones de privacidad legítimas.

## Características técnicas

- **405 mil millones de parámetros** — comparable a GPT-4
- **Licencia comercial** — puedes usarlo en producción sin restricciones
- **On-premise** — tus datos nunca salen de tu infraestructura
- **Multiidioma** — soporte nativo para español y 30 idiomas más

## Casos de uso empresarial

1. Análisis de documentos internos confidenciales
2. Chatbots de atención al cliente personalizados
3. Generación de reportes automatizados
4. Code review y documentación técnica

## Conclusión

Llama 3.1 405B marca el inicio de una nueva era donde la IA de calidad enterprise es accesible para organizaciones de cualquier tamaño.`,
    status: 'approved',
    channel: 'blog',
    created_at: ago(86_400_000),
    trend: { title: 'Llama 3.1 405B disponible en Meta AI' },
  },
  {
    id: 203,
    title: 'Newsletter #12: Los 3 avances de IA que debes conocer esta semana',
    body: `¡Hola! Esta semana en IA fue especialmente movida.

Aquí van mis 3 hallazgos más importantes:

---

🔬 **1. AlphaFold 3 amplía su alcance**
DeepMind ya no solo predice proteínas — ahora maneja ADN, ARN y moléculas orgánicas. Esto abre la puerta a diseño de medicamentos totalmente in-silico. Impactante para pharma.

💻 **2. Claude 3.5 Sonnet en código**
Salió disparado en benchmarks. En HumanEval y SWE-bench supera a todos los modelos actuales. Lo probé en revisión de PRs y es notablemente mejor.

🦙 **3. Llama 3.1 405B — open source serio**
Meta hizo algo valiente: liberar un modelo que compite con GPT-4 bajo licencia comercial. Ideal para empresas con requisitos de privacidad estrictos.

---

¿Cuál te parece más relevante para tu trabajo?

Hasta la próxima,
Wuillian

P.D. Si alguien en tu red debería leer esto, reenvía este correo 🙏`,
    status: 'pending',
    channel: 'newsletter',
    created_at: ago(43_200_000),
    trend: null,
  },
]
