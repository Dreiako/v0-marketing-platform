import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderOpen, Link2, Eye, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch counts
  const { count: assetCount } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)

  const { count: linkCount } = await supabase
    .from('share_links')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)

  // Get total views from analytics
  const { data: analytics } = await supabase
    .from('analytics_events')
    .select('id, share_links!inner(user_id)')
    .eq('share_links.user_id', user?.id)
    .eq('event_type', 'view')

  const totalViews = analytics?.length || 0

  // Get recent assets
  const { data: recentAssets } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    {
      title: 'Total Assets',
      value: assetCount || 0,
      icon: FolderOpen,
      description: 'Marketing collaterals',
    },
    {
      title: 'Active Links',
      value: linkCount || 0,
      icon: Link2,
      description: 'Shareable URLs',
    },
    {
      title: 'Total Views',
      value: totalViews,
      icon: Eye,
      description: 'All time views',
    },
    {
      title: 'Avg. Time Spent',
      value: '0s',
      icon: Clock,
      description: 'Per session',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your marketing collaterals
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/assets">
            <FolderOpen className="mr-2 h-4 w-4" />
            Manage Assets
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Assets</CardTitle>
            <CardDescription>Your latest uploaded collaterals</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAssets && recentAssets.length > 0 ? (
              <div className="space-y-4">
                {recentAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                        <FolderOpen className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{asset.title}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {asset.type}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(asset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No assets yet. Upload your first collateral to get started.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/dashboard/assets">Upload Asset</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/dashboard/assets">
                <FolderOpen className="mr-2 h-4 w-4" />
                Upload New Asset
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/dashboard/links">
                <Link2 className="mr-2 h-4 w-4" />
                View Share Links
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/dashboard/analytics">
                <Eye className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
