import { Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, FileText, Zap, Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import TrendsPage from './pages/TrendsPage'
import ContentPage from './pages/ContentPage'

const navItems = [
  { to: '/',        label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/trends',  label: 'Tendencias', icon: TrendingUp },
  { to: '/content', label: 'Contenido',  icon: FileText },
]

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('cf-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('cf-theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, setDark]
}

export default function App() {
  const [dark, setDark] = useDarkMode()

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-galaxy-900">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 flex flex-col
                        bg-white dark:bg-galaxy-800
                        border-r border-slate-200 dark:border-galaxy-600
                        shadow-sm">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100 dark:border-galaxy-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 dark:shadow-glow-sm
                            flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                Content
              </span>
              <span className="font-bold text-base text-brand-500">Flow</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                 transition-all duration-150
                 ${isActive
                   ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 shadow-sm dark:shadow-glow-sm'
                   : 'text-slate-500 dark:text-galaxy-300 hover:bg-slate-100 dark:hover:bg-galaxy-700 hover:text-slate-900 dark:hover:text-white'
                 }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-100 dark:border-galaxy-700
                        flex items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-galaxy-500 font-mono">v1.0.0</span>
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg text-slate-400 dark:text-galaxy-400
                       hover:bg-slate-100 dark:hover:bg-galaxy-700
                       hover:text-slate-700 dark:hover:text-white
                       transition-all duration-200"
            title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {dark
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto min-h-screen">
        <Routes>
          <Route path="/"        element={<Dashboard />} />
          <Route path="/trends"  element={<TrendsPage />} />
          <Route path="/content" element={<ContentPage />} />
        </Routes>
      </main>
    </div>
  )
}
