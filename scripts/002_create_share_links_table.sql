-- Create share_links table for trackable links
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  expires_at TIMESTAMPTZ,
  password_hash TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for share_links
CREATE POLICY "Users can view their own share links" ON share_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own share links" ON share_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own share links" ON share_links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own share links" ON share_links
  FOR DELETE USING (auth.uid() = user_id);

-- Public read access for viewers (by slug only, no sensitive data)
CREATE POLICY "Anyone can view active share link by slug" ON share_links
  FOR SELECT USING (is_active = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON share_links(user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_asset_id ON share_links(asset_id);
CREATE INDEX IF NOT EXISTS idx_share_links_slug ON share_links(slug);
CREATE INDEX IF NOT EXISTS idx_share_links_created_at ON share_links(created_at DESC);
