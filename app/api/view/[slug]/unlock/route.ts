import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { password } = await request.json()

  const supabase = await createClient()

  const { data: shareLink } = await supabase
    .from('share_links')
    .select('*, assets(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!shareLink) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (password !== shareLink.password_hash) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const { data: signedUrlData } = await supabase.storage
    .from('assets')
    .createSignedUrl(shareLink.assets.file_path, 3600)

  if (!signedUrlData?.signedUrl) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  return NextResponse.json({
    signedUrl: signedUrlData.signedUrl,
    asset: shareLink.assets,
    shareLink: { id: shareLink.id, slug: shareLink.slug },
  })
}
