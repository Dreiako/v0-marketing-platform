import { createClient } from '@/lib/supabase/server'
import { AnalyticsDashboard } from '@/components/dashboard/analytics-dashboard'

interface AnalyticsPageProps {
  searchParams: Promise<{ link?: string }>
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const { link: selectedLinkId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all share links for the user
  const { data: shareLinks } = await supabase
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

  // Fetch analytics events for user's links
  const linkIds = shareLinks?.map(l => l.id) || []

  let analyticsEvents: any[] = []
  if (linkIds.length > 0) {
    const { data } = await supabase
      .from('analytics_events')
      .select('*')
      .in('share_link_id', linkIds)
      .order('created_at', { ascending: false })

    analyticsEvents = data || []
  }

  // Calculate overview metrics
  const viewEvents = analyticsEvents.filter(e => e.event_type === 'view')
  const timeEvents = analyticsEvents.filter(e => e.event_type === 'time_spent')
  const scrollEvents = analyticsEvents.filter(e => e.event_type === 'scroll')
  const downloadEvents = analyticsEvents.filter(e => e.event_type === 'download')

  const totalViews = viewEvents.length
  const uniqueVisitors = new Set(viewEvents.map(e => e.visitor_id)).size

  const avgTimeSpent = timeEvents.length > 0
    ? Math.round(timeEvents.reduce((sum, e) => sum + (e.time_spent_seconds || 0), 0) / timeEvents.length)
    : 0

  const avgScrollDepth = scrollEvents.length > 0
    ? Math.round(scrollEvents.reduce((sum, e) => sum + (e.scroll_depth || 0), 0) / scrollEvents.length)
    : 0

  const totalDownloads = downloadEvents.length

  // Calculate views by day for the chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })

  const viewsByDay = last7Days.map(date => {
    const dayViews = viewEvents.filter(e =>
      e.created_at.split('T')[0] === date
    )
    return {
      date,
      views: dayViews.length,
      uniqueVisitors: new Set(dayViews.map(e => e.visitor_id)).size,
    }
  })

  // Get device breakdown
  const deviceCounts: Record<string, number> = {}
  viewEvents.forEach(e => {
    const device = e.device_type || 'unknown'
    deviceCounts[device] = (deviceCounts[device] || 0) + 1
  })

  const deviceBreakdown = Object.entries(deviceCounts).map(([device, count]) => ({
    device,
    count,
    percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
  }))

  // Get top performing links
  const linkPerformance = (shareLinks || []).map(link => {
    const linkViews = viewEvents.filter(e => e.share_link_id === link.id)
    const linkTimeEvents = timeEvents.filter(e => e.share_link_id === link.id)

    return {
      id: link.id,
      title: link.assets.title,
      type: link.assets.type,
      slug: link.slug,
      views: linkViews.length,
      uniqueVisitors: new Set(linkViews.map(e => e.visitor_id)).size,
      avgTimeSpent: linkTimeEvents.length > 0
        ? Math.round(linkTimeEvents.reduce((sum, e) => sum + (e.time_spent_seconds || 0), 0) / linkTimeEvents.length)
        : 0,
    }
  }).sort((a, b) => b.views - a.views)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="text-muted-foreground">
          Track engagement and performance of your shared content
        </p>
      </div>

      <AnalyticsDashboard
        overview={{
          totalViews,
          uniqueVisitors,
          avgTimeSpent,
          avgScrollDepth,
          totalDownloads,
        }}
        viewsByDay={viewsByDay}
        deviceBreakdown={deviceBreakdown}
        linkPerformance={linkPerformance}
        shareLinks={shareLinks || []}
        selectedLinkId={selectedLinkId}
      />
    </div>
  )
}
