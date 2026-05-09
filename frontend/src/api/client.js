import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

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
