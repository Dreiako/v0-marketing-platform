// ── Legacy types (retained for existing viewer/dialog components) ─────────────

export type AssetType = 'slide' | 'factsheet' | 'tutorial' | 'video' | 'image' | 'pdf'

export interface Asset {
  id: string
  user_id: string
  title: string
  description: string | null
  type: AssetType
  file_path: string
  file_size: number | null
  mime_type: string | null
  thumbnail_path: string | null
  created_at: string
  updated_at: string
}

export interface ShareLink {
  id: string
  user_id: string
  asset_id: string
  slug: string
  password_hash: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
  asset?: Asset
}

export interface AnalyticsEvent {
  id: string
  share_link_id: string
  event_type: 'view' | 'scroll' | 'time_spent' | 'exit' | 'download'
  visitor_id: string
  ip_address: string | null
  user_agent: string | null
  referrer: string | null
  country: string | null
  city: string | null
  device_type: string | null
  scroll_depth: number | null
  time_spent_seconds: number | null
  created_at: string
}

export interface AssetWithLinks extends Asset {
  share_links: ShareLink[]
}

export interface ShareLinkWithAsset extends ShareLink {
  assets: Asset
}

// ── CRM types ─────────────────────────────────────────────────────────────────

export type ContactStatus = 'lead' | 'prospect' | 'customer' | 'churned'

export type DealStage =
  | 'prospecting'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'

export interface Contact {
  id: string
  user_id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  status: ContactStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  user_id: string
  contact_id: string | null
  contact_name: string | null
  title: string
  value: number
  stage: DealStage
  probability: number
  expected_close: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  user_id: string
  contact_id: string | null
  deal_id: string | null
  type: 'call' | 'email' | 'meeting' | 'note'
  subject: string
  body: string | null
  occurred_at: string
  created_at: string
}
