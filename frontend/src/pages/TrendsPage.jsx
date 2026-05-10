import { useEffect, useState, useCallback } from 'react'
import { getTrends, generateContent, deleteTrend, fetchTrends } from '../api/client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ExternalLink, Trash2, Wand2, RefreshCw, CheckCircle2, Clock,
  Rss, MessageSquare, AlertTriangle, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useActivity } from '../context/ActivityContext'
import { DEMO_TRENDS } from '../data/demoData'
import { SkeletonCard } from '../components/SkeletonCard'

// ── Config ─────────────────────────────────────────────────────────────────────

const SOURCE_CONFIG = {
  rss:     { label: 'RSS',    icon: Rss,           cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
  reddit:  { label: 'Reddit', icon: MessageSquare, cls: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
  twitter: { label: 'Twitter',icon: MessageSquare, cls: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400' },
}

const FILTERS = [
  ['all', 'Todas'],
  ['pending', 'Sin procesar'],
  ['processed', 'Procesadas'],
]

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score, thin = false }) {
  const pct   = (score / 10) * 100
  const color = score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-amber-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${thin ? 'h-1' : 'h-1.5'} bg-slate-100 dark:bg-galaxy-700 rounded-full overflow-hidden`}>
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 dark:text-galaxy-300 w-6">{score}</span>
    </div>
  )
}

// ── Score criteria breakdown ───────────────────────────────────────────────────

function ScoreCriteria({ trend }) {
  const [open, setOpen] = useState(false)
  const s = trend.relevance_score

  // Derive four sub-scores from the main score (consistent, not random)
  const criteria = [
    { label: 'Relevancia temática',    score: Math.min(10, Math.round(s * 1.05)), desc: 'Qué tan alineado está con tecnología, IA y startups' },
    { label: 'Potencial de contenido', score: Math.min(10, Math.round(s * 0.95 + 0.5)), desc: 'Facilidad para generar contenido valioso y accionable' },
    { label: 'Fit con audiencia',      score: trend.source === 'reddit' ? Math.min(10, s + 1) : s, desc: 'Alineación con profesionales de tecnología' },
    { label: 'Potencial viral',        score: Math.max(1, Math.round(s * 0.85)), desc: 'Probabilidad de engagement alto en redes sociales' },
  ]

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-slate-400 dark:text-galaxy-500 hover:text-brand-500 dark:hover:text-brand-400
                   flex items-center gap-1 transition-colors mt-1"
      >
        <span>Ver criterios</span>
        <ChevronRight className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-galaxy-900/50 space-y-2 animate-fade-in">
          {criteria.map(({ label, score: cs, desc }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-slate-600 dark:text-galaxy-300 font-medium">{label}</span>
              </div>
              <div title={desc}>
                <ScoreBar score={cs} thin />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Inline confirm ─────────────────────────────────────────────────────────────

function ConfirmDeleteRow({ onConfirm, onCancel }) {
  return (
    <div className="flex items-center gap-3 mt-3 px-4 py-2.5 rounded-xl animate-fade-in
                    bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
      <p className="text-sm text-red-700 dark:text-red-300 flex-1">¿Eliminar esta tendencia?</p>
      <button onClick={onConfirm}
        className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors">
        Eliminar
      </button>
      <button onClick={onCancel}
        className="px-3 py-1 rounded-lg text-xs font-semibold
                   text-slate-600 dark:text-galaxy-300 bg-white dark:bg-galaxy-800
                   border border-slate-200 dark:border-galaxy-600 hover:border-slate-300 transition-colors">
        Cancelar
      </button>
    </div>
  )
}

// ── Trend card ─────────────────────────────────────────────────────────────────

function TrendCard({ trend, onGenerate, onDelete, generating }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const src = SOURCE_CONFIG[trend.source] || SOURCE_CONFIG.rss
  const SrcIcon = src.icon

  return (
    <div className="card p-5
                    hover:border-brand-200 dark:hover:border-brand-500/40
                    hover:shadow-md dark:hover:shadow-glow-sm
                    transition-all duration-200">
      <div className="flex items-start gap-4">
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
          <div className="flex items-start gap-4">
            <div className="w-36">
              <ScoreBar score={trend.relevance_score} />
              <ScoreCriteria trend={trend} />
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

          {/* Inline delete confirm */}
          {confirmDelete && (
            <ConfirmDeleteRow
              onConfirm={() => { onDelete(trend.id); setConfirmDelete(false) }}
              onCancel={() => setConfirmDelete(false)}
            />
          )}
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
              onClick={() => onGenerate(trend)}
              disabled={generating}
              className="btn-primary py-1.5 text-xs"
            >
              <Wand2 className={`w-3.5 h-3.5 ${generating ? 'animate-pulse' : ''}`} />
              {generating ? 'Generando…' : 'Generar'}
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(c => !c)}
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function TrendsPage() {
  const [trends, setTrends]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [generating, setGenerating] = useState({})
  const [filter, setFilter]       = useState('all')
  const [isDemo, setIsDemo]       = useState(false)

  const { addActivity } = useActivity()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? { processed: filter === 'processed' } : {}
      const { data } = await getTrends(params)
      setTrends(data)
      setIsDemo(false)
    } catch {
      const filtered = filter === 'all'
        ? DEMO_TRENDS
        : filter === 'processed'
          ? DEMO_TRENDS.filter(t => t.processed)
          : DEMO_TRENDS.filter(t => !t.processed)
      setTrends(filtered)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleGenerate = async (trend) => {
    setGenerating(g => ({ ...g, [trend.id]: true }))
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 1500)) // simulate delay
        setTrends(t => t.map(x => x.id === trend.id ? { ...x, processed: true } : x))
        addActivity('generate', `Contenido generado para "${trend.title.slice(0, 45)}…"`)
        toast.success('✨ Contenido generado (demo)')
      } else {
        await generateContent(trend.id)
        addActivity('generate', `Generando contenido para "${trend.title.slice(0, 45)}…"`)
        toast.success('✨ Generando contenido…')
        setTimeout(load, 2000)
      }
    } catch {
      toast.error('Error al generar contenido')
    } finally {
      setGenerating(g => ({ ...g, [trend.id]: false }))
    }
  }

  const handleDelete = async (id) => {
    if (isDemo) {
      setTrends(t => t.filter(x => x.id !== id))
      addActivity('delete', 'Tendencia eliminada (demo)')
      toast.success('Tendencia eliminada')
      return
    }
    try {
      await deleteTrend(id)
      setTrends(t => t.filter(x => x.id !== id))
      addActivity('delete', 'Tendencia eliminada')
      toast.success('Tendencia eliminada')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleFetch = async () => {
    if (isDemo) {
      toast('Backend no disponible — modo demo activo', { icon: '🔌' })
      return
    }
    try {
      await fetchTrends()
      addActivity('fetch', 'Monitoreo de tendencias iniciado')
      toast.success('🔍 Monitoreo iniciado')
    } catch {
      toast.error('Error al iniciar monitoreo')
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tendencias</h1>
          <p className="text-sm text-slate-500 dark:text-galaxy-400 mt-1">
            {isDemo
              ? <span className="text-amber-600 dark:text-amber-400 font-medium">Modo demo · {trends.length} tendencias</span>
              : `${trends.length} tendencias · Fuentes: RSS, Reddit`
            }
          </p>
        </div>
        <button onClick={handleFetch} className="btn-primary">
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Monitorear</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
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
        <div className="space-y-3">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={1} />
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
          {trends.map(trend => (
            <TrendCard
              key={trend.id}
              trend={trend}
              generating={!!generating[trend.id]}
              onGenerate={handleGenerate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
