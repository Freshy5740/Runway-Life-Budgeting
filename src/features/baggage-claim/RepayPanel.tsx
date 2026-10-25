import { Note, Stat } from '../../components/Card'
import { LineChart, type LineSeries } from '../../components/charts/LineChart'
import { MoneyInput } from '../../components/MoneyInput'
import { useData, usePlan } from '../../app/plan'
import { simulateRepayment, type Strategy } from '../../engines/loans'
import { setPref } from '../../db/prefs'
import { addMonths, formatDuration, formatMonthYear } from '../../lib/dates'
import { formatMoney } from '../../lib/money'

const STRATEGIES: { value: Strategy; title: string; detail: string }[] = [
  { value: 'avalanche', title: 'Avalanche', detail: 'Highest rate first. Saves the most money.' },
  { value: 'snowball', title: 'Snowball', detail: 'Smallest balance first. Quick wins.' },
  { value: 'minimum', title: 'Minimums only', detail: 'The baseline to beat.' },
]

/** Repaying: how fast each strategy clears the debt and what it costs in interest. */
export function RepayPanel() {
  const { debts, prefs } = useData()
  const { today } = usePlan()
  const strategy = prefs.repayStrategy
  const extra = prefs.repayExtraMonthlyCents
  const chosen = simulateRepayment(debts, strategy, extra)
  const minimums = simulateRepayment(debts, 'minimum', extra)
  const strategyName = STRATEGIES.find((s) => s.value === strategy)?.title ?? strategy

  const series: LineSeries[] = [
    {
      key: 'balance',
      label: 'Balance left',
      color: 'var(--cat-1)',
      values: chosen.series.map((p) => p.balance),
    },
    {
      key: 'interest',
      label: 'Interest paid so far',
      color: 'var(--cat-2)',
      values: chosen.series.map((p) => p.interestPaid),
    },
  ]
  if (!minimums.stuck && strategy !== 'minimum') {
    series.push({
      key: 'minimums',
      label: 'Balance paying minimums only',
      color: 'var(--chart-muted)',
      dashed: true,
      values: minimums.series.map((p) => p.balance),
    })
  }

  const interestSaved = minimums.interestPaid - chosen.interestPaid
  const monthsSaved = minimums.months - chosen.months

  return (
    <>
      <label className="field extra-field">
        <span>Extra toward debt each month (on top of minimums)</span>
        <MoneyInput
          placeholder="100"
          valueCents={extra || null}
          onChangeCents={(cents) => void setPref('repayExtraMonthlyCents', cents ?? 0)}
        />
      </label>
      <div className="strategies" role="radiogroup" aria-label="Payoff strategy">
        {STRATEGIES.map((s) => (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={s.value === strategy}
            className={s.value === strategy ? 'active' : undefined}
            onClick={() => void setPref('repayStrategy', s.value)}
          >
            <b>{s.title}</b>
            <span>{s.detail}</span>
          </button>
        ))}
      </div>
      <div className="stats">
        <Stat
          label="Debt-free in"
          value={chosen.stuck ? 'Never' : formatDuration(chosen.months)}
          sub={
            chosen.stuck
              ? 'payment too low'
              : `around ${formatMonthYear(addMonths(today, chosen.months))}`
          }
          tone={chosen.stuck ? 'bad' : undefined}
        />
        <Stat
          label="Total interest"
          value={formatMoney(chosen.interestPaid)}
          sub={`of ${formatMoney(chosen.totalPaid)} paid in all`}
          tone="gold"
        />
        {strategy === 'minimum' || minimums.stuck ? (
          <Stat
            label="Saved vs minimums"
            value="—"
            sub={minimums.stuck ? 'minimums never finish' : 'this is the baseline'}
          />
        ) : (
          <Stat
            label="Saved vs minimums"
            value={formatMoney(interestSaved)}
            sub={monthsSaved > 0 ? `and ${formatDuration(monthsSaved)} sooner` : 'in interest'}
            tone="good"
          />
        )}
      </div>
      {chosen.stuck ? (
        <Note tone="bad">
          At {formatMoney(chosen.monthlyBudget)}/month your payments don't keep up with interest, so
          this never clears. Raise the extra payment or the minimums.
        </Note>
      ) : (
        <Note>
          Paying <b>{formatMoney(chosen.monthlyBudget)}/month</b> with the <b>{strategyName}</b>{' '}
          method, you're debt-free in <b>{formatDuration(chosen.months)}</b> and pay{' '}
          {formatMoney(chosen.interestPaid)} in interest.
        </Note>
      )}
      <div className="panel-chart">
        <LineChart title="Debt balance and interest paid over time" series={series} />
      </div>
      <p className="fine-print">
        Estimates, not financial advice. Federal repayment plans (like income-driven plans) arrive
        in a later version.
      </p>
    </>
  )
}
