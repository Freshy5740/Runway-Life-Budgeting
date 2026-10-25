/** Money is stored as integer cents so totals never pick up floating-point drift. */
export type Cents = number

/** Converts a dollar amount (e.g. from a form field) to whole cents, rounding half away from zero. */
export function toCents(dollars: number): Cents {
  const sign = dollars < 0 ? -1 : 1
  return sign * Math.round((Math.abs(dollars) + Number.EPSILON) * 100)
}

/** Reads what someone typed ("1,250.50", "$40") as cents; blank or unreadable → null. Never negative. */
export function parseMoney(text: string): Cents | null {
  const cleaned = text.replace(/[$,\s]/g, '')
  if (cleaned === '') return null
  const dollars = Number(cleaned)
  return Number.isFinite(dollars) ? toCents(Math.max(0, dollars)) : null
}

/** Cents as plain text for an input box: 2500 → "25", 2550 → "25.50". */
export function centsToInput(cents: Cents | null): string {
  if (cents === null) return ''
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}

/** Compact axis labels: $0, $950, $5K, $12.5K, $1.2M. */
export function formatMoneyCompact(cents: Cents): string {
  const dollars = Math.round(cents / 100)
  const abs = Math.abs(dollars)
  const sign = dollars < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${trim(abs / 1_000_000)}M`
  if (abs >= 1_000) return `${sign}$${trim(abs / 1_000)}K`
  return `${sign}$${abs}`
}

const trim = (n: number) => String(Math.round(n * 10) / 10)

const wholeDollars = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const withCents = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formats cents for display: "$1,235", or "$1,234.56" with showCents. Negatives read "-$1,235". */
export function formatMoney(cents: Cents, { showCents = false } = {}): string {
  const abs = Math.abs(cents)
  const value = showCents ? Math.round(abs) / 100 : Math.round(abs / 100)
  const sign = cents < 0 && value > 0 ? '-' : ''
  return `${sign}$${(showCents ? withCents : wholeDollars).format(value)}`
}
