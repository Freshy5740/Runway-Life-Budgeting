import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { getFirstOpened } from '../../db/db'
import { useInstallPrompt } from './useInstallPrompt'
import './preflight.css'

type Status = 'ok' | 'waiting' | 'fail'

const STATUS_LABEL: Record<Status, string> = { ok: 'Ready', waiting: 'Waiting', fail: 'Problem' }

function Row({ label, status, detail }: { label: string; status: Status; detail: string }) {
  return (
    <li className="check">
      <span className={`check-dot ${status}`} aria-hidden="true" />
      <span className="check-text">
        <span className="check-label">{label}</span>
        <span className="check-detail">{detail}</span>
      </span>
      <span className={`check-status ${status}`}>{STATUS_LABEL[status]}</span>
    </li>
  )
}

function useStorageCheck(): { status: Status; detail: string } {
  const [check, setCheck] = useState<{ status: Status; detail: string }>({
    status: 'waiting',
    detail: 'Opening the on-device database…',
  })

  useEffect(() => {
    let cancelled = false
    getFirstOpened()
      .then((firstOpened) => {
        if (cancelled) return
        const since = new Date(firstOpened).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
        setCheck({ status: 'ok', detail: `Database ready on this device since ${since}.` })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const reason = error instanceof Error ? error.message : 'Storage is blocked.'
        setCheck({ status: 'fail', detail: `This browser won't let Runway save: ${reason}` })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return check
}

function useOfflineCheck(): { status: Status; detail: string } {
  const {
    offlineReady: [offlineReady],
  } = useRegisterSW()

  if (!('serviceWorker' in navigator)) {
    return { status: 'fail', detail: "This browser can't run Runway offline." }
  }
  if (offlineReady || navigator.serviceWorker.controller) {
    return { status: 'ok', detail: 'Opens and works without an internet connection.' }
  }
  if (import.meta.env.DEV) {
    return { status: 'waiting', detail: 'Switches on in the published version.' }
  }
  return { status: 'waiting', detail: 'Saving a copy for offline use…' }
}

export function PreflightCheck() {
  const storage = useStorageCheck()
  const offline = useOfflineCheck()
  const { installed, install } = useInstallPrompt()

  const installRow = installed
    ? { status: 'ok' as const, detail: 'Running as an installed app.' }
    : install
      ? { status: 'waiting' as const, detail: 'Your browser can install Runway as an app.' }
      : {
          status: 'waiting' as const,
          detail: 'Use your browser’s “Install” or “Add to Home Screen” option.',
        }

  return (
    <section className="card" aria-labelledby="preflight-title">
      <h2 id="preflight-title">Pre-flight check</h2>
      <ul className="checks">
        <Row label="App loaded" status="ok" detail="Runway is running in this browser." />
        <Row label="Saves on this device" {...storage} />
        <Row label="Works offline" {...offline} />
        <Row label="Installable" {...installRow} />
      </ul>
      {install && !installed && (
        <button type="button" className="btn primary install" onClick={install}>
          Install Runway
        </button>
      )}
    </section>
  )
}
