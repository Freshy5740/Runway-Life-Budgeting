/** Money is stored as integer cents so totals never pick up floating-point drift. */
export type Cents = number

/** Converts a dollar amount (e.g. from a form field) to whole cents, rounding half away from zero. */
export function toCents(dollars: number): Cents {
  const sign = dollars < 0 ? -1 : 1
  return sign * Math.round((Math.abs(dollars) + Number.EPSILON) * 100)
}

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
