import { createContext, useContext } from 'react'

export interface ToastOptions {
  actionLabel?: string
  onAction?: () => void
  tone?: 'info' | 'error'
}

export type ShowToast = (message: string, options?: ToastOptions) => void

export const ToastContext = createContext<ShowToast>(() => {})

/** Shows a short message at the bottom of the screen, optionally with an action like "Undo". */
export const useToast = () => useContext(ToastContext)
