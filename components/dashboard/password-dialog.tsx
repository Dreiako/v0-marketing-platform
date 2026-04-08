'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordDialogProps {
  linkId: string
  currentPassword: string | null
  open: boolean
  onClose: () => void
}

export function PasswordDialog({ linkId, currentPassword, open, onClose }: PasswordDialogProps) {
  const [password, setPassword] = useState(currentPassword ?? '')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const { error } = await supabase
      .from('share_links')
      .update({ password_hash: password.trim() || null })
      .eq('id', linkId)

    if (error) {
      setError('Failed to update password')
    } else {
      router.refresh()
      onClose()
    }

    setSaving(false)
  }

  const handleRemove = async () => {
    setSaving(true)
    await supabase.from('share_links').update({ password_hash: null }).eq('id', linkId)
    router.refresh()
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Password</DialogTitle>
          <DialogDescription>
            Set or update the password for this share link. Leave blank to remove password protection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="link-password">Password</Label>
            <div className="relative">
              <Input
                id="link-password"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {currentPassword && (
            <Button variant="outline" onClick={handleRemove} disabled={saving} className="mr-auto">
              Remove Password
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
