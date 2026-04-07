'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { Deal } from '@/lib/types'

const STAGE_COLORS: Record<string, string> = {
  prospecting: '#94a3b8',
  qualified: '#60a5fa',
  proposal: '#a78bfa',
  negotiation: '#f59e0b',
  closed_won: '#22c55e',
  closed_lost: '#ef4444',
}

const STAGE_LABELS: Record<string, string> = {
  prospecting: 'Prospecting',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Won',
  closed_lost: 'Lost',
}

interface CrmAnalyticsProps {
  deals: Deal[]
  revenueByMonth: { month: string; revenue: number; deals: number }[]
}

export function CrmAnalytics({ deals, revenueByMonth }: CrmAnalyticsProps) {
  const totalDeals = deals.length
  const wonDeals = deals.filter((d) => d.stage === 'closed_won')
  const lostDeals = deals.filter((d) => d.stage === 'closed_lost')
  const openDeals = deals.filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')

  const totalRevenue = wonDeals.reduce((s, d) => s + d.value, 0)
  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0)
  const winRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0
  const avgDealSize = wonDeals.length > 0 ? Math.round(totalRevenue / wonDeals.length) : 0

  // Stage breakdown for pie chart
  const stageCounts = deals.reduce<Record<string, number>>((acc, d) => {
    acc[d.stage] = (acc[d.stage] || 0) + 1
    return acc
  }, {})

  const pieData = Object.entries(stageCounts).map(([stage, count]) => ({
    name: STAGE_LABELS[stage] ?? stage,
    value: count,
    color: STAGE_COLORS[stage] ?? '#94a3b8',
  }))

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}` },
          { label: 'Pipeline Value', value: `$${pipelineValue.toLocaleString()}` },
          { label: 'Win Rate', value: `${winRate}%` },
          { label: 'Avg Deal Size', value: `$${avgDealSize.toLocaleString()}` },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardDescription>{kpi.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by month bar chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Month</CardTitle>
            <CardDescription>Closed won deals value over time</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueByMonth}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground text-sm">
                No revenue data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deal stage breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Breakdown</CardTitle>
            <CardDescription>Deals by stage</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="flex items-center gap-6">
                <PieChart width={160} height={160}>
                  <Pie
                    data={pieData}
                    cx={75}
                    cy={75}
                    innerRadius={45}
                    outerRadius={75}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="flex flex-col gap-2">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-muted-foreground">{entry.name}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {entry.value}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[160px] items-center justify-center text-muted-foreground text-sm">
                No deals yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Win/loss summary */}
      <Card>
        <CardHeader>
          <CardTitle>Win / Loss Summary</CardTitle>
          <CardDescription>Closed deals breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{wonDeals.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Won</p>
              <p className="text-xs text-muted-foreground">${wonDeals.reduce((s, d) => s + d.value, 0).toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-3xl font-bold text-destructive">{lostDeals.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Lost</p>
              <p className="text-xs text-muted-foreground">${lostDeals.reduce((s, d) => s + d.value, 0).toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-3xl font-bold text-primary">{openDeals.length}</p>
              <p className="text-sm text-muted-foreground mt-1">In Progress</p>
              <p className="text-xs text-muted-foreground">${pipelineValue.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
