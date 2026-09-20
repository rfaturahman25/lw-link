import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

type Size = 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<Size, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
}

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: Size
  /** When true, Escape/backdrop/close are disabled so an in-flight save can't be lost. */
  busy?: boolean
}

// Accessible dialog: Escape + backdrop close, focus trap, focus restore, scroll
// lock. Desktop is a centered card; mobile is a bottom sheet. No new dependency.
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  busy = false,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Scroll lock + Escape. Escape is bound on the document so it also works when
  // focus is not inside the panel.
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, busy, onClose])

  // Focus management: move focus in on open, restore it on close.
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    if (panel && !panel.contains(document.activeElement)) {
      const target =
        panel.querySelector<HTMLElement>('[data-autofocus]') ??
        panel.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, select') ??
        panel.querySelector<HTMLElement>('button:not([disabled]), a[href]') ??
        panel
      target.focus()
    }
    return () => {
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const panel = panelRef.current
    if (!panel) return
    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    )
    if (items.length === 0) {
      e.preventDefault()
      panel.focus()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={() => {
          if (!busy) onClose()
        }}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onPanelKeyDown}
        className={`sheet-in relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border bg-card text-card-foreground shadow-2xl outline-none sm:max-h-[88dvh] sm:w-full sm:rounded-2xl ${SIZE_CLASS[size]}`}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close dialog"
            className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div
            className="flex flex-wrap items-center justify-end gap-2 border-t bg-card px-5 py-3"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
