import { useState } from 'react'
import { Zap, Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

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
    <div className="min-h-screen flex items-center justify-center
                    bg-slate-50 dark:bg-galaxy-900 p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500 shadow-glow flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <div>
            <span className="font-bold text-xl text-slate-900 dark:text-white">Content</span>
            <span className="font-bold text-xl text-brand-500">Flow</span>
          </div>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Iniciar sesión</h1>
          <p className="text-sm text-slate-500 dark:text-galaxy-400 mb-6">
            Pipeline de contenido con IA
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
                       transition-all duration-150 text-sm text-left"
          >
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <div>
              <span className="font-semibold">Cuenta demo</span>
              <span className="text-brand-500 dark:text-brand-400 ml-2 font-mono text-xs">
                demo@contentflow.io · demo2024
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </button>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-galaxy-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-galaxy-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="demo@contentflow.io"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm
                             bg-slate-50 dark:bg-galaxy-900
                             border border-slate-200 dark:border-galaxy-600
                             text-slate-800 dark:text-galaxy-100
                             placeholder:text-slate-400 dark:placeholder:text-galaxy-600
                             focus:outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-galaxy-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-galaxy-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm
                             bg-slate-50 dark:bg-galaxy-900
                             border border-slate-200 dark:border-galaxy-600
                             text-slate-800 dark:text-galaxy-100
                             placeholder:text-slate-400 dark:placeholder:text-galaxy-600
                             focus:outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand-500"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-galaxy-200">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20
                            px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5 text-sm"
            >
              {loading ? 'Verificando…' : 'Entrar'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200 dark:bg-galaxy-700" />
            <span className="text-xs text-slate-400 dark:text-galaxy-500">o</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-galaxy-700" />
          </div>

          {/* Demo mode bypass */}
          <button
            type="button"
            onClick={loginDemo}
            className="w-full py-2.5 rounded-xl text-sm font-medium
                       border border-slate-200 dark:border-galaxy-600
                       text-slate-600 dark:text-galaxy-300
                       hover:bg-slate-50 dark:hover:bg-galaxy-700
                       transition-all duration-150"
          >
            Continuar en modo demo (sin backend)
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-galaxy-600 mt-4">
          Proyecto de portafolio · <a href="https://github.com/wfmendez/content-flow"
            target="_blank" rel="noopener noreferrer"
            className="underline hover:text-brand-500">Ver código fuente</a>
        </p>
      </div>
    </div>
  )
}
