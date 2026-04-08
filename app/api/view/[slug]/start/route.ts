import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { email, secretKey } = await request.json()

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: shareLink, error: dbError } = await supabase
    .from('share_links')
    .select('*, assets(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (dbError || !shareLink) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  // Validate secret key if set
  if (shareLink.secret_key && secretKey.trim() !== shareLink.secret_key.trim()) {
    return NextResponse.json({ error: 'Incorrect secret key' }, { status: 401 })
  }

  // Record the view event with email
  await supabase.from('analytics_events').insert({
    share_link_id: shareLink.id,
    event_type: 'view',
    visitor_id: `email_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    viewer_email: email.trim().toLowerCase(),
    device_type: null,
  })

  const { data: signedUrlData } = await supabase.storage
    .from('marketing-assets')
    .createSignedUrl(shareLink.assets.file_path, 3600)

  if (!signedUrlData?.signedUrl) {
    return NextResponse.json({ error: 'Asset could not be loaded' }, { status: 404 })
  }

  return NextResponse.json({
    signedUrl: signedUrlData.signedUrl,
    asset: shareLink.assets,
    shareLink: { id: shareLink.id, slug: shareLink.slug },
  })
}
