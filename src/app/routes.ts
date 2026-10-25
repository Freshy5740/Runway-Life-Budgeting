import { useSyncExternalStore } from 'react'

// Screens live in the URL hash (#/plan) so reloading keeps your place and the back button works.

export type Route = 'tarmac' | 'plan' | 'baggage' | 'miles' | 'privacy'

export const TABS = [
  { route: 'tarmac', label: 'Tarmac' },
  { route: 'plan', label: 'Flight Plan' },
  { route: 'baggage', label: 'Baggage Claim' },
  { route: 'miles', label: 'Sky Miles' },
] as const satisfies readonly { route: Route; label: string }[]

const ROUTES: readonly string[] = ['tarmac', 'plan', 'baggage', 'miles', 'privacy']

function readRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return ROUTES.includes(hash) ? (hash as Route) : 'tarmac'
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export const useRoute = () => useSyncExternalStore(subscribe, readRoute)

export const hrefFor = (route: Route) => `#/${route}`
