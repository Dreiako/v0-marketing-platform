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
import { Check, Copy, Link2, Mail, KeyRound, Calendar } from 'lucide-react'
import type { Asset } from '@/lib/types'

interface CreateLinkDialogProps {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length))
  return result
}

export function CreateLinkDialog({ asset, open, onOpenChange }: CreateLinkDialogProps) {
  const [password, setPassword] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const [requireEmail, setRequireEmail] = useState(false)
  const [useSecretKey, setUseSecretKey] = useState(false)
  const [secretKey, setSecretKey] = useState('')
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
        password_hash: usePassword && password ? password : null,
        require_email: requireEmail,
        secret_key: requireEmail && useSecretKey && secretKey ? secretKey : null,
        expires_at: useExpiry && expiryDate ? new Date(expiryDate).toISOString() : null,
        is_active: true,
      })

      if (dbError) throw dbError

      setCreatedLink(`${window.location.origin}/view/${slug}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!createdLink) return
    await navigator.clipboard.writeText(createdLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setPassword(''); setUsePassword(false)
    setRequireEmail(false); setUseSecretKey(false); setSecretKey('')
    setUseExpiry(false); setExpiryDate('')
    setCreatedLink(null); setError(null)
    onOpenChange(false)
  }

  const ToggleRow = ({
    icon: Icon,
    title,
    description,
    checked,
    onChange,
  }: {
    icon: typeof Link2
    title: string
    description: string
    checked: boolean
    onChange: (v: boolean) => void
  }) => (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Share Link</DialogTitle>
          <DialogDescription>Generate a shareable link for &quot;{asset?.title}&quot;</DialogDescription>
        </DialogHeader>

        {createdLink ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center rounded-full bg-green-100 p-4 mx-auto w-fit">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-center font-medium text-foreground">Link created!</p>
            <div className="flex items-center gap-2">
              <Input value={createdLink} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Share this link with your customers to track engagement
            </p>
            <Button className="w-full" onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Email capture */}
            <ToggleRow
              icon={Mail}
              title="Require Email Address"
              description="Viewers must enter their email before accessing"
              checked={requireEmail}
              onChange={setRequireEmail}
            />
            {requireEmail && (
              <>
                <ToggleRow
                  icon={KeyRound}
                  title="Secret Key"
                  description="Also require a secret key (invite-only access)"
                  checked={useSecretKey}
                  onChange={setUseSecretKey}
                />
                {useSecretKey && (
                  <div className="space-y-2">
                    <Label htmlFor="secret-key">Secret Key</Label>
                    <Input
                      id="secret-key"
                      placeholder="e.g. LAUNCH2024"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            {/* Password protection */}
            <ToggleRow
              icon={Link2}
              title="Password Protection"
              description="Require a password to view (no email capture)"
              checked={usePassword}
              onChange={setUsePassword}
            />
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

            {/* Expiry */}
            <ToggleRow
              icon={Calendar}
              title="Expiration Date"
              description="Automatically disable this link after a date"
              checked={useExpiry}
              onChange={setUseExpiry}
            />
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

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating…' : 'Create Link'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
