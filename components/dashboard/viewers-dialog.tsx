'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Monitor, Smartphone, Tablet, Users } from 'lucide-react'

interface ViewerSession {
  visitor_id: string
  first_seen: string
  device_type: string | null
  time_spent: number
  scroll_depth: number
  views: number
}

interface ViewersDialogProps {
  linkId: string
  assetTitle: string
  open: boolean
  onClose: () => void
}

const DeviceIcon = ({ device }: { device: string | null }) => {
  if (device === 'mobile') return <Smartphone className="h-4 w-4" />
  if (device === 'tablet') return <Tablet className="h-4 w-4" />
  return <Monitor className="h-4 w-4" />
}

function formatDuration(seconds: number) {
  if (!seconds) return '—'
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

export function ViewersDialog({ linkId, assetTitle, open, onClose }: ViewersDialogProps) {
  const [sessions, setSessions] = useState<ViewerSession[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!open) return

    const fetchViewers = async () => {
      setLoading(true)

      const { data: events } = await supabase
        .from('analytics_events')
        .select('visitor_id, event_type, device_type, time_spent_seconds, scroll_depth, created_at')
        .eq('share_link_id', linkId)
        .order('created_at', { ascending: true })

      if (!events) {
        setLoading(false)
        return
      }

      // Group by visitor_id
      const sessionMap: Record<string, ViewerSession> = {}

      events.forEach((e) => {
        if (!sessionMap[e.visitor_id]) {
          sessionMap[e.visitor_id] = {
            visitor_id: e.visitor_id,
            first_seen: e.created_at,
            device_type: e.device_type,
            time_spent: 0,
            scroll_depth: 0,
            views: 0,
          }
        }

        const s = sessionMap[e.visitor_id]

        if (e.event_type === 'view') s.views += 1
        if (e.event_type === 'time_spent' && e.time_spent_seconds) {
          s.time_spent = Math.max(s.time_spent, e.time_spent_seconds)
        }
        if ((e.event_type === 'scroll' || e.event_type === 'scroll_milestone') && e.scroll_depth) {
          s.scroll_depth = Math.max(s.scroll_depth, e.scroll_depth)
        }
      })

      setSessions(
        Object.values(sessionMap).sort(
          (a, b) => new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime()
        )
      )
      setLoading(false)
    }

    fetchViewers()
  }, [open, linkId, supabase])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Viewers — {assetTitle}</DialogTitle>
          <DialogDescription>
            {sessions.length} unique visitor{sessions.length !== 1 ? 's' : ''} have opened this link
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8 text-muted-foreground text-sm">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No views yet</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor</TableHead>
                  <TableHead>First Seen</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Time Spent</TableHead>
                  <TableHead>Scroll Depth</TableHead>
                  <TableHead>Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.visitor_id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {s.visitor_id.slice(0, 12)}…
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(s.first_seen).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground capitalize">
                        <DeviceIcon device={s.device_type} />
                        <span className="text-sm">{s.device_type ?? 'desktop'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDuration(s.time_spent)}</TableCell>
                    <TableCell>
                      <Badge variant={s.scroll_depth >= 75 ? 'default' : 'secondary'}>
                        {s.scroll_depth > 0 ? `${s.scroll_depth}%` : '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{s.views}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
