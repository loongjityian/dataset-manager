import { useEffect, useRef, type ReactNode } from 'react'

type Props = { title: string; onClose: () => void; children: ReactNode }

/**
 * A native modal `<dialog>`: the browser keeps focus inside it, makes the page behind it inert,
 * closes it on Escape and returns focus to where it was. Clicking the backdrop also closes it.
 */
export function Modal({ title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      // Escape closes the dialog itself; tell the parent. Skip a late event if it has reopened since.
      onClose={() => !ref.current?.open && onClose()}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="rise m-auto mb-4 w-[calc(100%-2rem)] max-w-lg rounded-xl border border-line bg-surface text-ink shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)] backdrop:bg-ink/30 backdrop:backdrop-blur-[2px] sm:mb-auto"
    >
      {/* Fills the dialog, so a click on the dialog element itself can only be on the backdrop. */}
      <div className="flex max-h-[88dvh] flex-col">{children}</div>
    </dialog>
  )
}
