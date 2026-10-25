import {
  addDays,
  daysBetween,
  formatMonthYearShort,
  formatShortDate,
  type IsoDate,
} from '../lib/dates'
import type { Cents } from '../lib/money'

// Term budgeting: what comes in and goes out over a term, and how much is safe to spend each week.
// Ported from the prototype's termCompute / buildWeeks / groupWeeks. Amounts are cents; results
// can carry fractions of a cent and are rounded only for display.

export type Frequency = 'weekly' | 'biweekly' | 'monthly'

/** How many times per week something happens. Monthly spreads 12 payments over 52 weeks. */
export function perWeek(frequency: Frequency): number {
  switch (frequency) {
    case 'weekly':
      return 1
    case 'biweekly':
      return 0.5
    case 'monthly':
      return 12 / 52
  }
}

export interface TermInput {
  id: string
  name: string
  start: IsoDate
  end: IsoDate
  cushionCents: Cents
}

/** lump = one-time arrival, income = recurring arrival, bigCost = one-time departure, recurCost = ongoing departure */
export type BudgetItemKind = 'lump' | 'income' | 'bigCost' | 'recurCost'

export interface BudgetItemInput {
  termId: string
  kind: BudgetItemKind
  amountCents: Cents
  date: IsoDate | null
  frequency: Frequency | null
}

export interface TermSummary {
  weeks: number
  lumpTotal: number
  arrivals: number
  bigTotal: number
  recurWeekly: number
  recurTotal: number
  saveTotal: number
  /** Money left for everyday spending after costs, auto-savings and the cushion. */
  pool: number
  baseWeekly: number
}

export function termWeekCount(term: Pick<TermInput, 'start' | 'end'>): number {
  return Math.max(1, Math.ceil(daysBetween(term.start, term.end) / 7))
}

export function summarizeTerm(
  term: TermInput,
  items: readonly BudgetItemInput[],
  weeklySavingsCents: Cents,
): TermSummary {
  const weeks = termWeekCount(term)
  const mine = items.filter((item) => item.termId === term.id)
  const total = (kind: BudgetItemKind, value: (item: BudgetItemInput) => number) =>
    mine.filter((item) => item.kind === kind).reduce((sum, item) => sum + value(item), 0)
  const weekly = (item: BudgetItemInput) => item.amountCents * perWeek(item.frequency ?? 'weekly')

  // A one-time arrival only counts if it lands before the term ends.
  const lumpTotal = total('lump', (item) =>
    (item.date ?? term.start) <= term.end ? item.amountCents : 0,
  )
  const arrivals = lumpTotal + total('income', weekly) * weeks
  const bigTotal = total('bigCost', (item) => item.amountCents)
  const recurWeekly = total('recurCost', weekly)
  const recurTotal = recurWeekly * weeks
  const saveTotal = weeklySavingsCents * weeks
  const pool = arrivals - bigTotal - recurTotal - saveTotal - term.cushionCents
  return {
    weeks,
    lumpTotal,
    arrivals,
    bigTotal,
    recurWeekly,
    recurTotal,
    saveTotal,
    pool,
    baseWeekly: pool / weeks,
  }
}

export interface PlanWeek {
  start: IsoDate
  termId: string
  termName: string
  budget: number
  /** What was logged as spent that week, or null if nothing was logged. */
  spent: Cents | null
}

/** Every week of every term, in date order, with its budget and any logged spending. */
export function buildWeeks(
  terms: readonly TermInput[],
  items: readonly BudgetItemInput[],
  spentByWeek: ReadonlyMap<IsoDate, Cents>,
  weeklySavingsCents: Cents,
): PlanWeek[] {
  const weeks: PlanWeek[] = []
  for (const term of [...terms].sort((a, b) => a.start.localeCompare(b.start))) {
    const summary = summarizeTerm(term, items, weeklySavingsCents)
    for (let i = 0; i < summary.weeks; i++) {
      const start = addDays(term.start, i * 7)
      weeks.push({
        start,
        termId: term.id,
        termName: term.name,
        budget: summary.baseWeekly,
        spent: spentByWeek.get(start) ?? null,
      })
    }
  }
  return weeks
}

export type RunwayLevel = 'week' | 'month' | 'term' | 'year'

export interface WeekGroup {
  key: string
  label: string
  start: IsoDate
  budget: number
  spent: Cents
  logged: boolean
}

/** Rolls weeks up into months, terms or calendar years (a week belongs to where it starts). */
export function groupWeeks(weeks: readonly PlanWeek[], level: RunwayLevel): WeekGroup[] {
  if (level === 'week') {
    return weeks.map((week) => ({
      key: week.start,
      label: formatShortDate(week.start),
      start: week.start,
      budget: week.budget,
      spent: week.spent ?? 0,
      logged: week.spent !== null,
    }))
  }
  const groups = new Map<string, WeekGroup>()
  for (const week of weeks) {
    const key =
      level === 'month'
        ? week.start.slice(0, 7)
        : level === 'term'
          ? week.termId
          : week.start.slice(0, 4)
    let group = groups.get(key)
    if (!group) {
      const label =
        level === 'month'
          ? formatMonthYearShort(week.start)
          : level === 'term'
            ? week.termName
            : key
      group = { key, label, start: week.start, budget: 0, spent: 0, logged: false }
      groups.set(key, group)
    }
    group.budget += week.budget
    if (week.spent !== null) {
      group.spent += week.spent
      group.logged = true
    }
  }
  return [...groups.values()]
}

/** The start of the week that contains today (the last week that has started), if any. */
export function currentWeekStart(weeks: readonly PlanWeek[], today: IsoDate): IsoDate | null {
  let current = weeks[0]?.start ?? null
  for (const week of weeks) {
    if (week.start <= today) current = week.start
    else break
  }
  return current
}

/** What's left of a term's pool, spread over the weeks that haven't started yet. */
export function safeToSpendPerWeek(
  summary: Pick<TermSummary, 'pool' | 'weeks'>,
  termWeeks: readonly PlanWeek[],
  today: IsoDate,
): number {
  const spent = termWeeks.reduce((sum, week) => sum + (week.spent ?? 0), 0)
  const started = termWeeks.filter((week) => week.start <= today).length
  return (summary.pool - spent) / Math.max(1, summary.weeks - started)
}

export type BudgetStatus = 'under' | 'close' | 'over'

/** Under budget, within 10% of it, or over it. */
export function budgetStatus(budget: number, spent: number): BudgetStatus {
  const ratio = budget > 0 ? spent / budget : spent > 0 ? 2 : 0
  return ratio > 1 ? 'over' : ratio > 0.9 ? 'close' : 'under'
}
