import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useToast } from '../components/toast'

/** Says when Runway can work offline, and offers a reload when a new version has downloaded. */
export function UpdatePrompt() {
  const toast = useToast()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!offlineReady) return
    toast('Runway now works offline.')
    setOfflineReady(false)
  }, [offlineReady, setOfflineReady, toast])

  if (!needRefresh) return null
  return (
    <div className="update-banner" role="status">
      <span>A new version of Runway is ready.</span>
      <button
        type="button"
        className="btn primary sm"
        onClick={() => void updateServiceWorker(true)}
      >
        Reload
      </button>
      <button type="button" className="btn ghost sm" onClick={() => setNeedRefresh(false)}>
        Later
      </button>
    </div>
  )
}
