import { useEffect, useState, useCallback } from 'react'
import { getDrafts } from '../api/client'
import { ChevronLeft, ChevronRight, FileText, Linkedin, Mail, BookOpen, CalendarDays } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
         isSameMonth, isSameDay, isToday, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { DEMO_DRAFTS } from '../data/demoData'

const CHANNEL_DOT = {
  linkedin:   { color: 'bg-blue-500',    label: 'LinkedIn',   icon: Linkedin },
  blog:       { color: 'bg-violet-500',  label: 'Blog',       icon: BookOpen },
  newsletter: { color: 'bg-emerald-500', label: 'Newsletter', icon: Mail },
}

const STATUS_RING = {
  pending:   'ring-amber-400',
  approved:  'ring-blue-400',
  published: 'ring-emerald-400',
  rejected:  'ring-red-400',
}

function DraftPill({ draft }) {
  const ch = CHANNEL_DOT[draft.channel] || { color: 'bg-slate-400', label: draft.channel, icon: FileText }
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs
                     bg-slate-100 dark:bg-galaxy-700 text-slate-700 dark:text-galaxy-200
                     truncate max-w-full`}
         title={draft.title}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ch.color}`} />
      <span className="truncate">{draft.title || draft.channel}</span>
    </div>
  )
}

export default function CalendarPage() {
  const [month, setMonth]     = useState(new Date())
  const [allDrafts, setAll]   = useState([])
  const [selected, setSelected] = useState(null)
  const [isDemo, setIsDemo]   = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await getDrafts({ limit: 200 })
      setAll(data)
      setIsDemo(false)
    } catch {
      setAll(DEMO_DRAFTS)
      setIsDemo(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const startPad = getDay(startOfMonth(month)) // 0=Sunday
  const paddingDays = Array(startPad).fill(null)

  const draftsForDay = (day) =>
    allDrafts.filter(d => isSameDay(new Date(d.created_at), day))

  const selectedDrafts = selected ? draftsForDay(selected) : []

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-brand-500" />
            Calendario Editorial
          </h1>
          <p className="text-sm text-slate-500 dark:text-galaxy-400 mt-1">
            {isDemo
              ? <span className="text-amber-600 dark:text-amber-400 font-medium">Modo demo</span>
              : `${allDrafts.length} borradores en total`}
          </p>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
            className="btn-ghost p-2">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-800 dark:text-galaxy-100 capitalize min-w-[140px] text-center">
            {format(month, 'MMMM yyyy', { locale: es })}
          </span>
          <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
            className="btn-ghost p-2">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {Object.entries(CHANNEL_DOT).map(([key, { color, label }]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-galaxy-400">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            {label}
          </span>
        ))}
        <span className="text-xs text-slate-400 dark:text-galaxy-500 ml-auto">
          Haz clic en un día para ver detalles
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calendar grid */}
        <div className="card p-4 lg:col-span-2">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 dark:text-galaxy-500 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(day => {
              const dayDrafts = draftsForDay(day)
              const isSelected = selected && isSameDay(day, selected)
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelected(isSameDay(day, selected) ? null : day)}
                  className={`min-h-[70px] p-1.5 rounded-xl text-left transition-all duration-150
                    ${!isSameMonth(day, month) ? 'opacity-30' : ''}
                    ${isToday(day)
                      ? 'bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-300 dark:ring-brand-500/50'
                      : 'hover:bg-slate-50 dark:hover:bg-galaxy-700'}
                    ${isSelected ? 'ring-2 ring-brand-400 dark:ring-brand-500 bg-brand-50 dark:bg-brand-500/10' : ''}
                  `}
                >
                  <span className={`text-xs font-semibold mb-1 block
                    ${isToday(day) ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-galaxy-300'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="space-y-0.5">
                    {dayDrafts.slice(0, 2).map(d => (
                      <DraftPill key={d.id} draft={d} />
                    ))}
                    {dayDrafts.length > 2 && (
                      <span className="text-xs text-slate-400 dark:text-galaxy-500 pl-1">
                        +{dayDrafts.length - 2} más
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="card p-5 h-fit">
          {selected ? (
            <>
              <h2 className="font-semibold text-slate-800 dark:text-galaxy-100 mb-1 capitalize">
                {format(selected, "EEEE d 'de' MMMM", { locale: es })}
              </h2>
              <p className="text-xs text-slate-400 dark:text-galaxy-500 mb-4">
                {selectedDrafts.length} borrador{selectedDrafts.length !== 1 ? 'es' : ''}
              </p>
              {selectedDrafts.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-galaxy-500 text-center py-8">
                  Sin contenido este día
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDrafts.map(d => {
                    const ch = CHANNEL_DOT[d.channel] || { color: 'bg-slate-400', label: d.channel, icon: FileText }
                    const ChIcon = ch.icon
                    const ring = STATUS_RING[d.status] || 'ring-slate-300'
                    return (
                      <div key={d.id} className={`p-3 rounded-xl bg-slate-50 dark:bg-galaxy-900/50 ring-1 ${ring}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-5 h-5 rounded flex items-center justify-center ${ch.color}`}>
                            <ChIcon className="w-3 h-3 text-white" />
                          </span>
                          <span className="text-xs font-semibold text-slate-600 dark:text-galaxy-300">
                            {ch.label}
                          </span>
                          <span className="ml-auto text-xs text-slate-400 dark:text-galaxy-500 capitalize">
                            {d.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 dark:text-galaxy-100 line-clamp-2">
                          {d.title || 'Sin título'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="w-10 h-10 text-slate-300 dark:text-galaxy-600 mb-3" />
              <p className="text-sm text-slate-500 dark:text-galaxy-400">
                Selecciona un día para ver<br />el contenido programado
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
