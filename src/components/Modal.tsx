import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface ModalProps {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}

export function Modal({ title, description, children, onClose, wide = false }: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = [
          ...dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ]
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable.at(-1)!
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.setTimeout(() =>
      dialogRef.current?.querySelector<HTMLElement>('button, input, select')?.focus(),
    )
    document.addEventListener('keydown', listener)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', listener)
      document.body.classList.remove('modal-open')
      previousFocus?.focus()
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className={`modal-sheet${wide ? ' modal-sheet--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-handle" aria-hidden="true" />
        <header className="modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Zatvori">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  )
}
