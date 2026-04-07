import { createClient } from '@/lib/supabase/server'
import { DealsBoard } from '@/components/dashboard/deals-board'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import type { Deal } from '@/lib/types'

export default async function DealsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Deals</h1>
          <p className="text-muted-foreground">Track your sales pipeline and opportunities</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>

      <DealsBoard deals={(deals as Deal[]) ?? []} />
    </div>
  )
}
