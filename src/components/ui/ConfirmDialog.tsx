import { useEffect, useCallback } from 'react'
import { Icons } from './Icons'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'error' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'error',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    },
    [onCancel]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const variantClasses = {
    error: 'btn-error',
    warning: 'btn-warning',
    info: 'btn-info',
  }

  const iconColors = {
    error: 'text-error',
    warning: 'text-warning',
    info: 'text-info',
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Icons.Warning className={`w-6 h-6 ${iconColors[variant]}`} />
          {title}
        </h3>
        <p className="py-4 text-base-content/80">{message}</p>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`btn ${variantClasses[variant]}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-base-content/20" onClick={onCancel} />
    </div>
  )
}
