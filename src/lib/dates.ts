/**
 * Calendar dates are 'YYYY-MM-DD' strings. They sort and compare as text, and all date math runs in
 * UTC so daylight-saving changes never shift a day.
 */
export type IsoDate = string

const DAY_MS = 86_400_000

function toUtcMs(date: IsoDate): number {
  const [year, month, day] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

function fromUtcMs(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Today's date on the user's own clock. */
export function todayIso(now = new Date()): IsoDate {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS)
}

/** Adds calendar months; like JavaScript dates, Jan 31 + 1 month rolls into March. */
export function addMonths(date: IsoDate, months: number): IsoDate {
  const [year, month, day] = date.split('-').map(Number)
  return fromUtcMs(Date.UTC(year, month - 1 + months, day))
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS)
}

function format(date: IsoDate, options: Intl.DateTimeFormatOptions): string {
  const ms = toUtcMs(date)
  if (Number.isNaN(ms)) return '—'
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(ms)
}

/** "Oct 24, 2026" */
export const formatDate = (date: IsoDate) =>
  format(date, { month: 'short', day: 'numeric', year: 'numeric' })

/** "Oct 24" */
export const formatShortDate = (date: IsoDate) => format(date, { month: 'short', day: 'numeric' })

/** "Oct 26" (month and two-digit year) */
export const formatMonthYearShort = (date: IsoDate) =>
  format(date, { month: 'short', year: '2-digit' })

/** "October 2026" */
export const formatMonthYear = (date: IsoDate) => format(date, { month: 'long', year: 'numeric' })

/** 27 → "2 yr 3 mo", 12 → "1 yr", 5 → "5 mo". */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12)
  const rest = months % 12
  return `${years ? `${years} yr ` : ''}${rest || !years ? `${rest} mo` : ''}`.trim()
}

/** A default term name for a start date: "Spring 2027", "Summer 2027" or "Fall 2027". */
export function seasonName(date: IsoDate): string {
  const month = Number(date.slice(5, 7))
  const season = month <= 5 ? 'Spring' : month <= 7 ? 'Summer' : 'Fall'
  return `${season} ${date.slice(0, 4)}`
}
