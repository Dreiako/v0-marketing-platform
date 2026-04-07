import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Briefcase, TrendingUp, Target } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Contact, Deal } from '@/lib/types'

const stageBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  prospecting: 'secondary',
  qualified: 'outline',
  proposal: 'default',
  negotiation: 'default',
  closed_won: 'default',
  closed_lost: 'destructive',
}

const stageLabel: Record<string, string> = {
  prospecting: 'Prospecting',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Won',
  closed_lost: 'Lost',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { count: contactCount },
    { count: dealCount },
    { data: deals },
    { data: recentContacts },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
    supabase.from('deals').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
    supabase.from('deals').select('*').eq('user_id', user?.id),
    supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const openDeals = (deals as Deal[] | null)?.filter(
    (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost'
  ) ?? []

  const wonDeals = (deals as Deal[] | null)?.filter((d) => d.stage === 'closed_won') ?? []
  const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0)
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0)

  const totalDeals = (deals?.length ?? 0)
  const winRate =
    totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0

  const stats = [
    {
      title: 'Total Contacts',
      value: contactCount ?? 0,
      icon: Users,
      description: 'Leads, prospects & customers',
    },
    {
      title: 'Open Deals',
      value: openDeals.length,
      icon: Briefcase,
      description: 'Active pipeline',
    },
    {
      title: 'Pipeline Value',
      value: `$${pipelineValue.toLocaleString()}`,
      icon: TrendingUp,
      description: 'Total open deal value',
    },
    {
      title: 'Win Rate',
      value: `${winRate}%`,
      icon: Target,
      description: 'Closed won vs total closed',
    },
  ]

  const recentDeals = (deals as Deal[] | null)
    ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5) ?? []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground">Your sales pipeline at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/contacts">Add Contact</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/deals">New Deal</Link>
          </Button>
        </div>
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
            <CardTitle>Recent Deals</CardTitle>
            <CardDescription>Latest deals in your pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDeals.length > 0 ? (
              <div className="space-y-3">
                {recentDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-card-foreground">{deal.title}</p>
                      <p className="text-sm text-muted-foreground">{deal.contact_name ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        ${deal.value.toLocaleString()}
                      </span>
                      <Badge variant={stageBadgeVariant[deal.stage] ?? 'secondary'}>
                        {stageLabel[deal.stage] ?? deal.stage}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No deals yet. Create your first deal to get started.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/dashboard/deals">Create Deal</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Contacts</CardTitle>
            <CardDescription>Newly added contacts</CardDescription>
          </CardHeader>
          <CardContent>
            {recentContacts && recentContacts.length > 0 ? (
              <div className="space-y-3">
                {(recentContacts as Contact[]).map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.company ?? contact.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {contact.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No contacts yet. Add your first contact.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/dashboard/contacts">Add Contact</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
