import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

type Props = { icon: IconName; title: string; body: string; children?: ReactNode }

/** A centred message for empty, missing and failed states. */
export function Notice({ icon, title, body, children }: Props) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-sunken text-muted">
        <Icon name={icon} className="size-5" />
      </span>
      <h2 className="mt-3 text-sm font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
