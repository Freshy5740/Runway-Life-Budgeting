import { useEffect, useState } from 'react'
import { ToastProvider } from '../components/ToastProvider'
import { ensureSeeded } from '../db/seed'
import { useRunwayData } from '../db/useRunwayData'
import { BaggageClaim } from '../features/baggage-claim/BaggageClaim'
import { FlightPlan } from '../features/flight-plan/FlightPlan'
import { PrivacyPage } from '../features/privacy/PrivacyPage'
import { SkyMiles } from '../features/sky-miles/SkyMiles'
import { Tarmac } from '../features/tarmac/Tarmac'
import { DataMenu } from './DataMenu'
import { NavIcon } from './NavIcon'
import { DataContext } from './plan'
import { hrefFor, TABS, useRoute, type Route } from './routes'
import { ScreenErrorBoundary } from './ScreenErrorBoundary'
import { UpdatePrompt } from './UpdatePrompt'
import './app.css'

function Screen({ route }: { route: Route }) {
  switch (route) {
    case 'tarmac':
      return <Tarmac />
    case 'plan':
      return <FlightPlan />
    case 'baggage':
      return <BaggageClaim />
    case 'miles':
      return <SkyMiles />
    case 'privacy':
      return <PrivacyPage />
  }
}

function Tabs({ route, className }: { route: Route; className: string }) {
  return (
    <nav className={className} aria-label="Sections">
      {TABS.map((tab) => (
        <a
          key={tab.route}
          href={hrefFor(tab.route)}
          aria-current={tab.route === route ? 'page' : undefined}
        >
          <NavIcon route={tab.route} />
          <span>{tab.label}</span>
        </a>
      ))}
    </nav>
  )
}

export default function App() {
  const [seeded, setSeeded] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const data = useRunwayData()
  const route = useRoute()

  useEffect(() => {
    ensureSeeded().then(
      () => setSeeded(true),
      () => setStorageError(true),
    )
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  return (
    <ToastProvider>
      <header className="bar">
        <a className="brand" href={hrefFor('tarmac')}>
          <span className="brand-logo">
            Run<b>way</b>
          </span>
          <span className="brand-tag">student money, cleared for takeoff</span>
        </a>
        <Tabs route={route} className="tabs-top" />
        <span className="bar-spacer" />
        <DataMenu />
      </header>
      <main>
        {storageError ? (
          <div className="card">
            <h1>Runway can't save in this browser</h1>
            <p>
              Storage is blocked here, often by private browsing. Open Runway in a regular window to
              use it.
            </p>
          </div>
        ) : seeded && data ? (
          <DataContext.Provider value={data}>
            <ScreenErrorBoundary key={route}>
              <Screen route={route} />
            </ScreenErrorBoundary>
          </DataContext.Provider>
        ) : null}
      </main>
      <footer className="site-footer">
        Runway keeps your data on this device; nothing is uploaded. Use Backup → Export to keep a
        copy. Numbers are planning estimates, not financial advice.{' '}
        <a href={hrefFor('privacy')}>Privacy</a>
      </footer>
      <Tabs route={route} className="tabs-bottom" />
      <UpdatePrompt />
    </ToastProvider>
  )
}
