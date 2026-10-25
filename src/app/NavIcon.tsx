import type { Route } from './routes'

const PATHS: Record<Exclude<Route, 'privacy'>, string> = {
  // A gauge.
  tarmac: 'M4 15a8 8 0 1 1 16 0M12 15l3.5-4.5M3 19h18',
  // A calendar.
  plan: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM4 10h16M8 3v4M16 3v4',
  // A suitcase.
  baggage:
    'M4 8h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1ZM9 8V5h6v3M8 8v11M16 8v11',
  // A jar with a coin slot.
  miles:
    'M8 3h8M7 6h10M7 6c-1.5 1.5-2 3-2 5v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8c0-2-.5-3.5-2-5M10 12h4',
}

export function NavIcon({ route }: { route: Exclude<Route, 'privacy'> }) {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[route]} />
    </svg>
  )
}
