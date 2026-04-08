'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  FileText, Image as ImageIcon, Video, MoreVertical, Link2, Trash2,
  Eye, Download, FolderOpen, FileSpreadsheet, BookOpen,
} from 'lucide-react'
import type { Asset, AssetCategory } from '@/lib/types'
import { CreateLinkDialog } from './create-link-dialog'
import { AssetPreviewModal } from './asset-preview-modal'

const CATEGORIES: { value: AssetCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'deck', label: 'Decks' },
  { value: 'video', label: 'Videos' },
  { value: 'image', label: 'Images' },
  { value: 'document', label: 'Documents' },
  { value: 'factsheet', label: 'Fact Sheets' },
]

const categoryColors: Record<AssetCategory, string> = {
  deck: 'bg-blue-100 text-blue-700',
  video: 'bg-red-100 text-red-700',
  image: 'bg-orange-100 text-orange-700',
  document: 'bg-gray-100 text-gray-700',
  factsheet: 'bg-green-100 text-green-700',
}

const typeIcon: Record<string, typeof FileText> = {
  slide: BookOpen,
  factsheet: FileSpreadsheet,
  tutorial: Video,
  video: Video,
  image: ImageIcon,
  pdf: FileText,
}

function AssetThumbnail({ asset }: { asset: Asset }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const supabase = createClient()
  const Icon = typeIcon[asset.type] ?? FileText
  const mime = asset.mime_type ?? ''

  const isImage = mime.startsWith('image/')
  const isVideo = mime.startsWith('video/')

  useEffect(() => {
    if (!isImage && !isVideo) return
    supabase.storage
      .from('marketing-assets')
      .createSignedUrl(asset.file_path, 3600)
      .then(({ data }) => setImgUrl(data?.signedUrl ?? null))
  }, [asset.file_path, isImage, isVideo]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isImage && imgUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imgUrl} alt={asset.title} className="h-full w-full object-cover" />
    )
  }
  if (isVideo && imgUrl) {
    return <video src={imgUrl} className="h-full w-full object-cover" muted preload="metadata" />
  }

  const cat = asset.category ?? 'document'
  const colorMap: Record<string, string> = {
    deck: 'bg-blue-50',
    video: 'bg-red-50',
    image: 'bg-orange-50',
    document: 'bg-gray-50',
    factsheet: 'bg-green-50',
  }
  const iconColorMap: Record<string, string> = {
    deck: 'text-blue-500',
    video: 'text-red-500',
    image: 'text-orange-500',
    document: 'text-gray-500',
    factsheet: 'text-green-500',
  }

  return (
    <div className={`flex h-full w-full items-center justify-center ${colorMap[cat] ?? 'bg-muted'}`}>
      <Icon className={`h-14 w-14 ${iconColorMap[cat] ?? 'text-muted-foreground'}`} />
    </div>
  )
}

interface AssetGridProps {
  assets: Asset[]
}

export function AssetGrid({ assets }: AssetGridProps) {
  const [activeCategory, setActiveCategory] = useState<AssetCategory | 'all'>('all')
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null)
  const [linkAsset, setLinkAsset] = useState<Asset | null>(null)
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const filtered = activeCategory === 'all'
    ? assets
    : assets.filter((a) => a.category === activeCategory)

  const handleDelete = async () => {
    if (!deleteAsset) return
    setDeleting(true)
    try {
      await supabase.storage.from('marketing-assets').remove([deleteAsset.file_path])
      await supabase.from('assets').delete().eq('id', deleteAsset.id)
      router.refresh()
    } finally {
      setDeleting(false)
      setDeleteAsset(null)
    }
  }

  const handleDownload = async (asset: Asset) => {
    const { data } = await supabase.storage.from('marketing-assets').createSignedUrl(asset.file_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
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
      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const count = cat.value === 'all'
            ? assets.length
            : assets.filter((a) => a.category === cat.value).length
          return (
            <Button
              key={cat.value}
              variant={activeCategory === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.value)}
            >
              {cat.label}
              <span className="ml-1.5 rounded-full bg-background/20 px-1.5 text-xs">{count}</span>
            </Button>
          )
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((asset) => (
          <Card key={asset.id} className="group overflow-hidden transition-shadow hover:shadow-md">
            <CardContent className="p-0">
              {/* Thumbnail */}
              <div
                className="relative aspect-[4/3] cursor-pointer overflow-hidden"
                onClick={() => setPreviewAsset(asset)}
              >
                <AssetThumbnail asset={asset} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/20">
                  <Eye className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-card-foreground">{asset.title}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      {asset.category && (
                        <Badge
                          variant="secondary"
                          className={`text-xs capitalize ${categoryColors[asset.category]}`}
                        >
                          {asset.category}
                        </Badge>
                      )}
                      <span className="text-xs capitalize text-muted-foreground">{asset.type}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewAsset(asset)}>
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
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteAsset(asset)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {asset.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{asset.description}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(asset.created_at).toLocaleDateString()}
                  {asset.file_size && (
                    <span className="ml-2">{(asset.file_size / 1024 / 1024).toFixed(1)} MB</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AssetPreviewModal
        asset={previewAsset}
        open={!!previewAsset}
        onClose={() => setPreviewAsset(null)}
      />

      <AlertDialog open={!!deleteAsset} onOpenChange={() => setDeleteAsset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deleteAsset?.title}&quot;? This also deletes all share links for this asset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete'}
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
