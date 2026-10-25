import { describe, expect, it } from 'vitest'
import { monthlyRate, simulateInSchool, simulateRepayment, type DebtInput } from './loans'
import { debts, inSchool, repayExtraMonthlyCents } from './__fixtures__/samplePlan'

// Expected values come from scripts/prototype-oracle.mjs (dollars × 100).

describe('monthlyRate', () => {
  it('converts APR to a monthly rate for daily and monthly compounding', () => {
    expect(monthlyRate(debts[0])).toBeCloseTo(0.005338734457879246, 15)
    expect(monthlyRate(debts[2])).toBeCloseTo(0.007916666666666667, 15)
    expect(monthlyRate(debts[3])).toBeCloseTo(0.021036077747109472, 15)
    expect(monthlyRate({ aprPercent: 0, compounding: 'daily' })).toBe(0)
  })
})

describe('simulateRepayment', () => {
  const cases = [
    {
      strategy: 'avalanche',
      months: 67,
      interestPaid: 411930.7733933139,
      totalPaid: 2201930.773393314,
      monthlyBudget: 33000,
      at12: { balance: 1531145.315317, interestPaid: 137145.315317 },
    },
    {
      strategy: 'snowball',
      months: 69,
      interestPaid: 467952.2512972734,
      totalPaid: 2257952.251297,
      monthlyBudget: 33000,
      at12: { balance: 1531461.010141, interestPaid: 137461.010141 },
    },
    {
      strategy: 'minimum',
      months: 140,
      interestPaid: 894766.8909536022,
      totalPaid: 2684766.890953602,
      monthlyBudget: 23000,
      at12: { balance: 1664419.883119, interestPaid: 150419.883119 },
    },
  ] as const

  for (const c of cases) {
    it(`matches the prototype for ${c.strategy}`, () => {
      const result = simulateRepayment(debts, c.strategy, repayExtraMonthlyCents)
      expect(result.months).toBe(c.months)
      expect(result.stuck).toBe(false)
      expect(result.monthlyBudget).toBe(c.monthlyBudget)
      expect(result.interestPaid).toBeCloseTo(c.interestPaid, 2)
      expect(result.totalPaid).toBeCloseTo(c.totalPaid, 2)
      expect(result.series).toHaveLength(c.months + 1)
      expect(result.series[12].balance).toBeCloseTo(c.at12.balance, 2)
      expect(result.series[12].interestPaid).toBeCloseTo(c.at12.interestPaid, 2)
      expect(result.series[c.months].balance).toBe(0)
    })
  }

  it('flags a plan whose payment never outpaces interest', () => {
    const tooBig: DebtInput[] = [
      {
        type: 'private',
        balanceCents: 1000000,
        aprPercent: 12,
        compounding: 'monthly',
        minPaymentCents: 5000,
      },
    ]
    const result = simulateRepayment(tooBig, 'avalanche', 0)
    expect(result.stuck).toBe(true)
    expect(result.months).toBe(3)
    expect(result.interestPaid).toBeCloseTo(30150.5, 2)
    expect(result.totalPaid).toBeCloseTo(1030150.5, 2)
    expect(result.series[3].balance).toBeCloseTo(1015150.5, 2)
  })
})

describe('simulateInSchool', () => {
  it('matches the prototype when paying weekly toward in-school interest', () => {
    const result = simulateInSchool(
      debts,
      inSchool.weeks,
      inSchool.weeklyContributionCents,
      repayExtraMonthlyCents,
    )
    expect(result.months).toBe(18)
    expect(result.totalAccrued).toBeCloseTo(200931.91708332195, 2)
    expect(result.covered).toBeCloseTo(195000, 2)
    expect(result.capitalizationAvoided).toBeCloseTo(195000, 2)
    expect(result.lifetimeSavings).toBeCloseTo(325109.8349532913, 2)
    expect(result.monthsToFreeBaseline).toBe(77)
    expect(result.monthsToFreeWithPlan).toBe(67)
    expect(result.baseline[18].balance).toBeCloseTo(1990931.917083322, 2)
    expect(result.withPlan[18].balance).toBeCloseTo(1795931.917083322, 2)
  })

  it('saves nothing when nothing is paid', () => {
    const result = simulateInSchool(debts, inSchool.weeks, 0, repayExtraMonthlyCents)
    expect(result.totalAccrued).toBeCloseTo(200931.91708332195, 2)
    expect(result.covered).toBeCloseTo(0, 2)
    expect(result.capitalizationAvoided).toBe(0)
    expect(result.lifetimeSavings).toBe(0)
  })
})
