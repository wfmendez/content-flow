import { useEffect, useState, useCallback } from 'react'
import { getDrafts, approveDraft, rejectDraft, publishDraft, deleteDraft, updateDraft } from '../api/client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CheckCircle, XCircle, Send, Trash2, Edit3, Save, X,
  ChevronDown, ChevronUp, FileText, Linkedin, Mail, BookOpen,
  AlertTriangle, Cpu, ChevronRight, Copy, History, RotateCcw,
  CheckSquare, Square, Layers
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useActivity } from '../context/ActivityContext'
import { DEMO_DRAFTS } from '../data/demoData'
import { SkeletonCard } from '../components/SkeletonCard'
import { ContentPreview } from '../components/ContentPreview'
import { PlatformValidator } from '../components/PlatformValidator'
import { getDraftVersions, restoreVersion as apiRestoreVersion, bulkAction } from '../api/client'

// ── AI transparency panel ──────────────────────────────────────────────────────

function AiPanel({ draft }) {
  const [open, setOpen] = useState(false)
  const hasAi = draft.ai_model || draft.tokens_input

  if (!hasAi) return null

  const totalTokens = (draft.tokens_input ?? 0) + (draft.tokens_output ?? 0)
  const cost = draft.generation_cost_usd != null
    ? draft.generation_cost_usd < 0.001
      ? `< $0.001`
      : `$${draft.generation_cost_usd.toFixed(4)}`
    : '—'

  return (
    <div className="border-t border-slate-100 dark:border-galaxy-700 mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-5 py-2.5 text-xs
                   text-slate-400 dark:text-galaxy-500
                   hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
      >
        <Cpu className="w-3.5 h-3.5" />
        <span className="font-medium">Transparencia IA</span>
        <span className="ml-auto flex items-center gap-3">
          <span className="font-mono">{draft.ai_model ?? '—'}</span>
          <span>{totalTokens.toLocaleString()} tokens · {cost}</span>
          <ChevronRight className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="px-5 pb-4 space-y-3 animate-fade-in">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Modelo', value: draft.ai_model ?? '—' },
              { label: 'Tokens entrada', value: (draft.tokens_input ?? 0).toLocaleString() },
              { label: 'Tokens salida', value: (draft.tokens_output ?? 0).toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-galaxy-900/60 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400 dark:text-galaxy-500 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-galaxy-100 font-mono">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-slate-400 dark:text-galaxy-500">Costo estimado</span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{cost}</span>
          </div>

          {/* Prompt used */}
          {draft.prompt_used && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-galaxy-400 mb-1.5">Prompt utilizado</p>
              <div className="bg-slate-950/5 dark:bg-black/30 rounded-xl p-3 max-h-36 overflow-y-auto">
                <pre className="text-xs text-slate-600 dark:text-galaxy-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {draft.prompt_used}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Version history panel ──────────────────────────────────────────────────────

function VersionHistory({ draftId, isDemo, onRestored }) {
  const [open, setOpen] = useState(false)
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(null)

  const load = async () => {
    if (isDemo) {
      // Demo: show fake version history
      setVersions([
        { id: 1, version_number: 1, note: 'Generado por IA', created_at: new Date(Date.now() - 3600000).toISOString(), body: '(versión original de la IA)' },
      ])
      return
    }
    setLoading(true)
    try {
      const { data } = await getDraftVersions(draftId)
      setVersions(data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  const handleOpen = () => {
    if (!open) load()
    setOpen(o => !o)
  }

  const handleRestore = async (v) => {
    if (isDemo) {
      toast.success(`Versión v${v.version_number} restaurada (demo)`)
      setOpen(false)
      return
    }
    setRestoring(v.id)
    try {
      const { data } = await apiRestoreVersion(draftId, v.id)
      onRestored(data)
      toast.success(`✅ Versión v${v.version_number} restaurada`)
      setOpen(false)
    } catch {
      toast.error('Error al restaurar')
    } finally {
      setRestoring(null)
    }
  }

  return (
    <div className="border-t border-slate-100 dark:border-galaxy-700 mt-2">
      <button
        onClick={handleOpen}
        className="w-full flex items-center gap-2 px-5 py-2.5 text-xs
                   text-slate-400 dark:text-galaxy-500
                   hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
      >
        <History className="w-3.5 h-3.5" />
        <span className="font-medium">Historial de versiones</span>
        {versions.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-galaxy-700 text-slate-500 dark:text-galaxy-400">
            {versions.length}
          </span>
        )}
        <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-4 space-y-2 animate-fade-in">
          {loading ? (
            <p className="text-xs text-slate-400 dark:text-galaxy-500 py-2">Cargando versiones…</p>
          ) : versions.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-galaxy-500 py-2">Sin ediciones anteriores.</p>
          ) : (
            versions.map(v => (
              <div key={v.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl
                           bg-slate-50 dark:bg-galaxy-900/60
                           border border-slate-100 dark:border-galaxy-700">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-slate-700 dark:text-galaxy-200">
                      v{v.version_number}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-galaxy-500 truncate">{v.note}</span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-galaxy-500">
                    {new Date(v.created_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <button
                  onClick={() => handleRestore(v)}
                  disabled={restoring === v.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                             bg-white dark:bg-galaxy-800 border border-slate-200 dark:border-galaxy-600
                             text-slate-600 dark:text-galaxy-300
                             hover:border-brand-300 dark:hover:border-brand-500/50 transition-all flex-shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  {restoring === v.id ? 'Restaurando…' : 'Restaurar'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

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

function DraftCard({ draft, onApprove, onReject, onPublish, onDelete, onSave, onRestored,
                     selected, onToggleSelect, isDemo }) {
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
                     hover:shadow-md dark:hover:shadow-glow-sm transition-all duration-200
                     ${selected ? 'ring-2 ring-brand-400 dark:ring-brand-500' : ''}`}>

      {/* Header row */}
      <div className="px-5 py-4 flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggleSelect(draft.id)}
          className="flex-shrink-0 text-slate-300 dark:text-galaxy-600 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
        >
          {selected
            ? <CheckSquare className="w-4 h-4 text-brand-500" />
            : <Square className="w-4 h-4" />
          }
        </button>
        <div className="flex-1 flex items-center gap-3 cursor-pointer min-w-0"
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

          {/* Platform validator */}
          {!editing && <PlatformValidator channel={draft.channel} body={draft.body} />}

          {/* Content preview */}
          {!editing && <ContentPreview draft={draft} />}

          {/* AI transparency panel */}
          {!editing && <AiPanel draft={draft} />}

          {/* Version history */}
          {!editing && (
            <VersionHistory
              draftId={draft.id}
              isDemo={isDemo}
              onRestored={(updated) => onRestored(draft.id, updated)}
            />
          )}

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

              <button
                onClick={() => {
                  navigator.clipboard.writeText(draft.body ?? '')
                    .then(() => toast.success('📋 Copiado al portapapeles'))
                    .catch(() => toast.error('No se pudo copiar'))
                }}
                className="btn-ghost py-1.5 text-xs"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar
              </button>

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
  const [drafts, setDrafts]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('pending')
  const [isDemo, setIsDemo]       = useState(false)
  const [selected, setSelected]   = useState(new Set())
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(0)
  const PAGE_SIZE = 20

  const { addActivity } = useActivity()

  // Update pending badge in nav
  const updateBadge = useCallback((list) => {
    const count = list.filter(d => d.status === 'pending').length
    sessionStorage.setItem('cf-pending', String(count))
    window.dispatchEvent(new Event('cf-pending-update'))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())
    try {
      const params = {
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
        ...(filter !== 'all' ? { status: filter } : {}),
      }
      const res = await getDrafts(params)
      setDrafts(res.data)
      setTotal(parseInt(res.headers?.['x-total-count'] ?? res.data.length, 10))
      setIsDemo(false)
      updateBadge(res.data)
    } catch {
      // Demo mode fallback
      const filtered = filter === 'all'
        ? DEMO_DRAFTS
        : DEMO_DRAFTS.filter(d => d.status === filter)
      setDrafts(filtered)
      setTotal(filtered.length)
      setIsDemo(true)
      updateBadge(DEMO_DRAFTS)
    } finally {
      setLoading(false)
    }
  }, [filter, page, updateBadge])

  useEffect(() => { setPage(0) }, [filter])
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

  // ── Selection helpers ─────────────────────────────────────────────────────
  const toggleSelect = (id) =>
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const toggleSelectAll = () =>
    setSelected(s => s.size === drafts.length ? new Set() : new Set(drafts.map(d => d.id)))

  const handleBulk = async (action) => {
    const ids = [...selected]
    if (!ids.length) return
    if (isDemo) {
      if (action === 'delete') setDrafts(d => d.filter(x => !ids.includes(x.id)))
      else setDrafts(d => d.map(x => ids.includes(x.id) ? { ...x, status: action === 'approve' ? 'approved' : 'rejected' } : x))
      setSelected(new Set())
      toast.success(`${ids.length} borradores actualizados (demo)`)
      return
    }
    try {
      const { data } = await bulkAction(ids, action)
      toast.success(`${data.affected} borradores actualizados`)
      addActivity(action, `${data.affected} borradores en lote`)
      load()
    } catch {
      toast.error('Error en acción en lote')
    }
  }

  // ── Version restore callback ──────────────────────────────────────────────
  const handleRestored = (draftId, updated) => {
    setDrafts(d => d.map(x => x.id === draftId ? updated : x))
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

      {/* Filtros + select all */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
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
        {drafts.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                       text-slate-500 dark:text-galaxy-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
          >
            {selected.size === drafts.length
              ? <CheckSquare className="w-3.5 h-3.5 text-brand-500" />
              : <Square className="w-3.5 h-3.5" />
            }
            {selected.size === drafts.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-in
                        bg-brand-50 dark:bg-brand-500/10
                        border border-brand-200 dark:border-brand-500/30">
          <Layers className="w-4 h-4 text-brand-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-brand-700 dark:text-brand-400 flex-1">
            {selected.size} seleccionado{selected.size > 1 ? 's' : ''}
          </span>
          <button onClick={() => handleBulk('approve')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                       bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
            <CheckCircle className="w-3.5 h-3.5" /> Aprobar todos
          </button>
          <button onClick={() => handleBulk('reject')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                       bg-white dark:bg-galaxy-800 border border-slate-200 dark:border-galaxy-600
                       text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
            <XCircle className="w-3.5 h-3.5" /> Rechazar todos
          </button>
          <button onClick={() => handleBulk('delete')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                       text-slate-500 dark:text-galaxy-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
              onRestored={handleRestored}
              selected={selected.has(draft.id)}
              onToggleSelect={toggleSelect}
              isDemo={isDemo}
            />
          ))}
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-galaxy-700">
            <span className="text-xs text-slate-400 dark:text-galaxy-500">
              Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-xl text-xs font-medium
                           bg-white dark:bg-galaxy-800 border border-slate-200 dark:border-galaxy-600
                           text-slate-600 dark:text-galaxy-300
                           disabled:opacity-40 hover:border-brand-300 dark:hover:border-brand-500/50 transition-all"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * PAGE_SIZE >= total}
                className="px-3 py-1.5 rounded-xl text-xs font-medium
                           bg-white dark:bg-galaxy-800 border border-slate-200 dark:border-galaxy-600
                           text-slate-600 dark:text-galaxy-300
                           disabled:opacity-40 hover:border-brand-300 dark:hover:border-brand-500/50 transition-all"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      )}
    </div>
  )
}
