/**
 * ContentPreview — renders a draft as it would appear on its target platform.
 * LinkedIn: mock post card · Blog: rendered Markdown · Newsletter: rendered HTML
 */
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// ── Tiny Markdown → HTML renderer (no external deps) ─────────────────────────
function mdToHtml(md) {
  if (!md) return ''
  return md
    .replace(/^# (.+)$/gm,   '<h1 class="text-xl font-bold text-slate-900 dark:text-white mb-3 mt-4">$1</h1>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-base font-bold text-slate-800 dark:text-galaxy-100 mb-2 mt-4">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-slate-700 dark:text-galaxy-200 mb-1 mt-3">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-white">$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em class="italic">$1</em>')
    .replace(/^- (.+)$/gm,   '<li class="ml-4 list-disc text-slate-700 dark:text-galaxy-200 mb-1">$1</li>')
    .replace(/^\d+\. (.+)$/gm,'<li class="ml-4 list-decimal text-slate-700 dark:text-galaxy-200 mb-1">$1</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-brand-500 hover:underline" target="_blank" rel="noopener">$1</a>')
    .replace(/^---$/gm, '<hr class="border-slate-200 dark:border-galaxy-600 my-4">')
    .replace(/\n\n/g, '</p><p class="text-sm text-slate-700 dark:text-galaxy-200 leading-relaxed mb-3">')
    .replace(/^(?!<[hl]|<li|<hr)(.+)$/gm, '')  // handled by wrapping below
}

function BlogPreview({ body }) {
  return (
    <div className="prose-like bg-white dark:bg-galaxy-900/80 rounded-xl p-5 max-h-96 overflow-y-auto">
      <div
        className="text-sm text-slate-700 dark:text-galaxy-200 leading-relaxed space-y-2"
        dangerouslySetInnerHTML={{
          __html: `<p class="text-sm text-slate-700 dark:text-galaxy-200 leading-relaxed mb-3">${mdToHtml(body)}</p>`
        }}
      />
    </div>
  )
}

function LinkedInPreview({ title, body }) {
  const [expanded, setExpanded] = useState(false)
  const TRUNCATE = 300
  const text = body || ''
  const needsTruncate = text.length > TRUNCATE

  return (
    <div className="bg-white dark:bg-galaxy-900/80 rounded-xl border border-slate-200 dark:border-galaxy-600 overflow-hidden">
      {/* Mock LinkedIn header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-100 dark:border-galaxy-700">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          CF
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">ContentFlow Demo</p>
          <p className="text-xs text-slate-400 dark:text-galaxy-500">Founder · 1st · Just now</p>
        </div>
      </div>

      {/* Post body */}
      <div className="px-4 py-3">
        <p className="text-sm text-slate-800 dark:text-galaxy-100 whitespace-pre-wrap leading-relaxed">
          {needsTruncate && !expanded ? text.slice(0, TRUNCATE) + '…' : text}
        </p>
        {needsTruncate && (
          <button onClick={() => setExpanded(e => !e)}
            className="text-xs text-slate-500 dark:text-galaxy-400 font-semibold hover:underline mt-1">
            {expanded ? 'ver menos' : '...ver más'}
          </button>
        )}
      </div>

      {/* Mock LinkedIn footer */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-100 dark:border-galaxy-700 text-xs text-slate-400 dark:text-galaxy-500">
        <span>👍 Me gusta</span>
        <span>💬 Comentar</span>
        <span>🔁 Compartir</span>
        <span>✉️ Enviar</span>
      </div>
    </div>
  )
}

function NewsletterPreview({ body }) {
  return (
    <div className="bg-white dark:bg-galaxy-900/80 rounded-xl border border-slate-200 dark:border-galaxy-600 overflow-hidden">
      {/* Mock email header */}
      <div className="bg-slate-50 dark:bg-galaxy-900 px-4 py-3 border-b border-slate-200 dark:border-galaxy-600">
        <div className="space-y-1 text-xs text-slate-500 dark:text-galaxy-400">
          <div className="flex gap-2"><span className="font-medium w-12">De:</span><span>ContentFlow Newsletter &lt;hello@contentflow.io&gt;</span></div>
          <div className="flex gap-2"><span className="font-medium w-12">Para:</span><span>tu@empresa.com</span></div>
          <div className="flex gap-2"><span className="font-medium w-12">Asunto:</span>
            <span className="text-slate-700 dark:text-galaxy-200 font-medium">
              {body?.match(/<h2[^>]*>(.*?)<\/h2>/i)?.[1]?.replace(/<[^>]+>/g, '') ?? 'Nueva edición de tu newsletter'}
            </span>
          </div>
        </div>
      </div>
      <div
        className="px-5 py-4 max-h-80 overflow-y-auto text-sm text-slate-700 dark:text-galaxy-200 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: body || '' }}
      />
    </div>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

export function ContentPreview({ draft }) {
  const [show, setShow] = useState(false)

  const label = { linkedin: 'LinkedIn', blog: 'Blog', newsletter: 'Newsletter' }[draft.channel] ?? draft.channel

  return (
    <div className="border-t border-slate-100 dark:border-galaxy-700 mt-2">
      <button
        onClick={() => setShow(s => !s)}
        className="w-full flex items-center gap-2 px-5 py-2.5 text-xs
                   text-slate-400 dark:text-galaxy-500
                   hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
      >
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        <span className="font-medium">
          {show ? 'Ocultar vista previa' : `Vista previa — como se verá en ${label}`}
        </span>
      </button>

      {show && (
        <div className="px-5 pb-5 animate-fade-in">
          {draft.channel === 'linkedin'   && <LinkedInPreview  title={draft.title} body={draft.body} />}
          {draft.channel === 'blog'       && <BlogPreview      body={draft.body} />}
          {draft.channel === 'newsletter' && <NewsletterPreview body={draft.body} />}
        </div>
      )}
    </div>
  )
}
