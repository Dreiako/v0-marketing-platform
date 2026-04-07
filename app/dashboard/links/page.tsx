import { createClient } from '@/lib/supabase/server'
import { LinksTable } from '@/components/dashboard/links-table'

export default async function LinksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: links } = await supabase
    .from('share_links')
    .select(`
      *,
      assets (
        id,
        title,
        type
      )
    `)
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Share Links</h1>
        <p className="text-muted-foreground">
          Manage and track all your shareable links
        </p>
      </div>

      <LinksTable links={links || []} />
    </div>
  )
}
