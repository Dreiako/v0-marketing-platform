'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus } from 'lucide-react'
import type { UserCategory } from '@/lib/types'

const COLOR_OPTIONS = [
  { label: 'Blue',   value: 'blue',   cls: 'bg-blue-100 text-blue-700' },
  { label: 'Green',  value: 'green',  cls: 'bg-green-100 text-green-700' },
  { label: 'Red',    value: 'red',    cls: 'bg-red-100 text-red-700' },
  { label: 'Purple', value: 'purple', cls: 'bg-purple-100 text-purple-700' },
  { label: 'Orange', value: 'orange', cls: 'bg-orange-100 text-orange-700' },
  { label: 'Gray',   value: 'gray',   cls: 'bg-gray-100 text-gray-700' },
]

export const categoryColorClass = (color: string) =>
  COLOR_OPTIONS.find((c) => c.value === color)?.cls ?? 'bg-gray-100 text-gray-700'

interface ManageCategoriesDialogProps {
  open: boolean
  onClose: () => void
  categories: UserCategory[]
}

export function ManageCategoriesDialog({ open, onClose, categories }: ManageCategoriesDialogProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('blue')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Enter a category name'); return }
    setSaving(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { error: dbError } = await supabase.from('asset_categories').insert({
      user_id: user?.id,
      name: name.trim(),
      color,
    })
    if (dbError) { setError('Failed to add category') }
    else { router.refresh(); setName('') }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('asset_categories').delete().eq('id', id)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>Add or remove asset categories.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Existing categories */}
          <div className="space-y-2">
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">No categories yet.</p>
            )}
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className={`rounded px-2 py-0.5 text-sm font-medium capitalize ${categoryColorClass(cat.color)}`}>
                  {cat.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(cat.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add new */}
          <form onSubmit={handleAdd} className="space-y-3 border-t border-border pt-4">
            <Label>New Category</Label>
            <Input
              placeholder="Category name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null) }}
            />
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-all ${c.cls} ${color === c.value ? 'ring-2 ring-offset-1 ring-foreground/30' : ''}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="sm" disabled={saving} className="w-full">
              <Plus className="mr-1.5 h-4 w-4" />
              {saving ? 'Adding…' : 'Add Category'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
