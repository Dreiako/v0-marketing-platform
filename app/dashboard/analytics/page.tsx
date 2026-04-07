import { createClient } from '@/lib/supabase/server'
import { CrmAnalytics } from '@/components/dashboard/crm-analytics'
import type { Deal } from '@/lib/types'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('user_id', user?.id)

  const allDeals = (deals as Deal[]) ?? []

  // Build revenue by month from closed_won deals
  const wonDeals = allDeals.filter((d) => d.stage === 'closed_won')

  const revenueMap: Record<string, { revenue: number; deals: number }> = {}
  wonDeals.forEach((deal) => {
    const month = new Date(deal.updated_at).toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    })
    if (!revenueMap[month]) revenueMap[month] = { revenue: 0, deals: 0 }
    revenueMap[month].revenue += deal.value
    revenueMap[month].deals += 1
  })

  const revenueByMonth = Object.entries(revenueMap)
    .map(([month, data]) => ({ month, ...data }))
    .slice(-6)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Sales performance and pipeline insights</p>
      </div>

      <CrmAnalytics deals={allDeals} revenueByMonth={revenueByMonth} />
    </div>
  )
}
