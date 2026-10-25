import { useLiveQuery } from 'dexie-react-hooks'
import {
  db,
  type BudgetItemRecord,
  type DebtRecord,
  type EnvelopeRecord,
  type TermRecord,
  type WeekLogRecord,
} from './db'
import { readPrefs, type Prefs } from './prefs'
import { alive } from './records'

export interface RunwayData {
  terms: TermRecord[]
  budgetItems: BudgetItemRecord[]
  weekLogs: WeekLogRecord[]
  debts: DebtRecord[]
  envelopes: EnvelopeRecord[]
  prefs: Prefs
}

const byCreated = (a: { createdAt: string }, b: { createdAt: string }) =>
  a.createdAt.localeCompare(b.createdAt)

/** The whole plan, kept live: any change to the database re-renders whatever reads it. */
export function useRunwayData(): RunwayData | undefined {
  return useLiveQuery(async () => {
    const [terms, budgetItems, weekLogs, debts, envelopes, prefRows] = await Promise.all([
      db.terms.toArray(),
      db.budgetItems.toArray(),
      db.weekLogs.toArray(),
      db.debts.toArray(),
      db.envelopes.toArray(),
      db.prefs.toArray(),
    ])
    return {
      terms: alive(terms).sort((a, b) => a.start.localeCompare(b.start)),
      budgetItems: alive(budgetItems).sort(byCreated),
      weekLogs: alive(weekLogs),
      debts: alive(debts).sort(byCreated),
      envelopes: alive(envelopes).sort(byCreated),
      prefs: readPrefs(prefRows),
    }
  })
}
