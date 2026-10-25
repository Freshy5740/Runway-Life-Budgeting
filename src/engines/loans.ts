import type { Cents } from '../lib/money'

// Loans & debt: in-school interest build-up and payoff strategies. Ported from the prototype's
// monthlyRate / simRepay / simSchool. Amounts are cents; simulations keep fractions of a cent.

export type DebtType = 'fed-sub' | 'fed-unsub' | 'private' | 'card' | 'other'
export type Compounding = 'monthly' | 'daily'
export type Strategy = 'avalanche' | 'snowball' | 'minimum'

/** Fixed display order; chart colors follow this order too. */
export const DEBT_TYPE_ORDER: readonly DebtType[] = [
  'fed-sub',
  'fed-unsub',
  'private',
  'card',
  'other',
]

export const DEBT_TYPES: Record<DebtType, { label: string; accruesInSchool: boolean }> = {
  'fed-sub': { label: 'Federal · subsidized', accruesInSchool: false },
  'fed-unsub': { label: 'Federal · unsubsidized', accruesInSchool: true },
  private: { label: 'Private loan', accruesInSchool: true },
  card: { label: 'Credit card', accruesInSchool: true },
  other: { label: 'Other', accruesInSchool: true },
}

export interface DebtInput {
  type: DebtType
  balanceCents: Cents
  aprPercent: number
  compounding: Compounding
  minPaymentCents: Cents
}

export function monthlyRate(debt: Pick<DebtInput, 'aprPercent' | 'compounding'>): number {
  const apr = debt.aprPercent / 100
  if (apr <= 0) return 0
  return debt.compounding === 'daily' ? Math.pow(1 + apr / 365, 365 / 12) - 1 : apr / 12
}

/** Roughly how much interest a debt adds in a month at its current balance. */
export function monthlyInterest(debt: DebtInput): number {
  return debt.balanceCents * monthlyRate(debt)
}

export interface RepaymentPoint {
  month: number
  balance: number
  interestPaid: number
}

export interface RepaymentResult {
  months: number
  interestPaid: number
  totalPaid: number
  /** True when payments never outpace interest, so the debt never clears. */
  stuck: boolean
  monthlyBudget: number
  series: RepaymentPoint[]
}

const MAX_MONTHS = 720

/**
 * Pays every minimum each month, then (except for "minimum") puts the leftover budget on one debt at
 * a time: highest rate first (avalanche) or smallest balance first (snowball).
 */
export function simulateRepayment(
  debts: readonly DebtInput[],
  strategy: Strategy,
  extraMonthlyCents: Cents,
  startBalances?: readonly number[],
): RepaymentResult {
  const live = debts.map((debt, i) => ({
    min: debt.minPaymentCents,
    balance: startBalances ? startBalances[i] : debt.balanceCents,
    rate: monthlyRate(debt),
  }))
  const totalMin = live.reduce((sum, debt) => sum + debt.min, 0)
  const monthlyBudget = strategy === 'minimum' ? totalMin : totalMin + extraMonthlyCents
  const ordered = () => {
    const copy = [...live]
    if (strategy === 'avalanche') copy.sort((a, b) => b.rate - a.rate || a.balance - b.balance)
    else if (strategy === 'snowball') copy.sort((a, b) => a.balance - b.balance || b.rate - a.rate)
    return copy
  }

  let months = 0
  let interestPaid = 0
  let stuck = false
  const series: RepaymentPoint[] = [
    { month: 0, balance: live.reduce((sum, debt) => sum + debt.balance, 0), interestPaid: 0 },
  ]

  while (live.some((debt) => debt.balance > 0.5) && months < MAX_MONTHS) {
    months++
    for (const debt of live) {
      if (debt.balance > 0) {
        const interest = debt.balance * debt.rate
        debt.balance += interest
        interestPaid += interest
      }
    }
    let available = monthlyBudget
    for (const debt of live) {
      if (debt.balance > 0 && available > 0) {
        const payment = Math.min(debt.min, debt.balance, available)
        debt.balance -= payment
        available -= payment
      }
    }
    if (strategy !== 'minimum') {
      for (const debt of ordered()) {
        if (available <= 0) break
        if (debt.balance > 0) {
          const payment = Math.min(available, debt.balance)
          debt.balance -= payment
          available -= payment
        }
      }
    }
    const balance = Math.max(
      0,
      live.reduce((sum, debt) => sum + debt.balance, 0),
    )
    series.push({ month: months, balance, interestPaid })
    // Not shrinking after a few months means the payments can't keep up with interest.
    if (months > 2 && balance > 1 && balance >= series[series.length - 2].balance - 1) {
      stuck = true
      break
    }
  }

  const startTotal = startBalances
    ? startBalances.reduce((sum, balance) => sum + balance, 0)
    : debts.reduce((sum, debt) => sum + debt.balanceCents, 0)
  return {
    months,
    interestPaid,
    totalPaid: startTotal + interestPaid,
    stuck: stuck || months >= MAX_MONTHS,
    monthlyBudget,
    series,
  }
}

