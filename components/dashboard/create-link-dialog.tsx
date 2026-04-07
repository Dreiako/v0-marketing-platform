'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Check, Copy, Link2 } from 'lucide-react'
import type { Asset } from '@/lib/types'

interface CreateLinkDialogProps {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function CreateLinkDialog({ asset, open, onOpenChange }: CreateLinkDialogProps) {
  const [password, setPassword] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const [useExpiry, setUseExpiry] = useState(false)
  const [expiryDate, setExpiryDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [createdLink, setCreatedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleCreate = async () => {
    if (!asset) return
    setCreating(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const slug = generateSlug()
      
      const { error: dbError } = await supabase.from('share_links').insert({
        user_id: user.id,
        asset_id: asset.id,
        slug,
        password_hash: usePassword && password ? password : null, // In production, hash this
        expires_at: useExpiry && expiryDate ? new Date(expiryDate).toISOString() : null,
        is_active: true,
      })

      if (dbError) throw dbError

      const link = `${window.location.origin}/view/${slug}`
      setCreatedLink(link)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    if (createdLink) {
      await navigator.clipboard.writeText(createdLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setPassword('')
    setUsePassword(false)
    setUseExpiry(false)
    setExpiryDate('')
    setCreatedLink(null)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Share Link</DialogTitle>
          <DialogDescription>
            Generate a shareable link for &quot;{asset?.title}&quot;
          </DialogDescription>
        </DialogHeader>

        {createdLink ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center rounded-full bg-green-100 p-4 mx-auto w-fit">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-center font-medium text-foreground">Link created successfully!</p>
            <div className="flex items-center gap-2">
              <Input
                value={createdLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Share this link with your customers to track engagement
            </p>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Link2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Password Protection</p>
                  <p className="text-sm text-muted-foreground">
                    Require a password to view
                  </p>
                </div>
              </div>
              <Switch checked={usePassword} onCheckedChange={setUsePassword} />
            </div>

            {usePassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Link2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Expiration Date</p>
                  <p className="text-sm text-muted-foreground">
                    Set an expiry for the link
                  </p>
                </div>
              </div>
              <Switch checked={useExpiry} onCheckedChange={setUseExpiry} />
            </div>

            {useExpiry && (
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create Link'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
