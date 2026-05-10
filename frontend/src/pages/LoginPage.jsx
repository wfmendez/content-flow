import { useState } from 'react'
import {
  Zap, Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff,
  TrendingUp, FileText, Send, CheckCircle, Clock, BarChart2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ── Hero feature items ────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: TrendingUp,
    color: 'bg-blue-500',
    title: 'Monitoreo automático',
    desc: 'Rastrea RSS feeds y Reddit cada 6 horas. Sin configurar cron jobs.',
  },
  {
    icon: Zap,
    color: 'bg-violet-500',
    title: 'IA que entiende tu marca',
    desc: 'Gemini 1.5 Flash genera contenido adaptado a tu tono y audiencia.',
  },
  {
    icon: CheckCircle,
    color: 'bg-amber-500',
    title: 'Aprobación humana siempre',
    desc: 'Ningún post sale sin tu revisión. Edita, aprueba o descarta en un clic.',
  },
  {
    icon: Send,
    color: 'bg-emerald-500',
    title: 'Publicación multi-canal',
    desc: 'LinkedIn, blog en Markdown y newsletter HTML desde una sola herramienta.',
  },
]

const METRICS = [
  { value: '~$0.001',  label: 'costo por tendencia' },
  { value: '80 %',     label: 'tiempo ahorrado' },
  { value: '3 canales', label: 'en simultáneo' },
  { value: '24 / 7',   label: 'pipeline activo' },
]

// ── Pipeline mini-animation ───────────────────────────────────────────────────
const STEPS = [
  { icon: TrendingUp, label: 'RSS · Reddit',  color: 'bg-blue-500' },
  { icon: Zap,        label: 'Gemini IA',     color: 'bg-violet-500' },
  { icon: FileText,   label: 'Borradores',    color: 'bg-indigo-500' },
  { icon: CheckCircle,label: 'Revisión',      color: 'bg-amber-500' },
  { icon: Send,       label: 'Publicado',     color: 'bg-emerald-500' },
]

function PipelineViz() {
  return (
    <div className="flex items-center gap-1 flex-wrap justify-center my-8">
      {STEPS.map(({ icon: Icon, label, color }, i) => (
        <div key={label} className="flex items-center gap-1">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs text-slate-500 dark:text-galaxy-400">{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-galaxy-600 mb-4" />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login, loginDemo, loading, error } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    await login(email, password)
  }

  const fillDemo = () => {
    setEmail('demo@contentflow.io')
    setPassword('demo2024')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-galaxy-900">

      {/* ── TOP NAV ────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-galaxy-700 bg-white dark:bg-galaxy-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 shadow-glow-sm flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">Content</span>
          <span className="font-bold text-brand-500">Flow</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="https://github.com/wfmendez/content-flow" target="_blank" rel="noopener noreferrer"
            className="text-sm text-slate-500 dark:text-galaxy-400 hover:text-slate-900 dark:hover:text-white transition-colors hidden sm:block">
            Ver código →
          </a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* ── LEFT: Marketing hero ─────────────────────────────────── */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                            bg-brand-50 dark:bg-brand-500/10
                            border border-brand-200 dark:border-brand-500/30
                            text-brand-700 dark:text-brand-400 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by Gemini 1.5 Flash + Groq Llama 3.3
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">
              De tendencia a
              <span className="text-brand-500"> post publicado</span>
              <br />en minutos
            </h1>

            <p className="text-lg text-slate-600 dark:text-galaxy-300 mb-8 leading-relaxed">
              ContentFlow monitorea RSS y Reddit, puntúa las tendencias con IA y genera
              borradores para LinkedIn, blog y newsletter — listos para tu revisión.
            </p>

            {/* Metrics row */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {METRICS.map(({ value, label }) => (
                <div key={label} className="text-center p-3 rounded-xl bg-white dark:bg-galaxy-800 border border-slate-200 dark:border-galaxy-600">
                  <p className="text-lg font-extrabold text-brand-600 dark:text-brand-400">{value}</p>
                  <p className="text-xs text-slate-400 dark:text-galaxy-500 mt-0.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {/* Pipeline visualization */}
            <div className="card p-5 mb-8">
              <p className="text-xs font-semibold text-slate-400 dark:text-galaxy-500 text-center mb-2 uppercase tracking-wide">
                El pipeline completo
              </p>
              <PipelineViz />
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-galaxy-800 border border-slate-200 dark:border-galaxy-600">
                  <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-galaxy-100 mb-0.5">{title}</p>
                    <p className="text-xs text-slate-500 dark:text-galaxy-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Login form ────────────────────────────────────── */}
          <div className="lg:sticky lg:top-8">
            <div className="card p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                Acceder al dashboard
              </h2>
              <p className="text-sm text-slate-500 dark:text-galaxy-400 mb-6">
                Prueba la demo o usa tus credenciales
              </p>

              {/* Demo credentials hint */}
              <button
                type="button"
                onClick={fillDemo}
                className="w-full mb-4 flex items-center gap-2 px-4 py-3 rounded-xl
                           bg-brand-50 dark:bg-brand-500/10
                           border border-brand-200 dark:border-brand-500/30
                           text-brand-700 dark:text-brand-400
                           hover:bg-brand-100 dark:hover:bg-brand-500/20
                           transition-all text-sm text-left"
              >
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold">Cuenta demo →</span>
                  <span className="ml-2 font-mono text-xs opacity-80">
                    demo@contentflow.io · demo2024
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-galaxy-300 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="demo@contentflow.io" required
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm
                                 bg-slate-50 dark:bg-galaxy-900
                                 border border-slate-200 dark:border-galaxy-600
                                 text-slate-800 dark:text-galaxy-100 placeholder:text-slate-400
                                 focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-galaxy-300 mb-1.5">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPass ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" required
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm
                                 bg-slate-50 dark:bg-galaxy-900
                                 border border-slate-200 dark:border-galaxy-600
                                 text-slate-800 dark:text-galaxy-100 placeholder:text-slate-400
                                 focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading} className="w-full btn-primary justify-center py-2.5">
                  {loading ? 'Verificando…' : 'Entrar al dashboard'}
                </button>
              </form>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200 dark:bg-galaxy-700" />
                <span className="text-xs text-slate-400 dark:text-galaxy-500">o</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-galaxy-700" />
              </div>

              <button onClick={loginDemo}
                className="w-full py-2.5 rounded-xl text-sm font-medium
                           border border-slate-200 dark:border-galaxy-600
                           text-slate-600 dark:text-galaxy-300
                           hover:bg-slate-50 dark:hover:bg-galaxy-700 transition-all">
                Continuar en modo demo (sin backend)
              </button>

              <p className="text-center text-xs text-slate-400 dark:text-galaxy-600 mt-4">
                Proyecto open source ·{' '}
                <a href="https://github.com/wfmendez/content-flow" target="_blank" rel="noopener noreferrer"
                  className="underline hover:text-brand-500">GitHub</a>
              </p>
            </div>

            {/* Trust signals */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-400 dark:text-galaxy-500">
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> JWT seguro</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Sin tarjeta</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Código abierto</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
