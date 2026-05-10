import { useEffect, useState, useCallback } from 'react'
import { getTrendStats, getContentStats, fetchTrends } from '../api/client'
import { TrendingUp, FileText, Clock, Send, RefreshCw, Zap, ArrowRight, Wifi, WifiOff, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useApiStatus } from '../hooks/useApiStatus'
import { useActivity } from '../context/ActivityContext'
import { DEMO_TREND_STATS, DEMO_CONTENT_STATS } from '../data/demoData'
import { SkeletonStatCard } from '../components/SkeletonCard'
import { RoiCalculator } from '../components/RoiCalculator'

// ── Sub-components ─────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, gradient, delta }) => (
  <div className="card p-6 flex flex-col gap-4 animate-slide-up hover:scale-[1.01] transition-transform duration-200">
    <div className="flex items-start justify-between">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${gradient}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {delta !== undefined && (
        <span className="text-xs font-semibold px-2 py-1 rounded-full
                         bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
          +{delta}
        </span>
      )}
    </div>
    <div>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">{value ?? '0'}</p>
      <p className="text-sm text-slate-500 dark:text-galaxy-400 mt-0.5">{label}</p>
    </div>
  </div>
)

const PipelineStep = ({ label, count, color, last }) => (
  <div className="flex items-center gap-2">
    <div className={`flex flex-col items-center px-4 py-3 rounded-xl min-w-[110px] ${color}`}>
      <span className="text-xl font-bold">{count ?? 0}</span>
      <span className="text-xs mt-0.5 font-medium opacity-80">{label}</span>
    </div>
    {!last && (
      <ArrowRight className="w-4 h-4 text-slate-300 dark:text-galaxy-600 flex-shrink-0" />
    )}
  </div>
)

function ApiStatusBadge({ status }) {
  if (status === 'checking') return (
    <span className="inline-flex items-center gap-1.5 text-slate-400 dark:text-galaxy-500">
      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-galaxy-600 animate-pulse" />
      Conectando…
    </span>
  )
  if (status === 'online') return (
    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
      <Wifi className="w-3.5 h-3.5" />
      En línea
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
      <WifiOff className="w-3.5 h-3.5" />
      Modo demo
    </span>
  )
}

function DemoBanner() {
  return (
    <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl
                    bg-amber-50 dark:bg-amber-900/20
                    border border-amber-200 dark:border-amber-800/50
                    text-amber-800 dark:text-amber-300 text-sm animate-fade-in">
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <p>
        <span className="font-semibold">Modo demo</span>
        {' '}— el backend no está disponible. Se muestran datos de ejemplo para demostración.
      </p>
    </div>
  )
}

