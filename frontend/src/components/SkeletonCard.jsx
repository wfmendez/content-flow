/** Animated skeleton placeholder for loading states */
export function SkeletonCard({ lines = 2 }) {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-galaxy-700 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-galaxy-700 rounded-full w-1/3" />
          <div className="h-4 bg-slate-200 dark:bg-galaxy-700 rounded-full w-4/5" />
        </div>
        <div className="w-16 h-7 bg-slate-200 dark:bg-galaxy-700 rounded-xl flex-shrink-0" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-slate-100 dark:bg-galaxy-800 rounded-full mb-2 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-galaxy-700" />
      </div>
      <div className="space-y-2">
        <div className="h-8 w-12 bg-slate-200 dark:bg-galaxy-700 rounded-lg" />
        <div className="h-3 w-24 bg-slate-100 dark:bg-galaxy-800 rounded-full" />
      </div>
    </div>
  )
}
