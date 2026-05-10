import { useState } from 'react'
import {
  Settings, Building2, Users, MessageSquare, Rss, Bell,
  Webhook, Plus, Trash2, Save, RotateCcw, CheckCircle,
  Linkedin, BookOpen, Mail, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSettings, DEFAULT_SETTINGS } from '../context/SettingsContext'

const TONES = [
  { value: 'profesional',  label: 'Profesional',  desc: 'Serio, confiable, orientado a resultados' },
  { value: 'cercano',      label: 'Cercano',       desc: 'Amigable, conversacional, empático' },
  { value: 'técnico',      label: 'Técnico',       desc: 'Preciso, detallado, orientado a expertos' },
  { value: 'inspirador',   label: 'Inspirador',    desc: 'Motivador, visionario, con storytelling' },
]

const CHANNELS = [
  { key: 'linkedin',   label: 'LinkedIn',   icon: Linkedin, color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'blog',       label: 'Blog',       icon: BookOpen, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  { key: 'newsletter', label: 'Newsletter', icon: Mail,     color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
]

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card p-6">
      <h2 className="font-semibold text-slate-800 dark:text-galaxy-100 flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4 text-brand-500" />
        {title}
      </h2>
      {children}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-galaxy-200 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-400 dark:text-galaxy-500 mb-2">{hint}</p>}
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-xl text-sm
                 bg-slate-50 dark:bg-galaxy-900
                 border border-slate-200 dark:border-galaxy-600
                 text-slate-800 dark:text-galaxy-100
                 placeholder:text-slate-400 dark:placeholder:text-galaxy-600
                 focus:outline-none focus:ring-2 focus:ring-brand-400"
    />
  )
}

