import { useMemo, type ReactNode } from 'react'
import { Card } from '../../components/Card'
import { BudgetBars } from '../../components/charts/BudgetBars'
import { DonutChart } from '../../components/charts/DonutChart'
import { useData, usePlan } from '../../app/plan'
import { hrefFor, type Route } from '../../app/routes'
import { groupWeeks } from '../../engines/budget'
import { DEBT_TYPE_ORDER, DEBT_TYPES, simulateInSchool } from '../../engines/loans'
import { formatDate } from '../../lib/dates'
import { formatMoney } from '../../lib/money'
import { debtColor } from '../baggage-claim/debtColor'
import './tarmac.css'

interface TileProps {
  to: Route
  accent: 'teal' | 'blue' | 'gold' | 'plum'
  label: string
  value: ReactNode
  sub: ReactNode
}

function Tile({ to, accent, label, value, sub }: TileProps) {
  return (
    <a className={`tile ${accent}`} href={hrefFor(to)}>
      <span className="tile-label">{label}</span>
      <span className="tile-value">{value}</span>
      <span className="tile-sub">{sub}</span>
    </a>
  )
}

export function Tarmac() {
  const data = useData()
  const plan = usePlan()
  const { terms, debts, envelopes, prefs } = data
  const term = plan.activeTerm
  const summary = plan.activeSummary

  const school = useMemo(
    () =>
      debts.length
        ? simulateInSchool(
            debts,
            prefs.inSchoolWeeks,
            prefs.inSchoolWeeklyCents,
            prefs.repayExtraMonthlyCents,
          )
        : null,
    [debts, prefs.inSchoolWeeks, prefs.inSchoolWeeklyCents, prefs.repayExtraMonthlyCents],
  )
  const interestPercent =
    school && school.totalAccrued > 0 ? Math.round((100 * school.covered) / school.totalAccrued) : 0

  const emergency = envelopes.find((e) => e.kind === 'emergency')
  const saved = envelopes.reduce((sum, e) => sum + e.balanceCents, 0)
  const owed = debts.reduce((sum, d) => sum + d.balanceCents, 0)
  const planStart = terms[0]?.start
  const planEnd = terms.reduce<string | undefined>(
    (end, t) => (end && end > t.end ? end : t.end),
    undefined,
  )

  const slices = DEBT_TYPE_ORDER.map((type) => ({
    key: type,
    label: DEBT_TYPES[type].label,
    value: debts.filter((d) => d.type === type).reduce((sum, d) => sum + d.balanceCents, 0),
    color: debtColor(type),
  })).filter((slice) => slice.value > 0)

  const months = groupWeeks(plan.weeks, 'month')
    .filter((g) => g.logged)
    .slice(-8)
    .map((g) => ({ key: g.key, label: g.label, budget: g.budget, spent: g.spent }))

  return (
    <>
      <section className="hero" aria-label="This week">
        <div className="hero-main">
          <div className="hero-label">Safe to spend this week</div>
          <div className={`hero-value ${plan.safePerWeek < 0 ? 'bad' : ''}`}>
            {formatMoney(plan.safePerWeek)}
          </div>
          <div className="hero-sub">
            {term ? term.name : 'No term yet'} · re-balances as you log spending in{' '}
            <a href={hrefFor('plan')}>Flight Plan</a>
          </div>
        </div>
        <dl className="hero-facts">
          <div>
            <dt>Weeks left</dt>
            <dd>
              <b>{plan.weeksLeft}</b> of {plan.weeks.length}
            </dd>
          </div>
          <div>
            <dt>Plan covers</dt>
            <dd>
              {planStart && planEnd ? `${formatDate(planStart)} → ${formatDate(planEnd)}` : '—'}
            </dd>
          </div>
          <div>
            <dt>Terms in plan</dt>
            <dd>{terms.length}</dd>
          </div>
        </dl>
      </section>

      <div className="tiles">
        <Tile
          to="plan"
          accent="teal"
          label={`Arrivals · ${term?.name ?? 'term'}`}
          value={formatMoney(summary?.arrivals ?? 0)}
          sub="all money in this term"
        />
        <Tile
          to="plan"
          accent="blue"
          label={`Departures · ${term?.name ?? 'term'}`}
          value={formatMoney((summary?.bigTotal ?? 0) + (summary?.recurTotal ?? 0))}
          sub="tuition + ongoing costs"
        />
        <Tile
          to="baggage"
          accent="gold"
          label="Total baggage"
          value={formatMoney(owed)}
          sub={`${debts.length} debt${debts.length === 1 ? '' : 's'} tracked`}
        />
        <Tile
          to="miles"
          accent="plum"
          label="Savings + reserve"
          value={formatMoney(saved)}
          sub="across all envelopes"
        />
        <Tile
          to="baggage"
          accent="gold"
          label="Interest covered in school"
          value={`${interestPercent}%`}
          sub="of what's building up now"
        />
        <Tile
          to="miles"
          accent="blue"
          label="Emergency fund"
          value={formatMoney(emergency?.balanceCents ?? 0)}
          sub={`target ${formatMoney(emergency?.targetCents ?? 0)}`}
        />
      </div>

      <div className="grid-2 tarmac-charts">
        <Card title="Baggage by type" hint="your loans at a glance">
          {slices.length ? (
            <DonutChart title="Loan balances by type" slices={slices} />
          ) : (
            <p className="empty">
              No loans yet. Add them in <a href={hrefFor('baggage')}>Baggage Claim</a>.
            </p>
          )}
        </Card>
        <Card title="On budget?" hint="budget vs spending by month">
          {months.length ? (
            <BudgetBars title="Budget compared with spending, by month" groups={months} />
          ) : (
            <p className="empty">
              Log what you spend each week in <a href={hrefFor('plan')}>Flight Plan</a> to see this.
            </p>
          )}
        </Card>
      </div>
    </>
  )
}
