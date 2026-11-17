import { useState } from 'react'
import { Outlet } from 'react-router'
import { DatasetSidebar } from '../features/datasets/DatasetSidebar'
import { UploadDialog } from '../features/upload/UploadDialog'
import type { LayoutContext } from './layoutContext'

/** The dataset list beside the current page, plus the upload dialog both can open. */
export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  const openUpload = () => {
    setNavOpen(false)
    setUploadOpen(true)
  }
  const context: LayoutContext = { openUpload, openNav: () => setNavOpen(true) }

  return (
    <div className="flex h-dvh overflow-hidden">
      <DatasetSidebar open={navOpen} onClose={() => setNavOpen(false)} onUpload={openUpload} />
      <main className="flex min-w-0 flex-1 flex-col">
        <Outlet context={context} />
      </main>
      {uploadOpen && <UploadDialog onClose={() => setUploadOpen(false)} />}
    </div>
  )
}
