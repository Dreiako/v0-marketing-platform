'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText } from 'lucide-react'
import type { Asset } from '@/lib/types'

interface AssetPreviewModalProps {
  asset: Asset | null
  open: boolean
  onClose: () => void
}

export function AssetPreviewModal({ asset, open, onClose }: AssetPreviewModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!open || !asset) { setSignedUrl(null); return }

    setLoading(true)
    supabase.storage
      .from('marketing-assets')
      .createSignedUrl(asset.file_path, 300)
      .then(({ data }) => {
        setSignedUrl(data?.signedUrl ?? null)
        setLoading(false)
      })
  }, [open, asset]) // eslint-disable-line react-hooks/exhaustive-deps

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
          Loading preview…
        </div>
      )
    }
    if (!signedUrl) {
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
          Preview unavailable
        </div>
      )
    }

    const mime = asset?.mime_type ?? ''

    if (mime.startsWith('image/')) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={signedUrl} alt={asset?.title} className="max-h-full max-w-full object-contain mx-auto" />
      )
    }
    if (mime.startsWith('video/')) {
      return <video src={signedUrl} controls className="max-h-full max-w-full mx-auto" />
    }
    if (mime === 'application/pdf') {
      return <iframe src={`${signedUrl}#toolbar=0`} className="h-full w-full border-0" title={asset?.title} />
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <FileText className="h-16 w-16 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          This file type cannot be previewed — <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">download instead</a>
        </p>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>{asset?.title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto px-6 pb-6">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
