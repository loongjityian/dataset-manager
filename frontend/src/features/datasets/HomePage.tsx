import { Navigate } from 'react-router'
import { useLayout } from '../../app/layoutContext'
import { datasetPath } from '../../app/paths'
import { Icon } from '../../components/Icon'
import { LoadError } from '../../components/LoadError'
import { MenuButton } from '../../components/MenuButton'
import { button, cx } from '../../lib/styles'
import { HeaderSkeleton } from './HeaderSkeleton'
import { useDatasets } from './queries'

/** Opens the newest dataset, or invites a first upload when there are none. */
export function HomePage() {
  const { openUpload, openNav } = useLayout()
  const { data: datasets, error, refetch } = useDatasets()

  if (datasets?.length) return <Navigate to={datasetPath(datasets[0].id)} replace />
  if (!datasets && error) {
    return (
      <LoadError title="Couldn't load datasets" error={error} onRetry={() => void refetch()} />
    )
  }
  if (!datasets) return <HeaderSkeleton />

  return (
    <div className="paper-grid relative flex flex-1 items-center justify-center px-6">
      <MenuButton onClick={openNav} className="absolute top-4 left-4" />
      <div className="rise max-w-md text-center">
        <h1 className="font-mono text-xs tracking-[0.2em] text-accent uppercase">No datasets</h1>
        <p className="mt-3 text-sm text-muted">Upload one or more files to browse, add, edit and delete their rows.</p>
        <button type="button" className={cx(button.primary, 'mt-6 h-10 px-4')} onClick={openUpload}>
          <Icon name="upload" />
          Upload CSV
        </button>
      </div>
    </div>
  )
}
