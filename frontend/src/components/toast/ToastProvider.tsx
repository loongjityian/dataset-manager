import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from '../Icon'
import { cx } from '../../lib/styles'
import { ToastContext, type ToastTone } from './context'

type Toast = { id: number; tone: ToastTone; message: string }

const MAX_VISIBLE = 3
const DURATION_MS: Record<ToastTone, number> = { ok: 3500, error: 6000 }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), [])

  const notify = useCallback(
    (message: string, tone: ToastTone = 'ok') => {
      const id = ++nextId.current
      setToasts((all) => [...all.slice(1 - MAX_VISIBLE), { id, tone, message }])
      const timer = setTimeout(() => {
        timers.current.delete(timer)
        dismiss(id)
      }, DURATION_MS[tone])
      timers.current.add(timer)
    },
    [dismiss],
  )

  return (
    <ToastContext value={notify}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className="rise pointer-events-auto flex max-w-md items-center gap-3 rounded-lg bg-ink py-2 pr-2 pl-3 text-sm text-paper shadow-lg"
          >
            <span className={cx('size-1.5 shrink-0 rounded-full', toast.tone === 'error' ? 'bg-danger' : 'bg-ok')} />
            <span className="min-w-0 flex-1">{toast.message}</span>
            <button type="button" onClick={() => dismiss(toast.id)} className="rounded p-1 text-paper/60 hover:text-paper" aria-label="Dismiss">
              <Icon name="x" className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  )
}
