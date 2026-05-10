/**
 * PlatformValidator — shows platform-specific metrics for a draft body.
 * LinkedIn: character count · Blog: word count + reading time · Newsletter: subject preview
 */

function Bar({ value, max, color }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="h-1 bg-slate-100 dark:bg-galaxy-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold text-slate-800 dark:text-galaxy-100">{value}</p>
      <p className="text-xs text-slate-400 dark:text-galaxy-500">{label}</p>
      {sub && <p className="text-xs text-brand-500">{sub}</p>}
    </div>
  )
}

export function PlatformValidator({ channel, body }) {
  if (!body) return null

  if (channel === 'linkedin') {
    const len = body.length
    const optimal = len >= 700 && len <= 1000
    const tooLong = len > 1300
    const color = tooLong ? 'bg-red-500' : optimal ? 'bg-emerald-500' : 'bg-amber-500'
    const label = tooLong ? 'Demasiado largo — se truncará' : optimal ? 'Longitud óptima' : len < 700 ? 'Muy corto — añade más contexto' : 'Acercándose al límite'

    return (
      <div className="px-5 pb-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className={`font-medium ${tooLong ? 'text-red-500' : optimal ? 'text-emerald-500' : 'text-amber-500'}`}>
            {label}
          </span>
          <span className="font-mono text-slate-500 dark:text-galaxy-400">
            {len.toLocaleString()} / 1.300
          </span>
        </div>
        <Bar value={len} max={1300} color={color} />
      </div>
    )
  }

  if (channel === 'blog') {
    const words = body.split(/\s+/).filter(Boolean).length
    const readMin = Math.max(1, Math.ceil(words / 200))
    const seoOk = words >= 300 && words <= 1200

    return (
      <div className="px-5 pb-3">
        <div className="flex items-center gap-6">
          <Stat label="palabras" value={words.toLocaleString()} sub={seoOk ? 'Bueno para SEO' : words < 300 ? 'Muy corto' : 'Demasiado largo'} />
          <Stat label="lectura" value={`~${readMin} min`} />
          <div className="flex-1">
            <Bar value={words} max={900} color={seoOk ? 'bg-emerald-500' : words < 300 ? 'bg-red-500' : 'bg-amber-500'} />
          </div>
        </div>
      </div>
    )
  }

  if (channel === 'newsletter') {
    const subjectMatch = body.match(/<h2[^>]*>(.*?)<\/h2>/i)
    const subject = subjectMatch?.[1]?.replace(/<[^>]+>/g, '') ?? ''
    const subLen = subject.length
    const subOk = subLen >= 30 && subLen <= 60

    const wordCount = body.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
    const ok = wordCount <= 250

    return (
      <div className="px-5 pb-3 space-y-2">
        {subject && (
          <div>
            <p className="text-xs text-slate-400 dark:text-galaxy-500 mb-0.5">Asunto del email</p>
            <p className={`text-xs font-medium truncate ${subOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              "{subject}" — {subLen} chars {subOk ? '✓' : '(ideal: 30-60)'}
            </p>
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className={ok ? 'text-emerald-500' : 'text-red-500'}>
            {ok ? 'Longitud adecuada' : 'Demasiado largo'}
          </span>
          <span className="font-mono text-slate-400">{wordCount} / 250 palabras</span>
        </div>
        <Bar value={wordCount} max={250} color={ok ? 'bg-emerald-500' : 'bg-red-500'} />
      </div>
    )
  }

  return null
}
