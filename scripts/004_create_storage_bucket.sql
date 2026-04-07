-- Create storage bucket for assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  false,
  104857600, -- 100MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the assets bucket
CREATE POLICY "Users can upload their own assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own assets" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
