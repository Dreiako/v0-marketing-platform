export type AssetType = 'slide' | 'factsheet' | 'tutorial' | 'video' | 'image' | 'pdf'
export type AssetCategory = string // now dynamic — stored in asset_categories table

export interface Folder {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface UserCategory {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Asset {
  id: string
  user_id: string
  title: string
  description: string | null
  type: AssetType
  category: AssetCategory | null
  folder_id: string | null
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
  require_email: boolean
  secret_key: string | null
  created_at: string
  asset?: Asset
}

export interface AnalyticsEvent {
  id: string
  share_link_id: string
  event_type: 'view' | 'scroll' | 'scroll_milestone' | 'time_spent' | 'exit' | 'download'
  visitor_id: string
  viewer_email: string | null
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

export interface AnalyticsSummary {
  id: string
  share_link_id: string
  date: string
  total_views: number
  unique_visitors: number
  avg_time_spent_seconds: number
  avg_scroll_depth: number
  downloads: number
}

export interface AssetWithLinks extends Asset {
  share_links: ShareLink[]
}

export interface ShareLinkWithAsset extends ShareLink {
  assets: Asset
}

export interface AnalyticsOverview {
  totalViews: number
  uniqueVisitors: number
  avgTimeSpent: number
  avgScrollDepth: number
  totalDownloads: number
  viewsChange: number
  visitorsChange: number
}
