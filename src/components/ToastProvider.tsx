import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ToastContext, type ToastOptions } from './toast'

interface Toast extends ToastOptions {
  id: number
  message: string
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    setToast({ id: nextId++, message, ...options })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), toast.onAction ? 6000 : 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className={`toast ${toast.tone ?? 'info'}`}>
            <span>{toast.message}</span>
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  toast.onAction?.()
                  setToast(null)
                }}
              >
                {toast.actionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
