import { button, cx } from '../lib/styles'
import { Icon } from './Icon'

/** Opens the dataset list; only shown on small screens. */
export function MenuButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button type="button" className={cx(button.icon, 'md:hidden', className)} onClick={onClick} aria-label="Show datasets">
      <Icon name="menu" />
    </button>
  )
}
