import { useState } from 'react'
import { TrendingUp, Clock, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'

export function RoiCalculator() {
  const { settings } = useSettings()
  const [open, setOpen] = useState(false)
  const [hourlyRate, setHourlyRate] = useState(25)

  const postsPerMonth  = settings.postsPerWeek * 4
  const hoursPerMonth  = (postsPerMonth * settings.minutesPerPost) / 60
  const automatedPct   = 0.80
  const hoursSaved     = hoursPerMonth * automatedPct
  const moneySaved     = hoursSaved * hourlyRate
  const costPerPost    = 0.00052     // avg from README cost analysis
  const pipelineCost   = postsPerMonth * costPerPost

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-slate-50 dark:hover:bg-galaxy-700/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-800 dark:text-galaxy-100 text-sm">
            Calculadora de ROI
          </p>
          <p className="text-xs text-slate-400 dark:text-galaxy-500">
            Ahorra <span className="text-emerald-600 dark:text-emerald-400 font-semibold">~{hoursSaved.toFixed(0)} horas/mes</span> automatizando tu contenido
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-galaxy-700 px-5 pb-5 pt-4 animate-fade-in">

          {/* Inputs */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div>
              <label className="block text-xs text-slate-500 dark:text-galaxy-400 mb-1">Posts/semana</label>
              <div className="text-lg font-bold text-slate-800 dark:text-galaxy-100">{settings.postsPerWeek}</div>
              <p className="text-xs text-slate-400 dark:text-galaxy-500">desde Configuración</p>
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-galaxy-400 mb-1">Min. por post</label>
              <div className="text-lg font-bold text-slate-800 dark:text-galaxy-100">{settings.minutesPerPost}</div>
              <p className="text-xs text-slate-400 dark:text-galaxy-500">desde Configuración</p>
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-galaxy-400 mb-1">Tarifa/hora (USD)</label>
              <input
                type="number"
                min={5} max={500}
                value={hourlyRate}
                onChange={e => setHourlyRate(Number(e.target.value))}
                className="w-full text-lg font-bold text-slate-800 dark:text-galaxy-100
                           bg-transparent border-b-2 border-brand-300 dark:border-brand-500
                           focus:outline-none focus:border-brand-500 pb-0.5"
              />
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{hoursSaved.toFixed(1)}h</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">ahorradas / mes</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">${moneySaved.toFixed(0)}</p>
              <p className="text-xs text-blue-600 dark:text-blue-500">valor recuperado / mes</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-galaxy-700">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-galaxy-400">
              <span>{postsPerMonth} posts/mes · {hoursPerMonth.toFixed(1)}h totales → {(hoursPerMonth * automatedPct).toFixed(1)}h automatizadas (80%)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Costo IA: ~${pipelineCost.toFixed(3)}/mes
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
