import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AssetViewer } from '@/components/viewer/asset-viewer'
import { PasswordGate } from '@/components/viewer/password-gate'
import { EmailGate } from '@/components/viewer/email-gate'

interface ViewPageProps {
  params: Promise<{ slug: string }>
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: shareLink } = await supabase
    .from('share_links')
    .select('*, assets(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!shareLink) notFound()

  // Check expiry
  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Link Expired</h1>
          <p className="mt-2 text-muted-foreground">This share link has expired.</p>
        </div>
      </div>
    )
  }

  // Email gate takes priority (captures viewer identity)
  if (shareLink.require_email) {
    return <EmailGate shareLink={shareLink} />
  }

  // Password gate
  if (shareLink.password_hash) {
    return <PasswordGate shareLink={shareLink} />
  }

  // Generate signed URL
  const { data: signedUrlData } = await supabase.storage
    .from('marketing-assets')
    .createSignedUrl(shareLink.assets.file_path, 3600)

  if (!signedUrlData?.signedUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Asset Not Found</h1>
          <p className="mt-2 text-muted-foreground">The requested asset could not be loaded.</p>
        </div>
      </div>
    )
  }

  return (
    <AssetViewer
      shareLink={shareLink}
      asset={shareLink.assets}
      signedUrl={signedUrlData.signedUrl}
    />
  )
}
