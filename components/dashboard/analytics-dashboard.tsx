'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, Users, Clock, ArrowDown, Download, Monitor, Smartphone, Tablet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

interface AnalyticsDashboardProps {
  overview: {
    totalViews: number
    uniqueVisitors: number
    avgTimeSpent: number
    avgScrollDepth: number
    totalDownloads: number
  }
  viewsByDay: Array<{
    date: string
    views: number
    uniqueVisitors: number
  }>
  deviceBreakdown: Array<{
    device: string
    count: number
    percentage: number
  }>
  linkPerformance: Array<{
    id: string
    title: string
    type: string
    slug: string
    views: number
    uniqueVisitors: number
    avgTimeSpent: number
  }>
  shareLinks: Array<{
    id: string
    slug: string
    assets: {
      title: string
    }
  }>
  selectedLinkId?: string
}

const deviceIcons: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
}

const chartColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)']

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

export function AnalyticsDashboard({
  overview,
  viewsByDay,
  deviceBreakdown,
  linkPerformance,
  shareLinks,
  selectedLinkId,
}: AnalyticsDashboardProps) {
  const router = useRouter()

  const handleLinkFilter = (value: string) => {
    if (value === 'all') {
      router.push('/dashboard/analytics')
    } else {
      router.push(`/dashboard/analytics?link=${value}`)
    }
  }

  const stats = [
    {
      title: 'Total Views',
      value: overview.totalViews,
      icon: Eye,
      description: 'All time page views',
    },
    {
      title: 'Unique Visitors',
      value: overview.uniqueVisitors,
      icon: Users,
      description: 'Distinct visitors',
    },
    {
      title: 'Avg. Time Spent',
      value: formatDuration(overview.avgTimeSpent),
      icon: Clock,
      description: 'Per session',
    },
    {
      title: 'Avg. Scroll Depth',
      value: `${overview.avgScrollDepth}%`,
      icon: ArrowDown,
      description: 'Content engagement',
    },
    {
      title: 'Downloads',
      value: overview.totalDownloads,
      icon: Download,
      description: 'File downloads',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Filter */}
      {shareLinks.length > 0 && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">Filter by Link:</label>
          <Select value={selectedLinkId || 'all'} onValueChange={handleLinkFilter}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="All links" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All links</SelectItem>
              {shareLinks.map((link) => (
                <SelectItem key={link.id} value={link.id}>
                  {link.assets.title} ({link.slug})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Views Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
            <CardDescription>Daily views for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {viewsByDay.some(d => d.views > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={viewsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                    />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--chart-1)' }}
                      name="Views"
                    />
                    <Line
                      type="monotone"
                      dataKey="uniqueVisitors"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--chart-2)' }}
                      name="Unique Visitors"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No view data yet. Share your links to start tracking.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Views by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {deviceBreakdown.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={deviceBreakdown} layout="vertical">
                      <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                      <YAxis
                        dataKey="device"
                        type="category"
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        width={80}
                        tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {deviceBreakdown.map((entry, index) => (
                          <Cell key={entry.device} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {deviceBreakdown.map((item, index) => {
                      const Icon = deviceIcons[item.device] || Monitor
                      return (
                        <div key={item.device} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded"
                              style={{ backgroundColor: chartColors[index % chartColors.length] }}
                            />
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm capitalize text-foreground">{item.device}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No device data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Links */}
      <Card>
        <CardHeader>
          <CardTitle>Link Performance</CardTitle>
          <CardDescription>Engagement metrics for each shared link</CardDescription>
        </CardHeader>
        <CardContent>
          {linkPerformance.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Unique Visitors</TableHead>
                  <TableHead className="text-right">Avg. Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkPerformance.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{link.title}</p>
                        <p className="text-sm capitalize text-muted-foreground">{link.type}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                        /view/{link.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-right font-medium">{link.views}</TableCell>
                    <TableCell className="text-right">{link.uniqueVisitors}</TableCell>
                    <TableCell className="text-right">{formatDuration(link.avgTimeSpent)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Eye className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">
                No link performance data yet. Create and share links to start tracking.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
