import { createContext, useContext, useState, useCallback } from 'react'

const SettingsContext = createContext(null)

const STORAGE_KEY = 'cf-settings'

export const DEFAULT_SETTINGS = {
  brandName: 'Mi Empresa',
  brandTone: 'profesional',
  targetAudience: 'Profesionales de tecnología y startups en LATAM',
  activeChannels: ['linkedin', 'blog', 'newsletter'],
  topics: ['Inteligencia Artificial', 'SaaS', 'Marketing Digital', 'Startups', 'Productividad'],
  rssFeeds: [
    { id: '1', url: 'https://techcrunch.com/feed/', label: 'TechCrunch' },
    { id: '2', url: 'https://hnrss.org/frontpage',   label: 'Hacker News' },
    { id: '3', url: 'https://dev.to/feed',           label: 'Dev.to' },
  ],
  webhookUrl: '',
  emailNotifications: false,
  emailAddress: '',
  postsPerWeek: 3,
  minutesPerPost: 45,
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load)

  const update = useCallback((patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSettings({ ...DEFAULT_SETTINGS })
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider')
  return ctx
}
