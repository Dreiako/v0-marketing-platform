'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { FileText, Image, Video, MoreVertical, Link2, Trash2, Eye, Download, FolderOpen } from 'lucide-react'
import type { Asset } from '@/lib/types'
import { CreateLinkDialog } from './create-link-dialog'

const typeIcons: Record<string, typeof FileText> = {
  slide: FileText,
  factsheet: FileText,
  tutorial: Video,
  video: Video,
  image: Image,
  pdf: FileText,
}

const typeColors: Record<string, string> = {
  slide: 'bg-blue-100 text-blue-600',
  factsheet: 'bg-green-100 text-green-600',
  tutorial: 'bg-purple-100 text-purple-600',
  video: 'bg-red-100 text-red-600',
  image: 'bg-orange-100 text-orange-600',
  pdf: 'bg-gray-100 text-gray-600',
}

interface AssetGridProps {
  assets: Asset[]
}

export function AssetGrid({ assets }: AssetGridProps) {
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null)
  const [linkAsset, setLinkAsset] = useState<Asset | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!deleteAsset) return
    setDeleting(true)

    try {
      // Delete from storage
      await supabase.storage
        .from('marketing-assets')
        .remove([deleteAsset.file_path])

      // Delete from database
      await supabase
        .from('assets')
        .delete()
        .eq('id', deleteAsset.id)

      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setDeleting(false)
      setDeleteAsset(null)
    }
  }

  const handleDownload = async (asset: Asset) => {
    const { data } = await supabase.storage
      .from('marketing-assets')
      .createSignedUrl(asset.file_path, 60)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  const handlePreview = async (asset: Asset) => {
    const { data } = await supabase.storage
      .from('marketing-assets')
      .createSignedUrl(asset.file_path, 300)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  if (assets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FolderOpen className="h-16 w-16 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No assets yet</h3>
          <p className="mt-2 text-center text-muted-foreground">
            Upload your first marketing collateral to get started
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {assets.map((asset) => {
          const Icon = typeIcons[asset.type] || FileText
          const colorClass = typeColors[asset.type] || 'bg-gray-100 text-gray-600'

          return (
            <Card key={asset.id} className="group overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-0">
                <div className="flex aspect-[4/3] items-center justify-center bg-muted">
                  <div className={`rounded-xl p-6 ${colorClass}`}>
                    <Icon className="h-12 w-12" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-card-foreground">
                        {asset.title}
                      </h3>
                      <p className="text-sm capitalize text-muted-foreground">
                        {asset.type}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreview(asset)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(asset)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLinkAsset(asset)}>
                          <Link2 className="mr-2 h-4 w-4" />
                          Create Share Link
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteAsset(asset)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {asset.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {asset.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(asset.created_at).toLocaleDateString()}
                    {asset.file_size && (
                      <span className="ml-2">
                        {(asset.file_size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AlertDialog open={!!deleteAsset} onOpenChange={() => setDeleteAsset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteAsset?.title}&quot;? This action cannot be undone and will also delete all associated share links.
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

      <CreateLinkDialog
        asset={linkAsset}
        open={!!linkAsset}
        onOpenChange={(open) => !open && setLinkAsset(null)}
      />
    </>
  )
}
