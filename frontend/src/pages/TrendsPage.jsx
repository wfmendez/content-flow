import { useEffect, useState } from 'react'
import { getTrends, generateContent, deleteTrend, fetchTrends } from '../api/client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ExternalLink, Trash2, Wand2, RefreshCw, CheckCircle2, Clock, Rss, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

const SOURCE_CONFIG = {
  rss:     { label: 'RSS',    icon: Rss,            cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
  reddit:  { label: 'Reddit', icon: MessageSquare,  cls: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
  twitter: { label: 'Twitter',icon: MessageSquare,  cls: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400' },
}

const FILTERS = [
  ['all', 'Todas'],
  ['pending', 'Sin procesar'],
  ['processed', 'Procesadas'],
]

function ScoreBar({ score }) {
  const pct = (score / 10) * 100
  const color = score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-amber-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-galaxy-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 dark:text-galaxy-300 w-6">{score}</span>
    </div>
  )
}

export default function TrendsPage() {
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState({})
  const [filter, setFilter] = useState('all')

  const load = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? { processed: filter === 'processed' } : {}
      const { data } = await getTrends(params)
      setTrends(data)
    } catch {
      toast.error('Error cargando tendencias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const handleGenerate = async (trend) => {
    setGenerating(g => ({ ...g, [trend.id]: true }))
    try {
      await generateContent(trend.id)
      toast.success('✨ Generando contenido…')
      setTimeout(load, 2000)
    } catch {
      toast.error('Error al generar contenido')
    } finally {
      setGenerating(g => ({ ...g, [trend.id]: false }))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta tendencia?')) return
    try {
      await deleteTrend(id)
      setTrends(t => t.filter(x => x.id !== id))
      toast.success('Tendencia eliminada')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleFetch = async () => {
    try {
      await fetchTrends()
      toast.success('🔍 Monitoreo iniciado')
    } catch {
      toast.error('Error al iniciar monitoreo')
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tendencias</h1>
          <p className="text-sm text-slate-500 dark:text-galaxy-400 mt-1">
            {trends.length} tendencias · Fuentes: RSS, Reddit
          </p>
        </div>
        <button onClick={handleFetch} className="btn-primary">
          <RefreshCw className="w-4 h-4" />
          Monitorear
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150
              ${filter === val
                ? 'bg-brand-500 text-white shadow-sm dark:shadow-glow-sm'
                : 'bg-white dark:bg-galaxy-800 border border-slate-200 dark:border-galaxy-600 text-slate-600 dark:text-galaxy-300 hover:border-brand-300 dark:hover:border-brand-500/50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-galaxy-500">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-brand-400" />
          <p className="text-sm">Cargando tendencias…</p>
        </div>
      ) : trends.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-brand-500/10 flex items-center justify-center mb-4">
            <Rss className="w-8 h-8 text-brand-400" />
          </div>
          <p className="font-semibold text-slate-700 dark:text-galaxy-200 mb-1">Sin tendencias</p>
          <p className="text-sm text-slate-500 dark:text-galaxy-400 mb-4">
            Pulsa "Monitorear" para buscar artículos relevantes
          </p>
          <button onClick={handleFetch} className="btn-primary">
            <RefreshCw className="w-4 h-4" /> Monitorear ahora
          </button>
        </div>
      ) : (
        <div className="space-y-3 animate-slide-up">
          {trends.map(trend => {
            const src = SOURCE_CONFIG[trend.source] || SOURCE_CONFIG.rss
            const SrcIcon = src.icon
            return (
              <div key={trend.id}
                className="card p-5 flex items-start gap-4
                           hover:border-brand-200 dark:hover:border-brand-500/40
                           hover:shadow-md dark:hover:shadow-glow-sm
                           transition-all duration-200"
              >
                {/* Source icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${src.cls}`}>
                  <SrcIcon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Meta row */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`badge ${src.cls}`}>{src.label}</span>
                    {trend.subreddit && (
                      <span className="text-xs text-slate-400 dark:text-galaxy-500">r/{trend.subreddit}</span>
                    )}
                    <span className="text-xs text-slate-400 dark:text-galaxy-500 ml-auto">
                      {formatDistanceToNow(new Date(trend.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug mb-2 line-clamp-2">
                    {trend.title}
                  </h3>

                  {/* Summary */}
                  {trend.summary && (
                    <p className="text-xs text-slate-500 dark:text-galaxy-400 line-clamp-1 mb-3">
                      {trend.summary}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-4">
                    <div className="w-28">
                      <ScoreBar score={trend.relevance_score} />
                    </div>
                    {trend.processed
                      ? <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Generado
                        </span>
                      : <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                    }
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {trend.url && (
                    <a href={trend.url} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {!trend.processed && (
                    <button
                      onClick={() => handleGenerate(trend)}
                      disabled={generating[trend.id]}
                      className="btn-primary py-1.5 text-xs"
                    >
                      <Wand2 className={`w-3.5 h-3.5 ${generating[trend.id] ? 'animate-pulse' : ''}`} />
                      {generating[trend.id] ? 'Generando…' : 'Generar'}
                    </button>
                  )}
                  <button onClick={() => handleDelete(trend.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
