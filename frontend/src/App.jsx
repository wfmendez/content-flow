import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, FileText, Zap, Sun, Moon, Menu, X,
         CalendarDays, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import Dashboard    from './pages/Dashboard'
import TrendsPage   from './pages/TrendsPage'
import ContentPage  from './pages/ContentPage'
import CalendarPage from './pages/CalendarPage'
import LoginPage    from './pages/LoginPage'
import { ActivityProvider } from './context/ActivityContext'
import { AuthProvider, useAuth } from './context/AuthContext'

// ── Dark mode hook ────────────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('cf-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('cf-theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, setDark]
}

// ── Pending badge (updated by ContentPage via sessionStorage event) ───────────
function usePendingCount() {
  const [count, setCount] = useState(() => Number(sessionStorage.getItem('cf-pending') ?? 0))
  useEffect(() => {
    const h = () => setCount(Number(sessionStorage.getItem('cf-pending') ?? 0))
    window.addEventListener('cf-pending-update', h)
    return () => window.removeEventListener('cf-pending-update', h)
  }, [])
  return count
}

// ── Nav items ────────────────────────────────────────────────────────────────
const NAV = [
  { to: '/',         label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/trends',   label: 'Tendencias', icon: TrendingUp },
  { to: '/content',  label: 'Contenido',  icon: FileText },
  { to: '/calendar', label: 'Calendario', icon: CalendarDays },
]

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

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ dark, setDark, pendingCount, onClose }) {
  const { user, logout } = useAuth()
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
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-galaxy-700 lg:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, label, icon }) => (
          <NavItem
            key={to}
            to={to}
            label={label}
            icon={icon}
            badge={to === '/content' ? pendingCount : 0}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* User + Footer */}
      <div className="px-4 py-4 border-t border-slate-100 dark:border-galaxy-700 space-y-3">
        {/* User pill */}
        {user && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-galaxy-900/50">
            <div className="w-7 h-7 rounded-full bg-brand-500/20 dark:bg-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-400">
              {user.name?.[0]?.toUpperCase() ?? 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-galaxy-100 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 dark:text-galaxy-500 truncate">{user.isDemo ? 'Modo demo' : user.email}</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-galaxy-500 font-mono">v1.0.0</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setDark(!dark)}
              className="p-2 rounded-lg text-slate-400 dark:text-galaxy-400
                         hover:bg-slate-100 dark:hover:bg-galaxy-700
                         hover:text-slate-700 dark:hover:text-white transition-all"
              title={dark ? 'Modo claro' : 'Modo oscuro'}>
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={logout}
              className="p-2 rounded-lg text-slate-400 dark:text-galaxy-400
                         hover:bg-red-50 dark:hover:bg-red-900/20
                         hover:text-red-500 dark:hover:text-red-400 transition-all"
              title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ── Protected layout ──────────────────────────────────────────────────────────
function AppLayout() {
  const { user } = useAuth()
  const [dark, setDark]     = useDarkMode()
  const [mobileOpen, setMobile] = useState(false)
  const pendingCount = usePendingCount()

  // Listen for auto-logout (401)
  useEffect(() => {
    const h = () => {}   // re-render is triggered by AuthContext state change
    window.addEventListener('cf-logout', h)
    return () => window.removeEventListener('cf-logout', h)
  }, [])

  if (!user) return <Navigate to="/login" replace />

  return (
    <ActivityProvider>
      <div className="min-h-screen flex bg-slate-50 dark:bg-galaxy-900">

        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          <Sidebar dark={dark} setDark={setDark} pendingCount={pendingCount} />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobile(false)} />
            <div className="absolute left-0 top-0 h-full z-50 animate-slide-right">
              <Sidebar dark={dark} setDark={setDark} pendingCount={pendingCount} onClose={() => setMobile(false)} />
            </div>
          </div>
        )}

        {/* Main */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Mobile top bar */}
          <header className="lg:hidden flex items-center gap-3 px-4 py-3
                             bg-white dark:bg-galaxy-800
                             border-b border-slate-200 dark:border-galaxy-600 sticky top-0 z-30">
            <button onClick={() => setMobile(true)}
              className="p-2 rounded-lg text-slate-500 dark:text-galaxy-400 hover:bg-slate-100 dark:hover:bg-galaxy-700">
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
              <Route path="/"         element={<Dashboard />} />
              <Route path="/trends"   element={<TrendsPage />} />
              <Route path="/content"  element={<ContentPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="*"         element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </ActivityProvider>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*"     element={<AppLayout />} />
      </Routes>
    </AuthProvider>
  )
}
