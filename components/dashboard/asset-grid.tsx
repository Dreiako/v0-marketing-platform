'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  FileText, Image as ImageIcon, Video, MoreVertical, Link2, Trash2,
  Eye, Download, FolderOpen, FileSpreadsheet, BookOpen, Folder,
  FolderInput, ArrowLeft, Settings2, Plus,
} from 'lucide-react'
import type { Asset, Folder as FolderType, UserCategory } from '@/lib/types'
import { CreateLinkDialog } from './create-link-dialog'
import { AssetPreviewModal } from './asset-preview-modal'
import { categoryColorClass } from './manage-categories-dialog'

const typeIcon: Record<string, typeof FileText> = {
  slide: BookOpen, factsheet: FileSpreadsheet,
  tutorial: Video, video: Video, image: ImageIcon, pdf: FileText,
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────
function AssetThumbnail({ asset, categories }: { asset: Asset; categories: UserCategory[] }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const supabase = createClient()
  const Icon = typeIcon[asset.type] ?? FileText
  const mime = asset.mime_type ?? ''
  const isImage = mime.startsWith('image/')
  const isVideo = mime.startsWith('video/')

  useEffect(() => {
    if (!isImage && !isVideo) return
    supabase.storage.from('marketing-assets').createSignedUrl(asset.file_path, 3600)
      .then(({ data }) => setImgUrl(data?.signedUrl ?? null))
  }, [asset.file_path, isImage, isVideo]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isImage && imgUrl) return <img src={imgUrl} alt={asset.title} className="h-full w-full object-cover" /> // eslint-disable-line @next/next/no-img-element
  if (isVideo && imgUrl) return <video src={imgUrl} className="h-full w-full object-cover" muted preload="metadata" />

  const cat = categories.find((c) => c.name === asset.category)
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50', green: 'bg-green-50', red: 'bg-red-50',
    purple: 'bg-purple-50', orange: 'bg-orange-50', gray: 'bg-gray-50',
  }
  const iconColorMap: Record<string, string> = {
    blue: 'text-blue-500', green: 'text-green-500', red: 'text-red-500',
    purple: 'text-purple-500', orange: 'text-orange-500', gray: 'text-gray-500',
  }
  const col = cat?.color ?? 'gray'
  return (
    <div className={`flex h-full w-full items-center justify-center ${colorMap[col] ?? 'bg-muted'}`}>
      <Icon className={`h-14 w-14 ${iconColorMap[col] ?? 'text-muted-foreground'}`} />
    </div>
  )
}

// ── Folder card ───────────────────────────────────────────────────────────────
function FolderCard({
  folder, assetCount, onOpen, onRename, onDelete,
}: {
  folder: FolderType
  assetCount: number
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
}) {
  return (
    <Card className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-md" onClick={onOpen}>
      <CardContent className="p-0">
        <div className="flex aspect-[4/3] items-center justify-center bg-amber-50">
          <FolderOpen className="h-16 w-16 text-amber-400" />
        </div>
        <div className="flex items-center justify-between p-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-card-foreground">{folder.name}</h3>
            <p className="text-xs text-muted-foreground">{assetCount} file{assetCount !== 1 ? 's' : ''}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen() }}>
                <FolderOpen className="mr-2 h-4 w-4" />Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename() }}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete() }}>
                <Trash2 className="mr-2 h-4 w-4" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface AssetGridProps {
  assets: Asset[]
  folders: FolderType[]
  categories: UserCategory[]
  onManageCategories: () => void
  onNewFolder: () => void
}

