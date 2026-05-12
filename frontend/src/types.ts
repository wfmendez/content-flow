/**
 * Shared TypeScript types for the ContentFlow API.
 * Import in any .tsx/.ts file: import type { ContentDraft, Trend } from '../types'
 */

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  email: string
  name: string
  role: string
  isDemo?: boolean
}

// ── Trends ────────────────────────────────────────────────────────────────────

export type TrendSource = 'rss' | 'reddit' | 'twitter'

export interface Trend {
  id: number
  title: string
  summary: string | null
  url: string | null
  source: TrendSource | null
  subreddit: string | null
  score: number
  relevance_score: number
  processed: boolean
  created_at: string
}

export interface TrendStats {
  total: number
  processed: number
  pending: number
  by_source: Record<string, number>
}

// ── Content Drafts ────────────────────────────────────────────────────────────

export type DraftStatus = 'pending' | 'approved' | 'rejected' | 'published'
export type DraftChannel = 'linkedin' | 'blog' | 'newsletter'

export interface TrendSnippet {
  id: number
  title: string
  source: string | null
}

export interface PublishJob {
  id: number
  channel: DraftChannel
  status: string
  published_at: string | null
  error: string | null
  created_at: string
}

export interface ContentDraft {
  id: number
  trend_id: number
  channel: DraftChannel
  title: string | null
  body: string
  status: DraftStatus
  created_at: string
  updated_at: string
  trend: TrendSnippet | null
  publish_jobs: PublishJob[]
  // AI transparency
  ai_model: string | null
  prompt_used: string | null
  tokens_input: number | null
  tokens_output: number | null
  generation_cost_usd: number | null
}

export interface ContentStats {
  total: number
  pending: number
  approved: number
  rejected: number
  published: number
}

export interface DraftVersion {
  id: number
  version_number: number
  title: string | null
  body: string
  note: string
  created_at: string
}

export type BulkAction = 'approve' | 'reject' | 'delete'

// ── Settings ──────────────────────────────────────────────────────────────────

export interface UserSettings {
  brand_name: string
  brand_tone: string
  target_audience: string
  topics: string
  active_channels: string
  posts_per_week: number
  minutes_per_post: number
  webhook_url: string
  linkedin_connected: boolean
  linkedin_person_urn: string | null
  updated_at: string | null
}

// ── LinkedIn OAuth ────────────────────────────────────────────────────────────

export interface LinkedInStatus {
  connected: boolean
  person_urn: string | null
  configured: boolean
}
