/** Joins class names, skipping falsy values. */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')

const buttonBase =
  'inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50'

export const button = {
  primary: `${buttonBase} bg-ink text-paper hover:bg-ink/85`,
  secondary: `${buttonBase} border border-line-strong bg-surface text-ink hover:bg-sunken`,
  ghost: `${buttonBase} text-muted hover:bg-sunken hover:text-ink`,
  danger: `${buttonBase} bg-danger text-white hover:bg-danger/85`,
  icon: 'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-sunken hover:text-ink',
}
