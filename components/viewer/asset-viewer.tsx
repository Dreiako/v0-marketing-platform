'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Download, FileText, Maximize2, Minimize2 } from 'lucide-react'
import type { ShareLink, Asset } from '@/lib/types'

interface AssetViewerProps {
  shareLink: ShareLink
  asset: Asset
  signedUrl: string
}

function generateVisitorId(): string {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('visitor_id') : null
  if (stored) return stored
  
  const id = `v_${Date.now()}_${Math.random().toString(36).substring(7)}`
  if (typeof window !== 'undefined') {
    localStorage.setItem('visitor_id', id)
  }
  return id
}

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown'
  const ua = navigator.userAgent
  if (/mobile/i.test(ua)) return 'mobile'
  if (/tablet/i.test(ua)) return 'tablet'
  return 'desktop'
}

export function AssetViewer({ shareLink, asset, signedUrl }: AssetViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [scrollDepth, setScrollDepth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const startTimeRef = useRef<number>(Date.now())
  const hasTrackedViewRef = useRef(false)
  const supabase = createClient()

  // Track view on mount
  useEffect(() => {
    const trackView = async () => {
      if (hasTrackedViewRef.current) return
      hasTrackedViewRef.current = true

      const visitorId = generateVisitorId()
      
      await supabase.from('analytics_events').insert({
        share_link_id: shareLink.id,
        event_type: 'view',
        visitor_id: visitorId,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        device_type: getDeviceType(),
      })
    }

    trackView()
  }, [shareLink.id, supabase])

  // Track scroll depth with PostHog-style milestones (25 / 50 / 75 / 100 %)
  useEffect(() => {
    const MILESTONES = [25, 50, 75, 100]
    const reached = new Set<number>()
    const visitorId = generateVisitorId()

    const handleScroll = () => {
      if (!containerRef.current) return
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const scrollable = scrollHeight - clientHeight
      const depth = scrollable > 0 ? Math.round((scrollTop / scrollable) * 100) : 100
      setScrollDepth((prev) => Math.max(prev, depth))

      MILESTONES.forEach(async (milestone) => {
        if (depth >= milestone && !reached.has(milestone)) {
          reached.add(milestone)
          await supabase.from('analytics_events').insert({
            share_link_id: shareLink.id,
            event_type: 'scroll_milestone',
            visitor_id: visitorId,
            scroll_depth: milestone,
            device_type: getDeviceType(),
          })
        }
      })
    }

    const container = containerRef.current
    container?.addEventListener('scroll', handleScroll, { passive: true })
    return () => container?.removeEventListener('scroll', handleScroll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareLink.id])

  // Track time spent and scroll depth on exit
  useEffect(() => {
    const trackExit = async () => {
      const visitorId = generateVisitorId()
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)

      // Track time spent
      await supabase.from('analytics_events').insert({
        share_link_id: shareLink.id,
        event_type: 'time_spent',
        visitor_id: visitorId,
        time_spent_seconds: timeSpent,
        device_type: getDeviceType(),
      })

      // Track scroll depth
      if (scrollDepth > 0) {
        await supabase.from('analytics_events').insert({
          share_link_id: shareLink.id,
          event_type: 'scroll',
          visitor_id: visitorId,
          scroll_depth: scrollDepth,
          device_type: getDeviceType(),
        })
      }

      // Track exit
      await supabase.from('analytics_events').insert({
        share_link_id: shareLink.id,
        event_type: 'exit',
        visitor_id: visitorId,
        time_spent_seconds: timeSpent,
        scroll_depth: scrollDepth,
        device_type: getDeviceType(),
      })
    }

    const handleBeforeUnload = () => {
      trackExit()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackExit()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [shareLink.id, scrollDepth, supabase])

  const handleDownload = async () => {
    const visitorId = generateVisitorId()
    
    // Track download
    await supabase.from('analytics_events').insert({
      share_link_id: shareLink.id,
      event_type: 'download',
      visitor_id: visitorId,
      device_type: getDeviceType(),
    })

    // Open download link
    window.open(signedUrl, '_blank')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const renderContent = () => {
    const mimeType = asset.mime_type || ''

    if (mimeType.startsWith('image/')) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signedUrl}
            alt={asset.title}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )
    }

    if (mimeType.startsWith('video/')) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <video
            src={signedUrl}
            controls
            className="max-h-full max-w-full"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    if (mimeType === 'application/pdf') {
      return (
        <iframe
          src={`${signedUrl}#toolbar=0`}
          className="h-full w-full border-0"
          title={asset.title}
        />
      )
    }

    // Fallback for other types
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold text-foreground">{asset.title}</h2>
          <p className="mt-1 text-muted-foreground">
            This file type cannot be previewed directly
          </p>
        </div>
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download File
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div>
          <h1 className="font-semibold text-card-foreground">{asset.title}</h1>
          {asset.description && (
            <p className="text-sm text-muted-foreground">{asset.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      {/* Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted"
      >
        {renderContent()}
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-2 text-center text-xs text-muted-foreground">
        Powered by Visible
      </footer>
    </div>
  )
}
