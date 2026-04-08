'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, KeyRound } from 'lucide-react'
import { AssetViewer } from '@/components/viewer/asset-viewer'
import type { ShareLink, Asset } from '@/lib/types'

interface ShareLinkWithAsset extends ShareLink {
  assets: Asset
}

interface EmailGateProps {
  shareLink: ShareLinkWithAsset
}

export function EmailGate({ shareLink }: EmailGateProps) {
  const [email, setEmail] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [unlockedData, setUnlockedData] = useState<{
    signedUrl: string
    asset: Asset
    shareLink: ShareLink
    viewerEmail: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setErrorMsg('Please enter your email address'); return }
    setErrorMsg(null)
    setLoading(true)

    try {
      const res = await fetch(`/api/view/${shareLink.slug}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), secretKey: secretKey.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(res.status === 401 ? 'Incorrect secret key' : (data.error ?? 'Something went wrong'))
        return
      }

      setUnlockedData({ ...data, viewerEmail: email.trim() })
    } catch {
      setErrorMsg('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (unlockedData) {
    return (
      <AssetViewer
        shareLink={unlockedData.shareLink as ShareLink}
        asset={unlockedData.asset}
        signedUrl={unlockedData.signedUrl}
        viewerEmail={unlockedData.viewerEmail}
      />
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Access Required</CardTitle>
          <CardDescription>
            Enter your details to view &quot;{shareLink.assets.title}&quot;
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="viewer-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="viewer-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(null) }}
                  className="pl-9"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {shareLink.secret_key && (
              <div className="space-y-2">
                <Label htmlFor="secret-key">Secret Key</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="secret-key"
                    type="password"
                    placeholder="Enter secret key"
                    value={secretKey}
                    onChange={(e) => { setSecretKey(e.target.value); setErrorMsg(null) }}
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'View Document'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
