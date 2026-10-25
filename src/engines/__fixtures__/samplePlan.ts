import type { BudgetItemInput, TermInput } from '../budget'
import type { DebtInput } from '../loans'
import type { EnvelopeInput } from '../savings'

// The same sample plan as scripts/prototype-oracle.mjs, converted to cents. Engine tests compare
// against the oracle's output (in dollars, so multiplied by 100 here).

export const terms: TermInput[] = [
  { id: 't1', name: 'Fall 2026', start: '2026-08-24', end: '2026-12-14', cushionCents: 20000 },
  { id: 't2', name: 'Spring 2027', start: '2027-01-11', end: '2027-05-03', cushionCents: 0 },
]

const item = (
  termId: string,
  kind: BudgetItemInput['kind'],
  amountCents: number,
  extra: Partial<Pick<BudgetItemInput, 'date' | 'frequency'>> = {},
): BudgetItemInput => ({ termId, kind, amountCents, date: null, frequency: null, ...extra })

export const items: BudgetItemInput[] = [
  item('t1', 'lump', 600000, { date: '2026-08-20' }),
  item('t1', 'lump', 150000, { date: '2026-09-15' }),
  item('t1', 'lump', 30000, { date: '2027-01-10' }),
  item('t1', 'income', 22000, { frequency: 'biweekly' }),
  item('t1', 'income', 15000, { frequency: 'monthly' }),
  item('t1', 'bigCost', 420000),
  item('t1', 'bigCost', 45000),
  item('t1', 'recurCost', 6000, { frequency: 'weekly' }),
  item('t1', 'recurCost', 4500, { frequency: 'monthly' }),
  item('t2', 'lump', 500000, { date: '2027-01-05' }),
  item('t2', 'income', 22000, { frequency: 'biweekly' }),
  item('t2', 'bigCost', 420000),
  item('t2', 'recurCost', 6500, { frequency: 'weekly' }),
]

export const spentByWeek = new Map([
  ['2026-08-24', 12000],
  ['2026-08-31', 9550],
  ['2026-09-07', 14000],
  ['2027-01-11', 8000],
])

export const envelopes: EnvelopeInput[] = [
  { targetCents: 100000, balanceCents: 25000, autoSaveWeeklyCents: 1000 },
  { targetCents: 300000, balanceCents: 40000, autoSaveWeeklyCents: 1500 },
  { targetCents: 20000, balanceCents: 5000, autoSaveWeeklyCents: 0 },
]

export const debts: DebtInput[] = [
  {
    type: 'fed-sub',
    balanceCents: 350000,
    aprPercent: 6.39,
    compounding: 'daily',
    minPaymentCents: 4000,
  },
  {
    type: 'fed-unsub',
    balanceCents: 550000,
    aprPercent: 6.39,
    compounding: 'daily',
    minPaymentCents: 6000,
  },
  {
    type: 'private',
    balanceCents: 800000,
    aprPercent: 9.5,
    compounding: 'monthly',
    minPaymentCents: 9500,
  },
  {
    type: 'card',
    balanceCents: 90000,
    aprPercent: 24.99,
    compounding: 'daily',
    minPaymentCents: 3500,
  },
]

export const inSchool = { weeks: 80, weeklyContributionCents: 2500 }
export const repayExtraMonthlyCents = 10000
