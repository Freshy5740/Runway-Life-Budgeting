import { useMemo } from 'react'
import { Note, Stat } from '../../components/Card'
import { LineChart } from '../../components/charts/LineChart'
import { MoneyInput } from '../../components/MoneyInput'
import { TextInput } from '../../components/TextInput'
import { useData } from '../../app/plan'
import { DEBT_TYPES, simulateInSchool } from '../../engines/loans'
import { setPref } from '../../db/prefs'
import { formatDuration } from '../../lib/dates'
import { formatMoney } from '../../lib/money'

/** In school: what paying a little toward interest now saves later. */
export function InSchoolPanel() {
  const { debts, prefs } = useData()
  const weekly = prefs.inSchoolWeeklyCents
  const result = useMemo(
    () => simulateInSchool(debts, prefs.inSchoolWeeks, weekly, prefs.repayExtraMonthlyCents),
    [debts, prefs.inSchoolWeeks, weekly, prefs.repayExtraMonthlyCents],
  )
  const accruing = debts.some((debt) => DEBT_TYPES[debt.type].accruesInSchool)
  const monthsSooner = result.monthsToFreeBaseline - result.monthsToFreeWithPlan

  return (
    <>
      <p className="lede">
        Unsubsidized and private loans build interest while you're enrolled. Leave it alone and that
        interest <b>capitalizes</b>: it's added to what you owe when repayment starts, and then you
        pay interest on the interest. Paying even a little now stops that.
      </p>
      <div className="fields two">
        <label className="field">
          <span>Weeks until repayment starts</span>
          <TextInput
            inputMode="numeric"
            value={String(prefs.inSchoolWeeks)}
            onCommit={(text) => {
              const weeks = parseInt(text, 10)
              if (weeks >= 1) void setPref('inSchoolWeeks', weeks)
            }}
          />
        </label>
        <label className="field">
          <span>Spare cash toward loans / week</span>
          <MoneyInput
            placeholder="25"
            valueCents={weekly || null}
            onChangeCents={(cents) => void setPref('inSchoolWeeklyCents', cents ?? 0)}
          />
        </label>
      </div>
      <div className="stats">
        <Stat
          label="Interest you cover in school"
          value={formatMoney(result.covered)}
          sub={`of ${formatMoney(result.totalAccrued)} building up`}
          tone="gold"
        />
        <Stat
          label="Capitalization avoided"
          value={formatMoney(result.capitalizationAvoided)}
          sub="never added to what you owe"
          tone="good"
        />
        <Stat
          label="Saved over the loans' life"
          value={formatMoney(result.lifetimeSavings)}
          sub={
            monthsSooner > 0
              ? `and paid off ${formatDuration(monthsSooner)} sooner`
              : 'less to repay'
          }
          tone="good"
        />
      </div>
      {!accruing ? (
        <Note tone="good">
          None of your loans build interest while you're in school (subsidized federal loans don't),
          so nothing capitalizes. Put spare cash in your emergency fund instead.
        </Note>
      ) : weekly <= 0 ? (
        <Note tone="bad">
          Doing nothing, about <b>{formatMoney(result.totalAccrued)}</b> in interest will pile up
          over {formatDuration(result.months)} and be added to your loans. Add a weekly amount above
          to see the difference.
        </Note>
      ) : (
        <Note tone="good">
          Putting <b>{formatMoney(weekly)}/week</b> toward your loans now covers{' '}
          <b>{formatMoney(result.covered)}</b> of in-school interest, keeps{' '}
          <b>{formatMoney(result.capitalizationAvoided)}</b> from being added to what you owe, and
          trims about <b>{formatMoney(result.lifetimeSavings)}</b> off what you'll repay over the
          loans' life.
        </Note>
      )}
      <div className="panel-chart">
        <LineChart
          title="Total loan balance until repayment starts"
          series={[
            {
              key: 'baseline',
              label: 'Do nothing (interest builds up)',
              color: 'var(--chart-muted)',
              dashed: true,
              values: result.baseline.map((p) => p.balance),
            },
            {
              key: 'plan',
              label: `Pay ${formatMoney(weekly)}/week in school`,
              color: 'var(--cat-1)',
              values: result.withPlan.map((p) => p.balance),
            },
          ]}
        />
      </div>
      <p className="fine-print">
        Estimates, not financial advice. "Saved over the loans' life" assumes you then repay with
        the avalanche method and your extra payment from the Repaying tab.
      </p>
    </>
  )
}
