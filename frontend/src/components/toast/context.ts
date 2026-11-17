import { createContext, useContext } from 'react'

export type ToastTone = 'ok' | 'error'

export type Notify = (message: string, tone?: ToastTone) => void

export const ToastContext = createContext<Notify | null>(null)

/** Shows a short message at the bottom of the screen. */
export function useToast(): Notify {
  const notify = useContext(ToastContext)
  if (!notify) throw new Error('useToast must be used inside <ToastProvider>')
  return notify
}
