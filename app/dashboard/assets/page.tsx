import { createClient } from '@/lib/supabase/server'
import { UploadDialog } from '@/components/dashboard/upload-dialog'
import { AssetsPageClient } from '@/components/dashboard/assets-page-client'

export default async function AssetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: assets }, { data: folders }, { data: categories }] = await Promise.all([
    supabase.from('assets').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
    supabase.from('folders').select('*').eq('user_id', user?.id).order('name'),
    supabase.from('asset_categories').select('*').eq('user_id', user?.id).order('name'),
  ])

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

      <AssetsPageClient
        assets={assets || []}
        folders={folders || []}
        categories={categories || []}
      />
    </div>
  )
}
