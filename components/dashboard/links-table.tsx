'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import {
  Copy,
  Check,
  MoreVertical,
  ExternalLink,
  Trash2,
  BarChart3,
  Link2,
  Lock,
  Calendar,
  Users,
  KeyRound,
} from 'lucide-react'
import Link from 'next/link'
import { PasswordDialog } from '@/components/dashboard/password-dialog'
import { ViewersDialog } from '@/components/dashboard/viewers-dialog'

interface ShareLinkWithAsset {
  id: string
  slug: string
  password_hash: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
  assets: {
    id: string
    title: string
    type: string
  }
}

interface LinksTableProps {
  links: ShareLinkWithAsset[]
}

export function LinksTable({ links }: LinksTableProps) {
  const [deleteLink, setDeleteLink] = useState<ShareLinkWithAsset | null>(null)
  const [passwordLink, setPasswordLink] = useState<ShareLinkWithAsset | null>(null)
  const [viewersLink, setViewersLink] = useState<ShareLinkWithAsset | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleCopy = async (slug: string, id: string) => {
    const url = `${window.location.origin}/view/${slug}`
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async () => {
    if (!deleteLink) return
    setDeleting(true)
    try {
      await supabase.from('share_links').delete().eq('id', deleteLink.id)
      router.refresh()
    } finally {
      setDeleting(false)
      setDeleteLink(null)
    }
  }

  const handleToggleActive = async (link: ShareLinkWithAsset) => {
    await supabase
      .from('share_links')
      .update({ is_active: !link.is_active })
      .eq('id', link.id)
    router.refresh()
  }

  const isExpired = (expiresAt: string | null) =>
    expiresAt ? new Date(expiresAt) < new Date() : false

  if (links.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Link2 className="h-16 w-16 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No share links yet</h3>
          <p className="mt-2 text-center text-muted-foreground">
            Create a share link from your assets to start tracking engagement
          </p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/assets">Go to Assets</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => {
              const expired = isExpired(link.expires_at)
              const status = !link.is_active ? 'inactive' : expired ? 'expired' : 'active'

              return (
                <TableRow key={link.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{link.assets.title}</p>
                      <p className="text-sm capitalize text-muted-foreground">{link.assets.type}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                        /view/{link.slug}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(link.slug, link.id)}
                      >
                        {copiedId === link.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        status === 'active'
                          ? 'default'
                          : status === 'expired'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {link.password_hash && (
                        <Lock className="h-4 w-4 text-muted-foreground" aria-label="Password protected" />
                      )}
                      {link.expires_at && (
                        <Calendar
                          className="h-4 w-4 text-muted-foreground"
                          aria-label={`Expires: ${new Date(link.expires_at).toLocaleDateString()}`}
                        />
                      )}
                      {!link.password_hash && !link.expires_at && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(link.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`/view/${link.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Link
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewersLink(link)}>
                          <Users className="mr-2 h-4 w-4" />
                          View Viewers
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/analytics?link=${link.id}`}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Analytics
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setPasswordLink(link)}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          {link.password_hash ? 'Edit Password' : 'Set Password'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(link)}>
                          {link.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteLink(link)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {passwordLink && (
        <PasswordDialog
          linkId={passwordLink.id}
          currentPassword={passwordLink.password_hash}
          open={!!passwordLink}
          onClose={() => setPasswordLink(null)}
        />
      )}

      {viewersLink && (
        <ViewersDialog
          linkId={viewersLink.id}
          assetTitle={viewersLink.assets.title}
          open={!!viewersLink}
          onClose={() => setViewersLink(null)}
        />
      )}

      <AlertDialog open={!!deleteLink} onOpenChange={() => setDeleteLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Share Link</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the link and all its analytics data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
