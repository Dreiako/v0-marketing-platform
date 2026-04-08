import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { password } = await request.json()

  const supabase = await createClient()

  const { data: shareLink, error: dbError } = await supabase
    .from('share_links')
    .select('*, assets(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (dbError || !shareLink) {
    // RLS may be blocking unauthenticated reads — instruct user to add a public SELECT policy
    return NextResponse.json(
      { error: 'Link not found. If you have RLS enabled, add a public SELECT policy for share_links.' },
      { status: 404 }
    )
  }

  // Trim both sides to handle any accidental whitespace
  if (password.trim() !== (shareLink.password_hash ?? '').trim()) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

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
