import { createClient } from '@/lib/supabase/server'
import { AssetGrid } from '@/components/dashboard/asset-grid'
import { UploadDialog } from '@/components/dashboard/upload-dialog'

export default async function AssetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Assets</h1>
          <p className="text-muted-foreground">
            Upload and manage your marketing collaterals
          </p>
        </div>
        <UploadDialog />
      </div>

      <AssetGrid assets={assets || []} />
    </div>
  )
}
