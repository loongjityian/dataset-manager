import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { isNotFound } from '../../api/client'
import { useLayout } from '../../app/layoutContext'
import { LoadError } from '../../components/LoadError'
import { MenuButton } from '../../components/MenuButton'
import { Notice } from '../../components/Notice'
import { useToast } from '../../components/toast/context'
import { button } from '../../lib/styles'
import { RowsView } from '../rows/RowsView'
import { DatasetHeader } from './DatasetHeader'
import { DeleteDatasetDialog } from './DeleteDatasetDialog'
import { HeaderSkeleton } from './HeaderSkeleton'
import { useDataset, useDeleteDataset, useRenameDataset } from './queries'
import { SchemaView } from './SchemaView'
import { useDatasetView } from './useDatasetView'

export function DatasetPage() {
  const { datasetId = '' } = useParams()
  // A fresh screen per dataset, so edits in progress never carry over to another one.
  return <DatasetScreen key={datasetId} id={datasetId} />
}

function DatasetScreen({ id }: { id: string }) {
  const { openNav } = useLayout()
  const navigate = useNavigate()
  const notify = useToast()
  const view = useDatasetView()
  const { data: dataset, error, refetch } = useDataset(id)
  const rename = useRenameDataset(id)
  const remove = useDeleteDataset()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // A 404 wins over a cached copy, e.g. going Back to a deleted dataset.
  if (!dataset || isNotFound(error)) {
    if (!error) return <HeaderSkeleton />
    return (
      <>
        <MenuButton onClick={openNav} className="m-4" />
        {isNotFound(error) ? (
          <Notice icon="table" title="Dataset not found" body="It may have been deleted, or the link is wrong.">
            <Link to="/" className={button.secondary}>
              Go to datasets
            </Link>
          </Notice>
        ) : (
          <LoadError title="Couldn't load this dataset" error={error} onRetry={() => void refetch()} />
        )}
      </>
    )
  }

  const renameDataset = async (name: string) => {
    await rename.mutateAsync(name)
    notify('Dataset renamed')
  }

  const deleteDataset = () =>
    remove.mutate(id, {
      onSuccess: (deleted) => {
        notify(`Deleted “${deleted.display_name}”`)
        navigate('/', { replace: true })
      },
    })

  const copyId = () =>
    navigator.clipboard.writeText(dataset.id).then(
      () => notify('Dataset ID copied'),
      () => notify("Couldn't copy the ID", 'error'),
    )

  return (
    <div className="rise flex min-h-0 flex-1 flex-col">
      <DatasetHeader
        dataset={dataset}
        tab={view.tab}
        onTab={view.setTab}
        onRename={renameDataset}
        onDelete={() => setConfirmingDelete(true)}
        onCopyId={copyId}
        onMenu={openNav}
      />
      {view.tab === 'rows' ? (
        <RowsView
          datasetId={id}
          columns={dataset.columns}
          page={view.page}
          size={view.size}
          setPage={view.setPage}
          setSize={view.setSize}
        />
      ) : (
        <SchemaView columns={dataset.columns} />
      )}
      {confirmingDelete && (
        <DeleteDatasetDialog
          dataset={dataset}
          deleting={remove.isPending}
          error={remove.error}
          onClose={() => {
            setConfirmingDelete(false)
            remove.reset()
          }}
          onConfirm={deleteDataset}
        />
      )}
    </div>
  )
}
