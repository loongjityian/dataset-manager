import { useOutletContext } from 'react-router'

/** Actions the app shell offers to the page it renders. */
export type LayoutContext = {
  openUpload: () => void
  /** Opens the dataset list on small screens. */
  openNav: () => void
}

export const useLayout = () => useOutletContext<LayoutContext>()
