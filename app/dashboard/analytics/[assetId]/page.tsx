import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Monitor, Smartphone, Tablet, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ assetId: string }>
}

function formatDuration(s: number) {
  if (!s) return '—'
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function DeviceIcon({ device }: { device: string | null }) {
  if (device === 'mobile') return <Smartphone className="h-4 w-4" />
  if (device === 'tablet') return <Tablet className="h-4 w-4" />
  return <Monitor className="h-4 w-4" />
}

export default async function AssetAnalyticsPage({ params }: PageProps) {
  const { assetId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: asset } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .eq('user_id', user?.id)
    .single()

  if (!asset) notFound()

  // Get all share links for this asset
  const { data: shareLinks } = await supabase
    .from('share_links')
    .select('*')
    .eq('asset_id', assetId)
    .eq('user_id', user?.id)

  const linkIds = shareLinks?.map((l) => l.id) ?? []

  let events: any[] = []
  if (linkIds.length > 0) {
    const { data } = await supabase
      .from('analytics_events')
      .select('*')
      .in('share_link_id', linkIds)
      .order('created_at', { ascending: true })
    events = data ?? []
  }

  // Group events by visitor
  const sessionMap: Record<string, {
    visitorId: string
    email: string | null
    firstSeen: string
    lastSeen: string
    device: string | null
    timeSpent: number
    maxScrollDepth: number
    milestones: number[]
    views: number
    completed: boolean
  }> = {}

  events.forEach((e) => {
    const key = e.viewer_email ?? e.visitor_id
    if (!sessionMap[key]) {
      sessionMap[key] = {
        visitorId: e.visitor_id,
        email: e.viewer_email ?? null,
        firstSeen: e.created_at,
        lastSeen: e.created_at,
        device: e.device_type,
        timeSpent: 0,
        maxScrollDepth: 0,
        milestones: [],
        views: 0,
        completed: false,
      }
    }
    const s = sessionMap[key]
    if (new Date(e.created_at) > new Date(s.lastSeen)) s.lastSeen = e.created_at
    if (e.event_type === 'view') s.views += 1
    if (e.event_type === 'time_spent' && e.time_spent_seconds) {
      s.timeSpent = Math.max(s.timeSpent, e.time_spent_seconds)
    }
    if ((e.event_type === 'scroll' || e.event_type === 'scroll_milestone') && e.scroll_depth) {
      s.maxScrollDepth = Math.max(s.maxScrollDepth, e.scroll_depth)
      if (!s.milestones.includes(e.scroll_depth)) s.milestones.push(e.scroll_depth)
    }
    if (s.maxScrollDepth >= 90) s.completed = true
  })

  const sessions = Object.values(sessionMap).sort(
    (a, b) => new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime()
  )

  // Milestone heatmap — which % scroll points were reached
  const milestoneCounts: Record<number, number> = { 25: 0, 50: 0, 75: 0, 100: 0 }
  sessions.forEach((s) => {
    s.milestones.forEach((m) => {
      if (m in milestoneCounts) milestoneCounts[m]++
    })
  })
  const maxMilestoneCount = Math.max(...Object.values(milestoneCounts), 1)

  const totalViews = sessions.reduce((s, v) => s + v.views, 0)
  const completed = sessions.filter((s) => s.completed).length
  const completionRate = sessions.length > 0 ? Math.round((completed / sessions.length) * 100) : 0
  const avgTime = sessions.length > 0
    ? Math.round(sessions.reduce((s, v) => s + v.timeSpent, 0) / sessions.length)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/analytics">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{asset.title}</h1>
          <p className="text-muted-foreground capitalize">{asset.type} · {asset.category ?? 'uncategorised'}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Views', value: totalViews },
          { label: 'Unique Viewers', value: sessions.length },
          { label: 'Avg. Time Spent', value: formatDuration(avgTime) },
          { label: 'Completion Rate', value: `${completionRate}%` },
        ].map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardDescription>{k.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scroll milestone heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Scroll Depth Heatmap</CardTitle>
          <CardDescription>How far viewers read through the document</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            {Object.entries(milestoneCounts).map(([pct, count]) => (
              <div key={pct} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-sm font-medium">{count}</span>
                <div
                  className="w-full rounded-t bg-primary transition-all"
                  style={{ height: `${Math.max(8, (count / maxMilestoneCount) * 120)}px` }}
                />
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Viewers table */}
      <Card>
        <CardHeader>
          <CardTitle>Viewers</CardTitle>
          <CardDescription>Individual viewer sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No viewers yet</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Viewer</TableHead>
                    <TableHead>First Seen</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Time Spent</TableHead>
                    <TableHead>Scroll Depth</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.visitorId}>
                      <TableCell>
                        {s.email ? (
                          <span className="font-medium">{s.email}</span>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">{s.visitorId.slice(0, 14)}…</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(s.firstSeen).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground capitalize">
                          <DeviceIcon device={s.device} />
                          <span className="text-sm">{s.device ?? 'desktop'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDuration(s.timeSpent)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${s.maxScrollDepth}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{s.maxScrollDepth}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.completed ? 'default' : 'secondary'}>
                          {s.completed ? 'Completed' : `Stopped at ${s.maxScrollDepth}%`}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
