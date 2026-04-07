-- Create assets table for storing marketing collaterals
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('slide', 'factsheet', 'tutorial', 'video', 'image', 'pdf')),
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  thumbnail_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assets
CREATE POLICY "Users can view their own assets" ON assets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets" ON assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets" ON assets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets" ON assets
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);
