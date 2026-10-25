import { addDays, seasonName, todayIso } from '../lib/dates'
import { db } from './db'
import { newRecord } from './records'

export const DEFAULT_EMERGENCY_FUND = {
  kind: 'emergency' as const,
  name: 'Emergency reserve',
  targetCents: 100000,
  balanceCents: 0,
  autoSaveWeeklyCents: 0,
}

/**
 * First run on a device: one 16-week term starting today and an empty emergency fund with a
 * $1,000 target, as the prototype did. Runs once; deleting things later never re-adds them.
 */
export async function ensureSeeded(): Promise<void> {
  await db.transaction('rw', [db.meta, db.terms, db.envelopes, db.prefs], async () => {
    if (await db.meta.get('seeded')) return
    const start = todayIso()
    const term = newRecord({
      name: seasonName(start),
      start,
      end: addDays(start, 7 * 16),
      cushionCents: 0,
    })
    await db.terms.add(term)
    await db.envelopes.add(newRecord(DEFAULT_EMERGENCY_FUND))
    await db.prefs.put({ ...newRecord({ value: term.id }), id: 'activeTermId' })
    await db.meta.put({ key: 'seeded', value: new Date().toISOString() })
  })
}

/** Dates for a new term: the day after the latest term ends (or today), lasting 16 weeks. */
export function nextTermDates(latestEnd: string | null): { start: string; end: string } {
  const start = latestEnd ? addDays(latestEnd, 1) : todayIso()
  return { start, end: addDays(start, 7 * 16) }
}
