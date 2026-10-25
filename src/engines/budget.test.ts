import { describe, expect, it } from 'vitest'
import {
  budgetStatus,
  buildWeeks,
  currentWeekStart,
  groupWeeks,
  perWeek,
  safeToSpendPerWeek,
  summarizeTerm,
} from './budget'
import { weeklyAutoSave } from './savings'
import { envelopes, items, spentByWeek, terms } from './__fixtures__/samplePlan'

// Expected values come from scripts/prototype-oracle.mjs (dollars × 100).

const weeklySavings = weeklyAutoSave(envelopes)

describe('summarizeTerm', () => {
  it('matches the prototype for a term with every kind of arrival and departure', () => {
    const fall = summarizeTerm(terms[0], items, weeklySavings)
    expect(fall.weeks).toBe(16)
    expect(fall.lumpTotal).toBe(750000) // the refund dated after the term ends is left out
    expect(fall.arrivals).toBeCloseTo(981384.6153846154, 2)
    expect(fall.bigTotal).toBe(465000)
    expect(fall.recurWeekly).toBeCloseTo(7038.461538461539, 2)
    expect(fall.recurTotal).toBeCloseTo(112615.38461538462, 2)
    expect(fall.saveTotal).toBe(40000)
    expect(fall.pool).toBeCloseTo(343769.2307692308, 2)
    expect(fall.baseWeekly).toBeCloseTo(21485.576923, 2)
  })

  it('matches the prototype for a simpler term', () => {
    const spring = summarizeTerm(terms[1], items, weeklySavings)
    expect(spring).toMatchObject({ weeks: 16, lumpTotal: 500000, bigTotal: 420000 })
    expect(spring.arrivals).toBeCloseTo(676000, 2)
    expect(spring.recurTotal).toBeCloseTo(104000, 2)
    expect(spring.pool).toBeCloseTo(112000, 2)
    expect(spring.baseWeekly).toBeCloseTo(7000, 2)
  })

  it('spreads monthly amounts over 52 weeks', () => {
    expect(perWeek('monthly')).toBeCloseTo(12 / 52, 12)
  })
})

describe('buildWeeks', () => {
  const weeks = buildWeeks(terms, items, spentByWeek, weeklySavings)

  it('lists every week of every term in order, like the prototype', () => {
    expect(weeks).toHaveLength(32)
    expect(weeks.map((w) => w.start)).toEqual([
      '2026-08-24',
      '2026-08-31',
      '2026-09-07',
      '2026-09-14',
      '2026-09-21',
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
      '2026-11-02',
      '2026-11-09',
      '2026-11-16',
      '2026-11-23',
      '2026-11-30',
      '2026-12-07',
      '2027-01-11',
      '2027-01-18',
      '2027-01-25',
      '2027-02-01',
      '2027-02-08',
      '2027-02-15',
      '2027-02-22',
      '2027-03-01',
      '2027-03-08',
      '2027-03-15',
      '2027-03-22',
      '2027-03-29',
      '2027-04-05',
      '2027-04-12',
      '2027-04-19',
      '2027-04-26',
    ])
    expect(weeks[0]).toMatchObject({ termId: 't1', spent: 12000 })
    expect(weeks[0].budget).toBeCloseTo(21485.576923, 2)
    expect(weeks[31]).toMatchObject({ termId: 't2', spent: null, budget: 7000 })
  })

  it('groups weeks by month the way the prototype did', () => {
    const months = groupWeeks(weeks, 'month')
    expect(months.map((g) => [g.key, g.label, g.spent, g.logged])).toEqual([
      ['2026-08', 'Aug 26', 21550, true],
      ['2026-09', 'Sep 26', 14000, true],
      ['2026-10', 'Oct 26', 0, false],
      ['2026-11', 'Nov 26', 0, false],
      ['2026-12', 'Dec 26', 0, false],
      ['2027-01', 'Jan 27', 8000, true],
      ['2027-02', 'Feb 27', 0, false],
      ['2027-03', 'Mar 27', 0, false],
      ['2027-04', 'Apr 27', 0, false],
    ])
    const expectedBudgets = [
      42971.15384615385, 85942.3076923077, 85942.3076923077, 107427.884615, 21485.576923, 21000,
      28000, 35000, 28000,
    ]
    months.forEach((g, i) => expect(g.budget).toBeCloseTo(expectedBudgets[i], 2))
  })

  it('groups weeks by term and by year', () => {
    const byTerm = groupWeeks(weeks, 'term')
    expect(byTerm.map((g) => [g.key, g.label, g.spent])).toEqual([
      ['t1', 'Fall 2026', 35550],
      ['t2', 'Spring 2027', 8000],
    ])
    expect(byTerm[0].budget).toBeCloseTo(343769.230769, 2)
    const byYear = groupWeeks(weeks, 'year')
    expect(byYear.map((g) => [g.key, g.spent])).toEqual([
      ['2026', 35550],
      ['2027', 8000],
    ])
    expect(byYear[1].budget).toBeCloseTo(112000, 2)
  })

  it('finds the current week', () => {
    expect(currentWeekStart(weeks, '2026-09-10')).toBe('2026-09-07')
    expect(currentWeekStart(weeks, '2026-07-01')).toBe('2026-08-24')
    expect(currentWeekStart([], '2026-07-01')).toBeNull()
  })

  it('re-spreads what is left of the pool over the weeks still to come', () => {
    const fall = summarizeTerm(terms[0], items, weeklySavings)
    const fallWeeks = weeks.filter((w) => w.termId === 't1')
    // 3 weeks started, $355.50 spent: ($3,437.69 − $355.50) over 13 weeks.
    expect(safeToSpendPerWeek(fall, fallWeeks, '2026-09-10')).toBeCloseTo(23709.17159763314, 2)
  })
})

describe('budgetStatus', () => {
  it('is under up to 90%, close up to 100%, over beyond it', () => {
    expect(budgetStatus(10000, 9000)).toBe('under')
    expect(budgetStatus(10000, 9500)).toBe('close')
    expect(budgetStatus(10000, 10001)).toBe('over')
    expect(budgetStatus(0, 100)).toBe('over')
    expect(budgetStatus(0, 0)).toBe('under')
  })
})
