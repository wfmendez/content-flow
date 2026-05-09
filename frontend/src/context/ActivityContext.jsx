import { createContext, useContext, useState, useCallback } from 'react'

const ActivityContext = createContext(null)

const ICONS = {
  approve:  { emoji: '✅', color: 'text-emerald-500 dark:text-emerald-400' },
  reject:   { emoji: '❌', color: 'text-red-500 dark:text-red-400' },
  publish:  { emoji: '🚀', color: 'text-brand-500 dark:text-brand-400' },
  generate: { emoji: '✨', color: 'text-violet-500 dark:text-violet-400' },
  delete:   { emoji: '🗑️', color: 'text-slate-400 dark:text-galaxy-500' },
  fetch:    { emoji: '🔍', color: 'text-blue-500 dark:text-blue-400' },
}

export function ActivityProvider({ children }) {
  const [activities, setActivities] = useState([])

  const addActivity = useCallback((action, label) => {
    const entry = {
      id: Date.now(),
      action,
      label,
      icon: ICONS[action] || { emoji: '•', color: 'text-slate-400' },
      ts: new Date(),
    }
    setActivities(prev => [entry, ...prev].slice(0, 20))
  }, [])

  return (
    <ActivityContext.Provider value={{ activities, addActivity }}>
      {children}
    </ActivityContext.Provider>
  )
}

export function useActivity() {
  const ctx = useContext(ActivityContext)
  if (!ctx) throw new Error('useActivity must be used inside ActivityProvider')
  return ctx
}
