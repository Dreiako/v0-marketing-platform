-- Create analytics_events table for detailed tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'download', 'scroll', 'time_spent', 'exit')),
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  referrer TEXT,
  scroll_depth INTEGER,
  time_spent_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert analytics events (for tracking)
CREATE POLICY "Anyone can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Users can view analytics for their own share links
CREATE POLICY "Users can view analytics for their share links" ON analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM share_links 
      WHERE share_links.id = analytics_events.share_link_id 
      AND share_links.user_id = auth.uid()
    )
  );

-- Create analytics_summary table for aggregated metrics
CREATE TABLE IF NOT EXISTS analytics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_spent INTEGER DEFAULT 0,
  avg_scroll_depth INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  UNIQUE(share_link_id, date)
);

-- Enable RLS
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;

-- Users can view summary for their own share links
CREATE POLICY "Users can view analytics summary for their share links" ON analytics_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM share_links 
      WHERE share_links.id = analytics_summary.share_link_id 
      AND share_links.user_id = auth.uid()
    )
  );

-- Allow inserts and updates for aggregation (via service role)
CREATE POLICY "Allow insert analytics summary" ON analytics_summary
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update analytics summary" ON analytics_summary
  FOR UPDATE USING (true);

-- Create indexes for analytics performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_share_link_id ON analytics_events(share_link_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_id ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_share_link_id ON analytics_summary(share_link_id);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_date ON analytics_summary(date DESC);
