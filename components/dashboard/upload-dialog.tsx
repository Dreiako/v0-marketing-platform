'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, X, FileText, Image, Video } from 'lucide-react'
import type { AssetType } from '@/lib/types'

const assetTypes: { value: AssetType; label: string; icon: typeof FileText }[] = [
  { value: 'slide', label: 'Slides / Presentation', icon: FileText },
  { value: 'factsheet', label: 'Factsheet', icon: FileText },
  { value: 'tutorial', label: 'Tutorial', icon: Video },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'pdf', label: 'PDF Document', icon: FileText },
]

export function UploadDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<AssetType>('pdf')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      // Auto-detect type from mime type
      const mimeType = e.dataTransfer.files[0].type
      if (mimeType.startsWith('video/')) setType('video')
      else if (mimeType.startsWith('image/')) setType('image')
      else if (mimeType === 'application/pdf') setType('pdf')
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      const mimeType = e.target.files[0].type
      if (mimeType.startsWith('video/')) setType('video')
      else if (mimeType.startsWith('image/')) setType('image')
      else if (mimeType === 'application/pdf') setType('pdf')
    }
  }

  const handleUpload = async () => {
    if (!file || !title) {
      setError('Please provide a title and select a file')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload file to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('marketing-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Create asset record
      const { error: dbError } = await supabase.from('assets').insert({
        user_id: user.id,
        title,
        description: description || null,
        type,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      })

      if (dbError) throw dbError

      // Reset form and close dialog
      setTitle('')
      setDescription('')
      setType('pdf')
      setFile(null)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload New Asset</DialogTitle>
          <DialogDescription>
            Add a new marketing collateral to your library
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Q4 Product Overview"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the asset..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Asset Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as AssetType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <t.icon className="h-4 w-4" />
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>File</Label>
            <div
              className={`relative rounded-lg border-2 border-dashed p-6 transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      Drop your file here or{' '}
                      <label className="cursor-pointer text-primary hover:underline">
                        browse
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov"
                        />
                      </label>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PDF, Images, Videos up to 100MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !file || !title}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
