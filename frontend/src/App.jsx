import { Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, FileText, Zap, Sun, Moon, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import TrendsPage from './pages/TrendsPage'
import ContentPage from './pages/ContentPage'
import { ActivityProvider } from './context/ActivityContext'

// ── Dark mode hook ────────────────────────────────────────────────────────────
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

// ── Pending badge (reads from sessionStorage, updated by ContentPage) ─────────
function usePendingCount() {
  const [count, setCount] = useState(() => {
    return Number(sessionStorage.getItem('cf-pending') ?? 0)
  })

  useEffect(() => {
    const handler = () => setCount(Number(sessionStorage.getItem('cf-pending') ?? 0))
    window.addEventListener('cf-pending-update', handler)
    return () => window.removeEventListener('cf-pending-update', handler)
  }, [])

  return count
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ dark, setDark, pendingCount, onClose }) {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col
                      bg-white dark:bg-galaxy-800
                      border-r border-slate-200 dark:border-galaxy-600
                      shadow-sm h-full">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100 dark:border-galaxy-700 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 dark:shadow-glow-sm flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">Content</span>
            <span className="font-bold text-base text-brand-500">Flow</span>
          </div>
        </div>
        {/* Close button on mobile */}
        {onClose && (
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-galaxy-700 lg:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem to="/" label="Dashboard" icon={LayoutDashboard} onClick={onClose} />
        <NavItem to="/trends" label="Tendencias" icon={TrendingUp} onClick={onClose} />
        <NavItem to="/content" label="Contenido" icon={FileText} badge={pendingCount} onClick={onClose} />
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100 dark:border-galaxy-700 flex items-center justify-between">
        <span className="text-xs text-slate-400 dark:text-galaxy-500 font-mono">v1.0.0</span>
        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-lg text-slate-400 dark:text-galaxy-400
                     hover:bg-slate-100 dark:hover:bg-galaxy-700
                     hover:text-slate-700 dark:hover:text-white
                     transition-all duration-200"
          title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}

function NavItem({ to, label, icon: Icon, badge, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
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
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useDarkMode()
  const [mobileOpen, setMobileOpen] = useState(false)
  const pendingCount = usePendingCount()

  // Close mobile sidebar on route change
  const closeMobile = () => setMobileOpen(false)

  return (
    <ActivityProvider>
      <div className="min-h-screen flex bg-slate-50 dark:bg-galaxy-900">

        {/* ── Desktop sidebar ────────────────────────────────────────── */}
        <div className="hidden lg:flex">
          <Sidebar dark={dark} setDark={setDark} pendingCount={pendingCount} />
        </div>

        {/* ── Mobile sidebar overlay ─────────────────────────────────── */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeMobile}
            />
            {/* Drawer */}
            <div className="absolute left-0 top-0 h-full z-50 animate-slide-right">
              <Sidebar dark={dark} setDark={setDark} pendingCount={pendingCount} onClose={closeMobile} />
            </div>
          </div>
        )}

        {/* ── Main ────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

          {/* Mobile top bar */}
          <header className="lg:hidden flex items-center gap-3 px-4 py-3
                             bg-white dark:bg-galaxy-800
                             border-b border-slate-200 dark:border-galaxy-600
                             shadow-sm sticky top-0 z-30">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-slate-500 dark:text-galaxy-400
                         hover:bg-slate-100 dark:hover:bg-galaxy-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-brand-500 flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" fill="white" />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">Content</span>
              <span className="font-bold text-sm text-brand-500">Flow</span>
            </div>
            {pendingCount > 0 && (
              <span className="ml-auto badge bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                {pendingCount} pendientes
              </span>
            )}
          </header>

          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/"        element={<Dashboard />} />
              <Route path="/trends"  element={<TrendsPage />} />
              <Route path="/content" element={<ContentPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </ActivityProvider>
  )
}
