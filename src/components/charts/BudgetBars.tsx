import { useState } from 'react'
import { formatMoney, formatMoneyCompact } from '../../lib/money'
import { niceTicks } from './scale'
import { useElementWidth } from './useElementWidth'
import './charts.css'

export interface BudgetBarGroup {
  key: string
  label: string
  budget: number
  spent: number
}

const PAD = { top: 22, right: 8, bottom: 26, left: 48 }
const HEIGHT = 220

/** Column with a 4px rounded top and a square base. */
function columnPath(x: number, top: number, width: number, base: number): string {
  const r = Math.min(4, width / 2, Math.max(0, base - top))
  return `M${x} ${base} V${top + r} Q${x} ${top} ${x + r} ${top} H${x + width - r} Q${x + width} ${top} ${x + width} ${top + r} V${base} Z`
}

const verdict = (g: BudgetBarGroup) =>
  g.spent > g.budget
    ? `${formatMoney(g.spent - g.budget)} over`
    : `${formatMoney(g.budget - g.spent)} under`

/** Budget next to what was actually spent, per period. Over-budget periods get a ▲ marker. */
export function BudgetBars({
  title,
  groups,
}: {
  title: string
  groups: readonly BudgetBarGroup[]
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>(460)
  const [active, setActive] = useState<number | null>(null)

  const ticks = niceTicks(Math.max(0, ...groups.flatMap((g) => [g.budget, g.spent])))
  const top = ticks[ticks.length - 1]
  const plotWidth = width - PAD.left - PAD.right
  const plotHeight = HEIGHT - PAD.top - PAD.bottom
  const base = PAD.top + plotHeight
  const y = (value: number) => PAD.top + (1 - value / top) * plotHeight
  const band = plotWidth / Math.max(1, groups.length)
  const barWidth = Math.max(4, Math.min(24, (band * 0.7 - 2) / 2))
  const groupLeft = (i: number) => PAD.left + i * band + (band - (barWidth * 2 + 2)) / 2

  const focus = active === null ? null : groups[active]

  return (
    <figure className="chart">
      <div ref={ref} className="chart-plot">
        <svg width={width} height={HEIGHT} role="img" aria-label={title}>
          {ticks.map((tick) => (
            <g key={tick} aria-hidden="true">
              <line
                className="chart-grid"
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text className="chart-tick" x={PAD.left - 6} y={y(tick) + 4} textAnchor="end">
                {formatMoneyCompact(tick)}
              </text>
            </g>
          ))}
          {groups.map((g, i) => {
            const left = groupLeft(i)
            const over = g.spent > g.budget
            return (
              <g
                key={g.key}
                tabIndex={0}
                role="img"
                aria-label={`${g.label}: budget ${formatMoney(g.budget)}, spent ${formatMoney(g.spent)}, ${verdict(g)}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className={active === i ? 'bar-group active' : 'bar-group'}
              >
                <rect
                  x={PAD.left + i * band}
                  y={PAD.top}
                  width={band}
                  height={plotHeight}
                  fill="transparent"
                />
                <path d={columnPath(left, y(g.budget), barWidth, base)} fill="var(--chart-muted)" />
                <path
                  d={columnPath(left + barWidth + 2, y(g.spent), barWidth, base)}
                  fill={over ? 'var(--bad)' : 'var(--good)'}
                />
                {over && (
                  <text
                    className="bar-flag"
                    x={left + barWidth * 1.5 + 2}
                    y={y(g.spent) - 5}
                    textAnchor="middle"
                  >
                    ▲
                  </text>
                )}
                <text
                  className="chart-tick"
                  x={PAD.left + i * band + band / 2}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                >
                  {g.label}
                </text>
              </g>
            )
          })}
        </svg>
        {focus && active !== null && (
          <div
            className="chart-tooltip"
            style={
              groupLeft(active) > width / 2
                ? { right: width - groupLeft(active) + 8, top: 0 }
                : { left: groupLeft(active) + barWidth * 2 + 10, top: 0 }
            }
          >
            <div className="chart-tooltip-title">{focus.label}</div>
            <div className="chart-tooltip-row">
              <b>{formatMoney(focus.budget)}</b>
              <span>budget</span>
            </div>
            <div className="chart-tooltip-row">
              <b>{formatMoney(focus.spent)}</b>
              <span>spent</span>
            </div>
            <div className="chart-tooltip-row">
              <span>
                {focus.spent > focus.budget ? '▲ ' : ''}
                {verdict(focus)}
              </span>
            </div>
          </div>
        )}
      </div>
      <figcaption className="chart-legend">
        <span>
          <i
            className="legend-box"
            style={{ background: 'var(--chart-muted)' }}
            aria-hidden="true"
          />
          Budget
        </span>
        <span>
          <i className="legend-box" style={{ background: 'var(--good)' }} aria-hidden="true" />
          Spent, under budget
        </span>
        <span>
          <i className="legend-box" style={{ background: 'var(--bad)' }} aria-hidden="true" />▲
          Spent, over budget
        </span>
      </figcaption>
      <details className="chart-table">
        <summary>Show as table</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">Budget</th>
              <th scope="col">Spent</th>
              <th scope="col">Difference</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.key}>
                <th scope="row">{g.label}</th>
                <td>{formatMoney(g.budget)}</td>
                <td>{formatMoney(g.spent)}</td>
                <td>{verdict(g)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
