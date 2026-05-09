import { useEffect, useState, useCallback } from 'react'
import { getDrafts, approveDraft, rejectDraft, publishDraft, deleteDraft, updateDraft } from '../api/client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CheckCircle, XCircle, Send, Trash2, Edit3, Save, X,
  ChevronDown, ChevronUp, FileText, Linkedin, Mail, BookOpen, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useActivity } from '../context/ActivityContext'
import { DEMO_DRAFTS } from '../data/demoData'
import { SkeletonCard } from '../components/SkeletonCard'

// ── Config ─────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:   { cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',            label: 'Pendiente' },
  approved:  { cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',                label: 'Aprobado'  },
  rejected:  { cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',                    label: 'Rechazado' },
  published: { cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',    label: 'Publicado' },
}

const CHANNEL_CONFIG = {
  linkedin:   { icon: Linkedin, label: 'LinkedIn',   cls: 'bg-blue-600',    light: 'text-blue-600 dark:text-blue-400',    border: 'border-l-blue-500'    },
  blog:       { icon: BookOpen, label: 'Blog',       cls: 'bg-violet-600',  light: 'text-violet-600 dark:text-violet-400', border: 'border-l-violet-500'  },
  newsletter: { icon: Mail,     label: 'Newsletter', cls: 'bg-emerald-600', light: 'text-emerald-600 dark:text-emerald-400', border: 'border-l-emerald-500'},
}

const FILTERS = [
  ['pending', 'Pendientes'],
  ['approved', 'Aprobados'],
  ['published', 'Publicados'],
  ['rejected', 'Rechazados'],
  ['all', 'Todos'],
]

// ── Inline confirm row ─────────────────────────────────────────────────────────

function ConfirmRow({ message, onConfirm, onCancel, danger = true }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-in
                     ${danger
                       ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50'
                       : 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800/50'}`}>
      <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${danger ? 'text-red-500' : 'text-brand-500'}`} />
      <p className={`text-sm flex-1 ${danger ? 'text-red-700 dark:text-red-300' : 'text-brand-700 dark:text-brand-300'}`}>
        {message}
      </p>
      <button
        onClick={onConfirm}
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors
                    ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-500 hover:bg-brand-600'}`}
      >
        Confirmar
      </button>
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold
                   text-slate-600 dark:text-galaxy-300 bg-white dark:bg-galaxy-800
                   border border-slate-200 dark:border-galaxy-600 hover:border-slate-300 transition-colors"
      >
        Cancelar
      </button>
    </div>
  )
}

// ── Draft card ─────────────────────────────────────────────────────────────────

function DraftCard({ draft, onApprove, onReject, onPublish, onDelete, onSave }) {
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState(false)
  const [body, setBody]         = useState(draft.body)
  const [confirm, setConfirm]   = useState(null) // 'delete' | 'publish' | null

  const status  = STATUS_CONFIG[draft.status]  || STATUS_CONFIG.pending
  const channel = CHANNEL_CONFIG[draft.channel] || { icon: FileText, label: draft.channel, cls: 'bg-slate-500', light: 'text-slate-500', border: 'border-l-slate-400' }
  const ChanIcon = channel.icon

  const handleSave = async () => {
    await onSave(draft.id, body)
    setEditing(false)
  }

  return (
    <div className={`card overflow-hidden border-l-4 ${channel.border}
                     hover:shadow-md dark:hover:shadow-glow-sm transition-all duration-200`}>

      {/* Header row */}
      <div className="px-5 py-4 flex items-center gap-3 cursor-pointer"
           onClick={() => { if (!confirm) setOpen(o => !o) }}>

        <div className={`w-8 h-8 rounded-lg ${channel.cls} flex items-center justify-center flex-shrink-0`}>
          <ChanIcon className="w-4 h-4 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`badge ${status.cls}`}>{status.label}</span>
            <span className={`text-xs font-semibold ${channel.light}`}>{channel.label}</span>
            {draft.trend && (
              <span className="text-xs text-slate-400 dark:text-galaxy-500 truncate max-w-xs hidden sm:block">
                ↳ {draft.trend.title}
              </span>
            )}
            <span className="text-xs text-slate-400 dark:text-galaxy-500 ml-auto">
              {formatDistanceToNow(new Date(draft.created_at), { addSuffix: true, locale: es })}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {draft.title || 'Sin título'}
          </p>
        </div>

        <div className="flex-shrink-0 text-slate-400 dark:text-galaxy-500">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Confirm row (inline — replaces modal) */}
      {confirm && (
        <div className="px-5 pb-4">
          {confirm === 'delete' && (
            <ConfirmRow
              message="¿Eliminar este borrador? Esta acción no se puede deshacer."
              danger
              onConfirm={() => { onDelete(draft.id); setConfirm(null) }}
              onCancel={() => setConfirm(null)}
            />
          )}
          {confirm === 'publish' && (
            <ConfirmRow
              message="¿Publicar este borrador ahora?"
              danger={false}
              onConfirm={() => { onPublish(draft.id); setConfirm(null) }}
              onCancel={() => setConfirm(null)}
            />
          )}
        </div>
      )}

      {/* Expanded body */}
      {open && (
        <div className="border-t border-slate-100 dark:border-galaxy-700 px-5 py-4 animate-fade-in">

          {editing ? (
            <>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={12}
                className="w-full text-sm bg-slate-50 dark:bg-galaxy-900 border border-slate-200 dark:border-galaxy-600
                           rounded-xl p-4 font-mono text-slate-800 dark:text-galaxy-100
                           focus:outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-brand-500
                           resize-y placeholder:text-slate-400"
              />
              <div className="flex gap-2 mt-3">
                <button onClick={handleSave} className="btn-primary py-1.5 text-xs">
                  <Save className="w-3.5 h-3.5" /> Guardar
                </button>
                <button onClick={() => { setEditing(false); setBody(draft.body) }}
                  className="btn-ghost py-1.5 text-xs">
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
              </div>
            </>
          ) : (
            <div className="bg-slate-50 dark:bg-galaxy-900/50 rounded-xl p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-slate-700 dark:text-galaxy-200 whitespace-pre-wrap font-sans leading-relaxed">
                {draft.body}
              </pre>
            </div>
          )}

          {/* Action bar */}
          {!editing && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-galaxy-700 flex-wrap">
              {draft.status === 'pending' && (<>
                <button onClick={() => onApprove(draft.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                             bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
                  <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                </button>
                <button onClick={() => onReject(draft.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                             bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40
                             text-red-600 dark:text-red-400 transition-colors">
                  <XCircle className="w-3.5 h-3.5" /> Rechazar
                </button>
              </>)}

              {draft.status === 'approved' && (
                <button onClick={() => { setConfirm('publish'); setOpen(true) }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                             bg-brand-500 hover:bg-brand-600 dark:hover:shadow-glow-sm text-white transition-all">
                  <Send className="w-3.5 h-3.5" /> Publicar
                </button>
              )}

              {draft.status !== 'published' && (
                <button onClick={() => setEditing(true)} className="btn-ghost py-1.5 text-xs">
                  <Edit3 className="w-3.5 h-3.5" /> Editar
                </button>
              )}

              <button onClick={() => { setConfirm('delete'); setOpen(true) }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ml-auto
                           text-slate-400 dark:text-galaxy-500 hover:text-red-500 dark:hover:text-red-400
                           hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ContentPage() {
  const [drafts, setDrafts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('pending')
  const [isDemo, setIsDemo]   = useState(false)

  const { addActivity } = useActivity()

  // Update pending badge in nav
  const updateBadge = useCallback((list) => {
    const count = list.filter(d => d.status === 'pending').length
    sessionStorage.setItem('cf-pending', String(count))
    window.dispatchEvent(new Event('cf-pending-update'))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const { data } = await getDrafts(params)
      setDrafts(data)
      setIsDemo(false)
      updateBadge(data)
    } catch {
      // Demo mode fallback
      const filtered = filter === 'all'
        ? DEMO_DRAFTS
        : DEMO_DRAFTS.filter(d => d.status === filter)
      setDrafts(filtered)
      setIsDemo(true)
      updateBadge(DEMO_DRAFTS)
    } finally {
      setLoading(false)
    }
  }, [filter, updateBadge])

  useEffect(() => { load() }, [load])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleApprove = async (id) => {
    if (isDemo) {
      setDrafts(d => d.map(x => x.id === id ? { ...x, status: 'approved' } : x))
      addActivity('approve', `Borrador aprobado (demo)`)
      toast.success('✅ Borrador aprobado')
      return
    }
    try {
      const { data } = await approveDraft(id)
      setDrafts(d => d.map(x => x.id === id ? data : x))
      addActivity('approve', `Borrador "${data.title?.slice(0, 40)}…" aprobado`)
      toast.success('✅ Borrador aprobado')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al aprobar')
    }
  }

  const handleReject = async (id) => {
    if (isDemo) {
      setDrafts(d => d.map(x => x.id === id ? { ...x, status: 'rejected' } : x))
      addActivity('reject', `Borrador rechazado (demo)`)
      toast('Borrador rechazado', { icon: '❌' })
      return
    }
    try {
      const { data } = await rejectDraft(id)
      setDrafts(d => d.map(x => x.id === id ? data : x))
      addActivity('reject', `Borrador "${data.title?.slice(0, 40)}…" rechazado`)
      toast('Borrador rechazado', { icon: '❌' })
    } catch {
      toast.error('Error al rechazar')
    }
  }

  const handlePublish = async (id) => {
    if (isDemo) {
      setDrafts(d => d.map(x => x.id === id ? { ...x, status: 'published' } : x))
      addActivity('publish', 'Borrador publicado (demo)')
      toast.success('🚀 Publicación en cola')
      return
    }
    try {
      await publishDraft(id)
      addActivity('publish', 'Borrador enviado a publicación')
      toast.success('🚀 Publicación en cola')
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al publicar')
    }
  }

  const handleDelete = async (id) => {
    const draft = drafts.find(d => d.id === id)
    if (isDemo) {
      setDrafts(d => d.filter(x => x.id !== id))
      addActivity('delete', `Borrador eliminado (demo)`)
      toast.success('Borrador eliminado')
      return
    }
    try {
      await deleteDraft(id)
      setDrafts(d => d.filter(x => x.id !== id))
      addActivity('delete', `Borrador "${draft?.title?.slice(0, 40)}…" eliminado`)
      toast.success('Borrador eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleSave = async (id, body) => {
    if (isDemo) {
      setDrafts(d => d.map(x => x.id === id ? { ...x, body } : x))
      toast.success('Borrador actualizado')
      return
    }
    try {
      const { data } = await updateDraft(id, { body })
      setDrafts(d => d.map(x => x.id === id ? data : x))
      toast.success('Borrador actualizado')
    } catch {
      toast.error('Error al guardar')
    }
  }

  const pendingCount = drafts.filter(d => d.status === 'pending').length

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Revisión de Contenido</h1>
          <p className="text-sm text-slate-500 dark:text-galaxy-400 mt-1 flex items-center gap-2">
            {isDemo
              ? <span className="text-amber-600 dark:text-amber-400 font-medium">Modo demo</span>
              : <span>{drafts.length} borradores</span>
            }
            {filter === 'pending' && pendingCount > 0 && (
              <span className="badge bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                {pendingCount} esperando
              </span>
            )}
          </p>
        </div>
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

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={1} />
        </div>
      ) : drafts.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-violet-400" />
          </div>
          <p className="font-semibold text-slate-700 dark:text-galaxy-200 mb-1">Sin borradores</p>
          <p className="text-sm text-slate-500 dark:text-galaxy-400">
            {filter !== 'all'
              ? `No hay borradores con estado "${filter}"`
              : 'Genera contenido desde la sección Tendencias'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 animate-slide-up">
          {drafts.map(draft => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onApprove={handleApprove}
              onReject={handleReject}
              onPublish={handlePublish}
              onDelete={handleDelete}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  )
}