export interface InSchoolPoint {
  month: number
  balance: number
}

export interface InSchoolResult {
  months: number
  /** Interest that builds up on unsubsidized and private loans before repayment starts. */
  totalAccrued: number
  /** How much of that interest the weekly payments cover. */
  covered: number
  /** Interest that would have been added to principal (capitalized) but won't be. */
  capitalizationAvoided: number
  /** Total saved over the life of the loans, repaying with the avalanche method afterwards. */
  lifetimeSavings: number
  monthsToFreeBaseline: number
  monthsToFreeWithPlan: number
  baseline: InSchoolPoint[]
  withPlan: InSchoolPoint[]
}

/**
 * Compares doing nothing while enrolled (interest piles up and capitalizes) with putting a weekly
 * amount toward the loans, highest rate first: unpaid interest before principal.
 */
export function simulateInSchool(
  debts: readonly DebtInput[],
  weeksUntilRepayment: number,
  weeklyContributionCents: Cents,
  extraMonthlyCents: Cents,
): InSchoolResult {
  const months = Math.max(1, Math.round(weeksUntilRepayment / 4.345))
  const monthlyContribution = (weeklyContributionCents * 52) / 12
  const live = debts.map((debt) => ({
    principal: debt.balanceCents,
    unpaid: 0,
    rate: monthlyRate(debt),
    accrues: DEBT_TYPES[debt.type].accruesInSchool,
  }))
  const accruing = () =>
    live.filter((debt) => debt.accrues && debt.principal > 0).sort((a, b) => b.rate - a.rate)

  let totalAccrued = 0
  const withPlan: InSchoolPoint[] = [
    { month: 0, balance: live.reduce((sum, debt) => sum + debt.principal, 0) },
  ]
  for (let month = 1; month <= months; month++) {
    for (const debt of live) {
      if (debt.accrues) {
        const interest = debt.principal * debt.rate
        debt.unpaid += interest
        totalAccrued += interest
      }
    }
    let available = monthlyContribution
    for (const debt of accruing()) {
      if (available <= 0) break
      const payment = Math.min(available, debt.unpaid)
      debt.unpaid -= payment
      available -= payment
    }
    for (const debt of accruing()) {
      if (available <= 0) break
      const payment = Math.min(available, debt.principal)
      debt.principal -= payment
      available -= payment
    }
    withPlan.push({
      month,
      balance: live.reduce((sum, debt) => sum + debt.principal + debt.unpaid, 0),
    })
  }

  const unpaidWithPlan = live.reduce((sum, debt) => sum + debt.unpaid, 0)
  const balancesWithPlan = live.map((debt) => debt.principal + debt.unpaid)

  const accruedByMonth = (debt: DebtInput, month: number) =>
    DEBT_TYPES[debt.type].accruesInSchool ? debt.balanceCents * monthlyRate(debt) * month : 0
  const totalAccruedBaseline = debts.reduce((sum, debt) => sum + accruedByMonth(debt, months), 0)
  const balancesBaseline = debts.map((debt) => debt.balanceCents + accruedByMonth(debt, months))
  const baseline: InSchoolPoint[] = []
  for (let month = 0; month <= months; month++) {
    baseline.push({
      month,
      balance: debts.reduce(
        (sum, debt) => sum + debt.balanceCents + accruedByMonth(debt, month),
        0,
      ),
    })
  }

  const lifeBaseline = simulateRepayment(debts, 'avalanche', extraMonthlyCents, balancesBaseline)
  const lifeWithPlan = simulateRepayment(debts, 'avalanche', extraMonthlyCents, balancesWithPlan)
  return {
    months,
    totalAccrued,
    covered: Math.max(0, totalAccrued - unpaidWithPlan),
    capitalizationAvoided: Math.max(0, totalAccruedBaseline - unpaidWithPlan),
    lifetimeSavings: Math.max(0, lifeBaseline.totalPaid - lifeWithPlan.totalPaid),
    monthsToFreeBaseline: lifeBaseline.months,
    monthsToFreeWithPlan: lifeWithPlan.months,
    baseline,
    withPlan,
  }
}