function ActivityFeed({ activities }) {
  if (activities.length === 0) return (
    <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-galaxy-500">
      <Activity className="w-8 h-8 mb-2 opacity-40" />
      <p className="text-xs">Sin actividad aún — aprueba o genera contenido</p>
    </div>
  )

  return (
    <ul className="space-y-2">
      {activities.map(item => (
        <li key={item.id} className="flex items-start gap-3 py-2 border-b border-slate-50 dark:border-galaxy-700/50 last:border-0">
          <span className="text-base leading-none mt-0.5">{item.icon.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 dark:text-galaxy-200 leading-snug">{item.label}</p>
            <p className="text-xs text-slate-400 dark:text-galaxy-500 mt-0.5">
              {formatDistanceToNow(item.ts, { addSuffix: true, locale: es })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [trendStats, setTrendStats]     = useState(null)
  const [contentStats, setContentStats] = useState(null)
  const [loading, setLoading]           = useState(true)
  const [fetching, setFetching]         = useState(false)
  const [isDemo, setIsDemo]             = useState(false)

  const apiStatus = useApiStatus()
  const { activities } = useActivity()

  const load = useCallback(async () => {
    try {
      const [t, c] = await Promise.all([getTrendStats(), getContentStats()])
      setTrendStats(t.data)
      setContentStats(c.data)
      setIsDemo(false)
    } catch {
      // Fall back to demo data silently
      setTrendStats(DEMO_TREND_STATS)
      setContentStats(DEMO_CONTENT_STATS)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => { load() }, [load])

  // Auto-refresh every 30 s
  useEffect(() => {
    const id = setInterval(() => {
      if (!isDemo) load()
    }, 30_000)
    return () => clearInterval(id)
  }, [isDemo, load])

  const handleFetch = async () => {
    if (isDemo) {
      toast('Backend no disponible — iniciando en modo demo', { icon: '🔌' })
      return
    }
    setFetching(true)
    try {
      await fetchTrends()
      toast.success('🔍 Monitoreo iniciado — revisa Tendencias en unos minutos')
      setTimeout(load, 3000)
    } catch {
      toast.error('Error al iniciar monitoreo')
    } finally {
      setFetching(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">

      {/* Demo banner */}
      {isDemo && <DemoBanner />}

      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-galaxy-400 mt-1 flex items-center gap-1.5">
            Pipeline de contenido con IA ·{' '}
            <ApiStatusBadge status={apiStatus} />
          </p>
        </div>
        <button onClick={handleFetch} disabled={fetching} className="btn-primary">
          <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{fetching ? 'Monitoreando…' : 'Monitorear ahora'}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <>
            <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard label="Tendencias" value={trendStats?.total}       icon={TrendingUp} gradient="bg-blue-500 dark:bg-brand-500" />
            <StatCard label="Borradores" value={contentStats?.total}     icon={FileText}   gradient="bg-violet-500 dark:bg-galaxy-500" delta={isDemo ? undefined : undefined} />
            <StatCard label="Pendientes" value={contentStats?.pending}   icon={Clock}      gradient="bg-amber-500 dark:bg-amber-600" />
            <StatCard label="Publicados" value={contentStats?.published} icon={Send}       gradient="bg-emerald-500 dark:bg-emerald-600" />
          </>
        )}
      </div>

      {/* Pipeline + Activity (two columns on large screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Pipeline visual — 2 cols */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-800 dark:text-galaxy-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-500" />
              Flujo del Pipeline
            </h2>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <PipelineStep label="RSS / Reddit"    count={trendStats?.total}      color="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" />
            <PipelineStep label="Evaluados por IA" count={trendStats?.processed} color="bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300" />
            <PipelineStep label="Borradores"      count={contentStats?.total}    color="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300" />
            <PipelineStep label="Aprobados"       count={contentStats?.approved} color="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300" />
            <PipelineStep label="Publicados"      count={contentStats?.published} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" last />
          </div>
        </div>

        {/* Activity feed — 1 col */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 dark:text-galaxy-100 flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-brand-500" />
            Actividad reciente
          </h2>
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* ROI Calculator */}
      <div className="mb-6">
        <RoiCalculator />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/trends"
          className="card p-5 flex items-center gap-4
                     hover:border-brand-300 dark:hover:border-brand-500/50
                     hover:shadow-md dark:hover:shadow-glow-sm
                     transition-all duration-200 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-brand-500/10 flex items-center justify-center
                          group-hover:bg-brand-500 dark:group-hover:bg-brand-500 transition-colors">
            <TrendingUp className="w-5 h-5 text-blue-500 dark:text-brand-400 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">Ver Tendencias</p>
            <p className="text-xs text-slate-500 dark:text-galaxy-400">{trendStats?.pending ?? 0} sin procesar</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 dark:text-galaxy-600 ml-auto group-hover:text-brand-500 transition-colors" />
        </Link>

        <Link to="/content"
          className="card p-5 flex items-center gap-4
                     hover:border-brand-300 dark:hover:border-brand-500/50
                     hover:shadow-md dark:hover:shadow-glow-sm
                     transition-all duration-200 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center
                          group-hover:bg-violet-500 dark:group-hover:bg-violet-500 transition-colors">
            <FileText className="w-5 h-5 text-violet-500 dark:text-violet-400 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">Revisar Contenido</p>
            <p className="text-xs text-slate-500 dark:text-galaxy-400">{contentStats?.pending ?? 0} esperando aprobación</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 dark:text-galaxy-600 ml-auto group-hover:text-violet-500 transition-colors" />
        </Link>
      </div>
    </div>
  )
}
