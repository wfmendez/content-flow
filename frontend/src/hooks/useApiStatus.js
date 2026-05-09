import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const HEALTH_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/health`
  : '/health'

/**
 * Polls the backend /health endpoint every 30 s.
 * Returns: 'checking' | 'online' | 'offline'
 */
export function useApiStatus() {
  const [status, setStatus] = useState('checking')

  const check = useCallback(async () => {
    try {
      await axios.get(HEALTH_URL, { timeout: 4000 })
      setStatus('online')
    } catch {
      setStatus('offline')
    }
  }, [])

  useEffect(() => {
    check()
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  }, [check])

  return status
}