export function AssetGrid({ assets, folders, categories, onManageCategories, onNewFolder }: AssetGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null)
  const [deleteFolder, setDeleteFolder] = useState<FolderType | null>(null)
  const [linkAsset, setLinkAsset] = useState<Asset | null>(null)
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)
  const [renameFolder, setRenameFolder] = useState<FolderType | null>(null)
  const [renameName, setRenameName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null

  // Filtered assets
  const folderAssets = activeFolderId
    ? assets.filter((a) => a.folder_id === activeFolderId)
    : assets.filter((a) => a.folder_id == null)

  const filtered = activeCategory === 'all'
    ? folderAssets
    : folderAssets.filter((a) => a.category === activeCategory)

  const handleDeleteAsset = async () => {
    if (!deleteAsset) return
    setDeleting(true)
    await supabase.storage.from('marketing-assets').remove([deleteAsset.file_path])
    await supabase.from('assets').delete().eq('id', deleteAsset.id)
    router.refresh()
    setDeleting(false)
    setDeleteAsset(null)
  }

  const handleDeleteFolder = async () => {
    if (!deleteFolder) return
    // Move assets out of folder first
    await supabase.from('assets').update({ folder_id: null }).eq('folder_id', deleteFolder.id)
    await supabase.from('folders').delete().eq('id', deleteFolder.id)
    router.refresh()
    setDeleteFolder(null)
    if (activeFolderId === deleteFolder.id) setActiveFolderId(null)
  }

  const handleMoveToFolder = async (asset: Asset, folderId: string | null) => {
    await supabase.from('assets').update({ folder_id: folderId }).eq('id', asset.id)
    router.refresh()
  }

  const handleRenameFolder = async () => {
    if (!renameFolder || !renameName.trim()) return
    await supabase.from('folders').update({ name: renameName.trim() }).eq('id', renameFolder.id)
    router.refresh()
    setRenameFolder(null)
  }

  const handleDownload = async (asset: Asset) => {
    const { data } = await supabase.storage.from('marketing-assets').createSignedUrl(asset.file_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <>
      {/* Category filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={activeCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCategory('all')}
        >
          All
          <span className="ml-1.5 rounded-full bg-background/20 px-1.5 text-xs">{folderAssets.length}</span>
        </Button>
        {categories.map((cat) => {
          const count = folderAssets.filter((a) => a.category === cat.name).length
          return (
            <Button
              key={cat.id}
              variant={activeCategory === cat.name ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.name)}
            >
              {cat.name}
              <span className="ml-1.5 rounded-full bg-background/20 px-1.5 text-xs">{count}</span>
            </Button>
          )
        })}
        <Button variant="ghost" size="sm" onClick={onManageCategories}>
          <Settings2 className="mr-1 h-3.5 w-3.5" />
          Categories
        </Button>
      </div>

      {/* Breadcrumb / folder header */}
      {activeFolder ? (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setActiveFolderId(null)}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            All Assets
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground flex items-center gap-1.5">
            <Folder className="h-4 w-4 text-amber-400" />
            {activeFolder.name}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onNewFolder}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Folder
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!activeFolderId && folders.length === 0 && assets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-semibold">No assets yet</h3>
            <p className="mt-2 text-center text-muted-foreground">Upload your first collateral to get started</p>
          </CardContent>
        </Card>
      )}

      {/* Grid: folders first (only at root level), then assets */}
      {((!activeFolderId && (folders.length > 0 || filtered.length > 0)) || activeFolderId) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Folder cards (root only) */}
          {!activeFolderId && folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              assetCount={assets.filter((a) => a.folder_id === folder.id).length}
              onOpen={() => setActiveFolderId(folder.id)}
              onRename={() => { setRenameFolder(folder); setRenameName(folder.name) }}
              onDelete={() => setDeleteFolder(folder)}
            />
          ))}

          {/* Asset cards */}
          {filtered.map((asset) => (
            <Card key={asset.id} className="group overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-0">
                <div
                  className="relative aspect-[4/3] cursor-pointer overflow-hidden"
                  onClick={() => setPreviewAsset(asset)}
                >
                  <AssetThumbnail asset={asset} categories={categories} />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/20">
                    <Eye className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-card-foreground">{asset.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {asset.category && (() => {
                          const cat = categories.find((c) => c.name === asset.category)
                          return (
                            <Badge variant="secondary" className={`text-xs capitalize ${cat ? categoryColorClass(cat.color) : 'bg-gray-100 text-gray-700'}`}>
                              {asset.category}
                            </Badge>
                          )
                        })()}
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
                          <Eye className="mr-2 h-4 w-4" />Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(asset)}>
                          <Download className="mr-2 h-4 w-4" />Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLinkAsset(asset)}>
                          <Link2 className="mr-2 h-4 w-4" />Create Share Link
                        </DropdownMenuItem>

                        {/* Move to folder submenu */}
                        {folders.length > 0 && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <FolderInput className="mr-2 h-4 w-4" />Move to Folder
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {asset.folder_id && (
                                <DropdownMenuItem onClick={() => handleMoveToFolder(asset, null)}>
                                  Remove from folder
                                </DropdownMenuItem>
                              )}
                              {folders.filter((f) => f.id !== asset.folder_id).map((f) => (
                                <DropdownMenuItem key={f.id} onClick={() => handleMoveToFolder(asset, f.id)}>
                                  <Folder className="mr-2 h-4 w-4 text-amber-400" />{f.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteAsset(asset)}>
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {asset.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{asset.description}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(asset.created_at).toLocaleDateString()}
                    {asset.file_size && <span className="ml-2">{(asset.file_size / 1024 / 1024).toFixed(1)} MB</span>}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty folder state */}
          {activeFolderId && filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <Folder className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-3 text-muted-foreground text-sm">This folder is empty. Move assets here from their menu.</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AssetPreviewModal asset={previewAsset} open={!!previewAsset} onClose={() => setPreviewAsset(null)} />
      <CreateLinkDialog asset={linkAsset} open={!!linkAsset} onOpenChange={(o) => !o && setLinkAsset(null)} />

      {/* Rename folder dialog */}
      <AlertDialog open={!!renameFolder} onOpenChange={() => setRenameFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Folder</AlertDialogTitle>
          </AlertDialogHeader>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRenameFolder}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete folder */}
      <AlertDialog open={!!deleteFolder} onOpenChange={() => setDeleteFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deleteFolder?.name}&quot;? Files inside will be moved back to root — they won&apos;t be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete asset */}
      <AlertDialog open={!!deleteAsset} onOpenChange={() => setDeleteAsset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deleteAsset?.title}&quot;? This also removes all share links for this asset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAsset} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
