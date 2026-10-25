import { useEffect, useRef } from 'react'
import { Card, Note } from '../../components/Card'
import { MoneyInput } from '../../components/MoneyInput'
import { Segmented } from '../../components/Segmented'
import { useData, usePlan } from '../../app/plan'
import { budgetStatus, groupWeeks, type RunwayLevel, type WeekGroup } from '../../engines/budget'
import { setPref } from '../../db/prefs'
import { setWeekSpent } from '../../db/records'
import { formatDate } from '../../lib/dates'
import { formatMoney } from '../../lib/money'

const LEVELS: { value: RunwayLevel; label: string }[] = [
  { value: 'week', label: 'Weeks' },
  { value: 'month', label: 'Months' },
  { value: 'term', label: 'Terms' },
  { value: 'year', label: 'Years' },
]

function statusFor(group: WeekGroup) {
  if (!group.logged) return { status: 'none', fill: 0, text: '' }
  const status = budgetStatus(group.budget, group.spent)
  const fill = group.budget > 0 ? Math.min(100, (100 * group.spent) / group.budget) : 100
  const text =
    status === 'over'
      ? `${formatMoney(group.spent - group.budget)} over`
      : status === 'close'
        ? `${formatMoney(group.budget - group.spent)} left`
        : `${formatMoney(group.budget - group.spent)} under`
  return { status, fill, text }
}

/** The runway strip: each week's budget, what you spent, and how it compares. */
export function RunwayOutlook() {
  const { prefs } = useData()
  const plan = usePlan()
  const laneRef = useRef<HTMLDivElement>(null)
  const level = prefs.runwayLevel
  const groups = groupWeeks(plan.weeks, level)
  const term = plan.activeTerm
  const s = plan.activeSummary

  // Start with the current week in view.
  useEffect(() => {
    const lane = laneRef.current
    const now = lane?.querySelector<HTMLElement>('.now')
    if (lane && now) lane.scrollLeft = now.offsetLeft - lane.clientWidth / 2 + now.clientWidth / 2
  }, [level])

  return (
    <Card
      title="Runway outlook"
      hint="log what you spend; the weeks ahead re-balance"
      actions={
        <Segmented
          label="Show by"
          value={level}
          options={LEVELS}
          onChange={(value) => void setPref('runwayLevel', value)}
        />
      }
    >
      {term && s && (
        <Note tone={s.pool < 0 ? 'bad' : undefined}>
          <b>{term.name}</b> · {s.weeks} weeks: {formatMoney(s.arrivals)} in −{' '}
          {formatMoney(s.bigTotal)} big costs − {formatMoney(s.recurTotal)} ongoing
          {s.saveTotal > 0 && <> − {formatMoney(s.saveTotal)} auto-savings</>}
          {term.cushionCents > 0 && <> − {formatMoney(term.cushionCents)} cushion</>} ={' '}
          <b>{formatMoney(s.pool)}</b> to spend → <b>{formatMoney(s.baseWeekly)}/week</b>.
          {s.pool < 0 && " This term's costs are more than its income. Trim something first."}
        </Note>
      )}
      <div className="runway" ref={laneRef}>
        <div className="runway-lane">
          {groups.map((group, i) => {
            const { status, fill, text } = statusFor(group)
            const isWeek = level === 'week'
            const now = isWeek && group.key === plan.currentWeek
            return (
              <div
                key={group.key}
                className={`rw-cell ${isWeek ? '' : 'summary'} ${now ? 'now' : ''}`}
              >
                <div className="rw-head">
                  <span>
                    {isWeek ? `Wk ${i + 1}` : group.label}
                    {now && <span className="visually-hidden"> (this week)</span>}
                  </span>
                  {isWeek && <span className="rw-date">{group.label}</span>}
                </div>
                <div className="rw-budget mono">budget {formatMoney(group.budget)}</div>
                {isWeek ? (
                  <MoneyInput
                    className="rw-input mono"
                    placeholder="spent"
                    aria-label={`Spent the week of ${formatDate(group.start)}`}
                    valueCents={group.logged ? group.spent : null}
                    onChangeCents={(cents) => void setWeekSpent(group.start, cents)}
                  />
                ) : (
                  <div className={`rw-spent mono ${status}`}>
                    {group.logged ? formatMoney(group.spent) : '—'}
                  </div>
                )}
                <div className="rw-track">
                  <div className={`rw-fill ${status}`} style={{ width: `${fill}%` }} />
                </div>
                <div className={`rw-status ${status}`}>{text || ' '}</div>
              </div>
            )
          })}
          {groups.length === 0 && <p className="empty">Add term dates to build your runway.</p>}
        </div>
      </div>
    </Card>
  )
}
