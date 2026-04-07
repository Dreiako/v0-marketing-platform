import { createClient } from '@/lib/supabase/server'
import { ContactsTable } from '@/components/dashboard/contacts-table'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import type { Contact } from '@/lib/types'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Contacts</h1>
          <p className="text-muted-foreground">Manage your leads, prospects, and customers</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <ContactsTable contacts={(contacts as Contact[]) ?? []} />
    </div>
  )
}
