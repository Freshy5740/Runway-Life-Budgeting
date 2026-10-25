import { Component, type ReactNode } from 'react'

interface State {
  failed: boolean
}

/**
 * If a screen hits a bug, show a way out instead of a blank page. Data is untouched: everything is
 * already saved on the device.
 */
export class ScreenErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Runway screen error:', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <section className="card">
        <h1>Something went wrong on this screen</h1>
        <p>
          Your data is safe on this device. Reload to try again; if it keeps happening, use Backup →
          Export backup so nothing is lost.
        </p>
        <p className="fine-print">
          <button type="button" className="btn primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </p>
      </section>
    )
  }
}
