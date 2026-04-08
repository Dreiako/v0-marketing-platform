'use client'

import { useState } from 'react'
import { AssetGrid } from '@/components/dashboard/asset-grid'
import { CreateFolderDialog } from '@/components/dashboard/create-folder-dialog'
import { ManageCategoriesDialog } from '@/components/dashboard/manage-categories-dialog'
import type { Asset, Folder, UserCategory } from '@/lib/types'

interface AssetsPageClientProps {
  assets: Asset[]
  folders: Folder[]
  categories: UserCategory[]
}

export function AssetsPageClient({ assets, folders, categories }: AssetsPageClientProps) {
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showManageCategories, setShowManageCategories] = useState(false)

  return (
    <>
      <AssetGrid
        assets={assets}
        folders={folders}
        categories={categories}
        onNewFolder={() => setShowCreateFolder(true)}
        onManageCategories={() => setShowManageCategories(true)}
      />

      <CreateFolderDialog
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
      />

      <ManageCategoriesDialog
        open={showManageCategories}
        onClose={() => setShowManageCategories(false)}
        categories={categories}
      />
    </>
  )
}
