import { createContext, useContext, useMemo } from 'react'
import {
  buildWeeks,
  currentWeekStart,
  safeToSpendPerWeek,
  summarizeTerm,
  type PlanWeek,
  type TermSummary,
} from '../engines/budget'
import { weeklyAutoSave } from '../engines/savings'
import type { TermRecord } from '../db/db'
import type { RunwayData } from '../db/useRunwayData'
import { todayIso, type IsoDate } from '../lib/dates'
import type { Cents } from '../lib/money'

/** Numbers several screens share, worked out once from the stored plan. */
export interface PlanView {
  today: IsoDate
  weeklySavings: Cents
  weeks: PlanWeek[]
  currentWeek: IsoDate | null
  weeksLeft: number
  activeTerm: TermRecord | null
  activeSummary: TermSummary | null
  activeWeeks: PlanWeek[]
  safePerWeek: number
}

export function derivePlan(data: RunwayData, today: IsoDate): PlanView {
  const weeklySavings = weeklyAutoSave(data.envelopes)
  const spentByWeek = new Map(data.weekLogs.map((log) => [log.weekStart, log.spentCents]))
  const weeks = buildWeeks(data.terms, data.budgetItems, spentByWeek, weeklySavings)
  const activeTerm =
    data.terms.find((term) => term.id === data.prefs.activeTermId) ?? data.terms[0] ?? null
  const activeSummary = activeTerm
    ? summarizeTerm(activeTerm, data.budgetItems, weeklySavings)
    : null
  const activeWeeks = activeTerm ? weeks.filter((week) => week.termId === activeTerm.id) : []
  const started = weeks.filter((week) => week.start <= today).length
  return {
    today,
    weeklySavings,
    weeks,
    currentWeek: currentWeekStart(weeks, today),
    weeksLeft: Math.max(0, weeks.length - started),
    activeTerm,
    activeSummary,
    activeWeeks,
    safePerWeek: activeSummary ? safeToSpendPerWeek(activeSummary, activeWeeks, today) : 0,
  }
}

export const DataContext = createContext<RunwayData | null>(null)

export function useData(): RunwayData {
  const data = useContext(DataContext)
  if (!data) throw new Error('useData must be used inside DataContext')
  return data
}

export function usePlan(): PlanView {
  const data = useData()
  const today = todayIso()
  return useMemo(() => derivePlan(data, today), [data, today])
}
