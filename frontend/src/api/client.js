import axios from 'axios'

// En desarrollo usa el proxy de Vite (/api → localhost:8000).
// En producción (Vercel) usa la variable de entorno VITE_API_URL.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Auth interceptor — attaches JWT to every request ─────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cf-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auto-logout on 401 ────────────────────────────────────────────────────────
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cf-token')
      localStorage.removeItem('cf-user')
      window.dispatchEvent(new Event('cf-logout'))
    }
    return Promise.reject(err)
  }
)

// ── Trends ────────────────────────────────────────────────────────────────────
export const getTrends = (params = {}) => api.get('/trends/', { params })
export const getTrendStats = () => api.get('/trends/stats')
export const fetchTrends = () => api.post('/trends/fetch')
export const deleteTrend = (id) => api.delete(`/trends/${id}`)

// ── Content Drafts ────────────────────────────────────────────────────────────
export const getDrafts = (params = {}) => api.get('/content/', { params })
export const getContentStats = () => api.get('/content/stats')
export const getDraft = (id) => api.get(`/content/${id}`)
export const generateContent = (trendId) => api.post(`/content/generate/${trendId}`)
export const updateDraft = (id, data) => api.patch(`/content/${id}`, data)
export const approveDraft = (id) => api.post(`/content/${id}/approve`)
export const rejectDraft = (id) => api.post(`/content/${id}/reject`)
export const publishDraft = (id) => api.post(`/content/${id}/publish`)
export const deleteDraft = (id) => api.delete(`/content/${id}`)

export default api
