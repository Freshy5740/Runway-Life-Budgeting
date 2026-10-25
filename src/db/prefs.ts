import type { RunwayLevel } from '../engines/budget'
import type { Strategy } from '../engines/loans'
import type { Cents } from '../lib/money'
import { db, type PrefRecord } from './db'

export interface Prefs {
  activeTermId: string | null
  /** Baggage Claim: still in school, or repaying. */
  loanMode: 'school' | 'repay'
  inSchoolWeeks: number
  inSchoolWeeklyCents: Cents
  repayExtraMonthlyCents: Cents
  repayStrategy: Strategy
  runwayLevel: RunwayLevel
}

// The prototype's starting values.
export const DEFAULT_PREFS: Prefs = {
  activeTermId: null,
  loanMode: 'school',
  inSchoolWeeks: 80,
  inSchoolWeeklyCents: 2500,
  repayExtraMonthlyCents: 10000,
  repayStrategy: 'avalanche',
  runwayLevel: 'week',
}

export function readPrefs(rows: PrefRecord[]): Prefs {
  const prefs: Prefs = { ...DEFAULT_PREFS }
  for (const row of rows) {
    if (!row.deletedAt && row.id in prefs)
      (prefs as unknown as Record<string, unknown>)[row.id] = row.value
  }
  return prefs
}

export async function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]): Promise<void> {
  const now = new Date().toISOString()
  const existing = await db.prefs.get(key)
  await db.prefs.put({
    id: key,
    value,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deletedAt: null,
  })
}
