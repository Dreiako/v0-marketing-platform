'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'
import { AssetViewer } from '@/components/viewer/asset-viewer'
import type { ShareLink, Asset } from '@/lib/types'

interface ShareLinkWithAsset extends ShareLink {
  assets: Asset
}

interface PasswordGateProps {
  shareLink: ShareLinkWithAsset
}

export function PasswordGate({ shareLink }: PasswordGateProps) {
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [unlockedData, setUnlockedData] = useState<{
    signedUrl: string
    asset: Asset
    shareLink: ShareLink
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const res = await fetch(`/api/view/${shareLink.slug}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(res.status === 401 ? 'Incorrect password' : (data.error ?? 'Something went wrong'))
        return
      }

      setUnlockedData(data)
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
      />
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Password Protected</CardTitle>
          <CardDescription>
            Enter the password to view &quot;{shareLink.assets.title}&quot;
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrorMsg(null)
                }}
                className={errorMsg ? 'border-destructive' : ''}
                disabled={loading}
              />
              {errorMsg && (
                <p className="text-sm text-destructive">{errorMsg}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Checking...' : 'Unlock'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
