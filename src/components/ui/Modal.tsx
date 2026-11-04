import { useLayoutEffect, useId, useRef, type ReactNode } from 'react'
import Icon from './Icon'
import '../../styles/modal.css'

export default function Modal({ title, subtitle, children, onClose, wide = false, className = '', backLabel }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean; className?: string; backLabel?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useLayoutEffect(() => {
    const dialog = ref.current!
    const previous = document.activeElement as HTMLElement | null
    const root = document.documentElement
    const oldRootOverflow = root.style.overflow
    const oldBodyOverflow = document.body.style.overflow
    const scrollPosition = { left: window.scrollX, top: window.scrollY, behavior: 'instant' as const }
    root.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    // Native dialog focus must not move the page behind the backdrop.
    if (window.scrollX !== scrollPosition.left || window.scrollY !== scrollPosition.top) window.scrollTo(scrollPosition)
    return () => {
      dialog.close()
      root.style.overflow = oldRootOverflow
      document.body.style.overflow = oldBodyOverflow
      if (previous?.isConnected) previous.focus({ preventScroll: true })
      if (window.scrollX !== scrollPosition.left || window.scrollY !== scrollPosition.top) window.scrollTo(scrollPosition)
    }
  }, [])
  return <dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''} ${className}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose() } }}>
    <header className="modal-header">{backLabel && <button type="button" className="modal-back-button" onClick={onClose}><Icon name="back" size={18} /><span>{backLabel}</span></button>}<div><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{!backLabel && <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button>}</header>
    {children}
  </dialog>
}
