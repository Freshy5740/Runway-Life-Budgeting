import { formatDuration } from '../../lib/dates'

/** Round axis ticks from 0 up past `max`, about `count` steps (steps of 1, 2, 2.5 or 5 × 10ⁿ). */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0, 1]
  const raw = max / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw
  const ticks: number[] = []
  for (let i = 0; i * step < max + step * 1e-9; i++) ticks.push(i * step)
  if (ticks[ticks.length - 1] < max) ticks.push(ticks.length * step)
  return ticks
}

/** Which months to label on a timeline of `maxMonth` months, given the room available. */
export function monthTicks(maxMonth: number, plotWidth: number): number[] {
  const most = Math.max(2, Math.min(7, Math.floor(plotWidth / 64)))
  const step = [1, 3, 6, 12, 24, 36, 60, 120, 240].find((s) => maxMonth / s <= most - 1) ?? 240
  const ticks: number[] = []
  for (let m = 0; m <= maxMonth; m += step) ticks.push(m)
  return ticks
}

/** Axis label for a month offset: "Now", "6 mo", "2 yr". */
export const monthTickLabel = (month: number) =>
  month === 0 ? 'Now' : month % 12 === 0 ? `${month / 12} yr` : `${month} mo`

/** Tooltip heading for a month offset: "Now", "In 1 yr 2 mo". */
export const monthLabel = (month: number) => (month === 0 ? 'Now' : `In ${formatDuration(month)}`)
