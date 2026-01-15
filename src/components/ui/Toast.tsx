import { useToastStore } from '@/store/toastStore'
import { Icons } from './Icons'

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  if (toasts.length === 0) return null

  const alertClasses = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info',
  }

  const iconMap = {
    success: <Icons.Check className="w-5 h-5" />,
    error: <Icons.X className="w-5 h-5" />,
    warning: <Icons.Warning className="w-5 h-5" />,
    info: <Icons.Warning className="w-5 h-5" />,
  }

  return (
    <div className="toast toast-end toast-bottom z-50" role="region" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`alert ${alertClasses[toast.type]} shadow-lg animate-in`}
        >
          {iconMap[toast.type]}
          <span>{toast.message}</span>
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => removeToast(toast.id)}
            aria-label="Fermer la notification"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
