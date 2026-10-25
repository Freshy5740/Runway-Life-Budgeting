import { PreflightCheck } from '../features/preflight/PreflightCheck'

export default function App() {
  return (
    <>
      <header className="bar">
        <div className="brand">
          <span className="brand-logo">
            Run<b>way</b>
          </span>
          <span className="brand-tag">student money, cleared for takeoff</span>
        </div>
      </header>
      <main>
        <section className="hero">
          <h1>Cleared for takeoff soon.</h1>
          <p>
            Runway helps college students budget by term, see what their loans really cost, and save
            for the things they want. It then grows with them into their first job and beyond. It's
            free, and your data stays on your device.
          </p>
        </section>
        <PreflightCheck />
      </main>
      <footer>
        Milestone 0 preview. Numbers in Runway are planning estimates, not financial advice.
      </footer>
    </>
  )
}