export default function SettingsPage() {
  const { settings, update, reset } = useSettings()
  const [newFeedUrl,   setNewFeedUrl]   = useState('')
  const [newFeedLabel, setNewFeedLabel] = useState('')
  const [newTopic,     setNewTopic]     = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    toast.success('✅ Configuración guardada')
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleChannel = (key) => {
    const current = settings.activeChannels
    const next = current.includes(key)
      ? current.filter(c => c !== key)
      : [...current, key]
    if (next.length === 0) return toast.error('Selecciona al menos un canal')
    update({ activeChannels: next })
  }

  const addFeed = () => {
    if (!newFeedUrl.trim()) return
    const feed = {
      id: Date.now().toString(),
      url: newFeedUrl.trim(),
      label: newFeedLabel.trim() || new URL(newFeedUrl).hostname,
    }
    update({ rssFeeds: [...settings.rssFeeds, feed] })
    setNewFeedUrl('')
    setNewFeedLabel('')
    toast.success('Feed RSS agregado')
  }

  const removeFeed = (id) => {
    update({ rssFeeds: settings.rssFeeds.filter(f => f.id !== id) })
  }

  const addTopic = () => {
    if (!newTopic.trim()) return
    if (settings.topics.includes(newTopic.trim())) return
    update({ topics: [...settings.topics, newTopic.trim()] })
    setNewTopic('')
  }

  const removeTopic = (t) => {
    update({ topics: settings.topics.filter(x => x !== t) })
  }

  const handleReset = () => {
    reset()
    toast('Configuración restaurada a valores por defecto', { icon: '↩️' })
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-500" />
            Configuración
          </h1>
          <p className="text-sm text-slate-500 dark:text-galaxy-400 mt-1">
            Personaliza el pipeline para tu marca y audiencia
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="btn-ghost">
            <RotateCcw className="w-4 h-4" /> Restaurar
          </button>
          <button onClick={handleSave} className="btn-primary">
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Guardado' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="space-y-6">

        {/* Perfil de marca */}
        <Section icon={Building2} title="Perfil de marca">
          <Field label="Nombre de la marca o empresa">
            <Input
              value={settings.brandName}
              onChange={v => update({ brandName: v })}
              placeholder="Ej. Agencia Growth LATAM"
            />
          </Field>

          <Field label="Audiencia objetivo"
            hint="Describe a quién va dirigido tu contenido. La IA lo usará para ajustar el tono y los ejemplos.">
            <textarea
              value={settings.targetAudience}
              onChange={e => update({ targetAudience: e.target.value })}
              rows={2}
              placeholder="Ej. Fundadores de startups B2B en LATAM con equipos de 10-50 personas"
              className="w-full px-3 py-2 rounded-xl text-sm resize-none
                         bg-slate-50 dark:bg-galaxy-900
                         border border-slate-200 dark:border-galaxy-600
                         text-slate-800 dark:text-galaxy-100
                         placeholder:text-slate-400
                         focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </Field>

          <Field label="Tono de voz" hint="Define cómo sonará el contenido generado.">
            <div className="grid grid-cols-2 gap-2">
              {TONES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => update({ brandTone: value })}
                  className={`p-3 rounded-xl border text-left transition-all
                    ${settings.brandTone === value
                      ? 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                      : 'border-slate-200 dark:border-galaxy-600 hover:border-brand-300'}`}
                >
                  <p className={`text-sm font-semibold ${settings.brandTone === value ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-galaxy-200'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-galaxy-500 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* Canales activos */}
        <Section icon={MessageSquare} title="Canales de publicación">
          <p className="text-xs text-slate-400 dark:text-galaxy-500 mb-4">
            El pipeline generará un borrador por cada canal seleccionado.
          </p>
          <div className="space-y-2">
            {CHANNELS.map(({ key, label, icon: Icon, color, bg }) => {
              const active = settings.activeChannels.includes(key)
              return (
                <button
                  key={key}
                  onClick={() => toggleChannel(key)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all
                    ${active
                      ? 'border-brand-300 dark:border-brand-500/50 bg-brand-50/50 dark:bg-brand-500/5'
                      : 'border-slate-200 dark:border-galaxy-600 opacity-50'}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-slate-800 dark:text-galaxy-100">{label}</p>
                    <p className="text-xs text-slate-400 dark:text-galaxy-500">
                      {key === 'linkedin' && 'Post optimizado para engagement · máx. 1.300 chars'}
                      {key === 'blog' && 'Artículo completo en Markdown · 600-900 palabras'}
                      {key === 'newsletter' && 'Sección HTML lista para enviar · máx. 250 palabras'}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${active ? 'border-brand-500 bg-brand-500' : 'border-slate-300 dark:border-galaxy-500'}`}>
                    {active && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        </Section>

        {/* Topics */}
        <Section icon={Users} title="Temas de interés">
          <p className="text-xs text-slate-400 dark:text-galaxy-500 mb-3">
            El pipeline prioriza tendencias relacionadas con estos temas.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {settings.topics.map(t => (
              <span key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm
                           bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400
                           border border-brand-200 dark:border-brand-500/30">
                {t}
                <button onClick={() => removeTopic(t)}
                  className="hover:text-red-500 transition-colors ml-0.5">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTopic()}
              placeholder="Agregar tema (Enter para añadir)"
              className="flex-1 px-3 py-2 rounded-xl text-sm
                         bg-slate-50 dark:bg-galaxy-900
                         border border-slate-200 dark:border-galaxy-600
                         text-slate-800 dark:text-galaxy-100
                         placeholder:text-slate-400
                         focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button onClick={addTopic} className="btn-primary">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </Section>

        {/* RSS Feeds */}
        <Section icon={Rss} title="Fuentes RSS">
          <p className="text-xs text-slate-400 dark:text-galaxy-500 mb-3">
            El pipeline monitorea estas fuentes cada 6 horas.
          </p>
          <div className="space-y-2 mb-4">
            {settings.rssFeeds.map(feed => (
              <div key={feed.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl
                           bg-slate-50 dark:bg-galaxy-900/50
                           border border-slate-100 dark:border-galaxy-700">
                <Rss className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-galaxy-100">{feed.label}</p>
                  <p className="text-xs text-slate-400 dark:text-galaxy-500 truncate">{feed.url}</p>
                </div>
                <button onClick={() => removeFeed(feed.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              value={newFeedLabel}
              onChange={e => setNewFeedLabel(e.target.value)}
              placeholder="Nombre"
              className="px-3 py-2 rounded-xl text-sm
                         bg-slate-50 dark:bg-galaxy-900
                         border border-slate-200 dark:border-galaxy-600
                         text-slate-800 dark:text-galaxy-100
                         placeholder:text-slate-400
                         focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <input
              value={newFeedUrl}
              onChange={e => setNewFeedUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addFeed()}
              placeholder="https://ejemplo.com/feed"
              className="col-span-2 px-3 py-2 rounded-xl text-sm
                         bg-slate-50 dark:bg-galaxy-900
                         border border-slate-200 dark:border-galaxy-600
                         text-slate-800 dark:text-galaxy-100
                         placeholder:text-slate-400
                         focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <button onClick={addFeed} className="btn-ghost mt-2 text-xs">
            <Plus className="w-3.5 h-3.5" /> Agregar feed
          </button>
        </Section>

        {/* Notificaciones y Webhook */}
        <Section icon={Bell} title="Notificaciones y automatización">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => update({ emailNotifications: !settings.emailNotifications })}
                className={`mt-0.5 w-10 h-6 rounded-full relative transition-colors flex-shrink-0
                  ${settings.emailNotifications ? 'bg-brand-500' : 'bg-slate-200 dark:bg-galaxy-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform
                  ${settings.emailNotifications ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-galaxy-100">
                  Notificaciones por email
                </p>
                <p className="text-xs text-slate-400 dark:text-galaxy-500">
                  Recibe un resumen cuando hay borradores listos para revisar
                </p>
                {settings.emailNotifications && (
                  <div className="mt-2">
                    <Input
                      value={settings.emailAddress}
                      onChange={v => update({ emailAddress: v })}
                      placeholder="tu@empresa.com"
                      type="email"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-galaxy-700">
              <div className="flex items-center gap-2 mb-2">
                <Webhook className="w-4 h-4 text-slate-400" />
                <p className="text-sm font-medium text-slate-800 dark:text-galaxy-100">Webhook URL</p>
              </div>
              <p className="text-xs text-slate-400 dark:text-galaxy-500 mb-2">
                Se dispara cuando un borrador es aprobado. Compatible con Zapier, Make, n8n.
              </p>
              <Input
                value={settings.webhookUrl}
                onChange={v => update({ webhookUrl: v })}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
              />
            </div>
          </div>
        </Section>

        {/* ROI config */}
        <Section icon={ChevronDown} title="Parámetros de ROI">
          <p className="text-xs text-slate-400 dark:text-galaxy-500 mb-4">
            Usados para calcular el tiempo y dinero que ahorras con el pipeline.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Posts por semana (manual)">
              <div className="flex items-center gap-2">
                <input
                  type="range" min={1} max={20}
                  value={settings.postsPerWeek}
                  onChange={e => update({ postsPerWeek: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400 w-6">{settings.postsPerWeek}</span>
              </div>
            </Field>
            <Field label="Minutos por post (manual)">
              <div className="flex items-center gap-2">
                <input
                  type="range" min={15} max={180} step={15}
                  value={settings.minutesPerPost}
                  onChange={e => update({ minutesPerPost: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400 w-8">{settings.minutesPerPost}m</span>
              </div>
            </Field>
          </div>
        </Section>

      </div>

      {/* Bottom save */}
      <div className="flex justify-end gap-3 mt-8">
        <button onClick={handleReset} className="btn-ghost">
          <RotateCcw className="w-4 h-4" /> Restaurar defaults
        </button>
        <button onClick={handleSave} className="btn-primary">
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? '¡Guardado!' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  )
}
