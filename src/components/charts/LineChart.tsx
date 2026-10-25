import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import { formatMoney, formatMoneyCompact } from '../../lib/money'
import { monthLabel, monthTickLabel, monthTicks, niceTicks } from './scale'
import { useElementWidth } from './useElementWidth'
import './charts.css'

export interface LineSeries {
  key: string
  label: string
  /** A CSS color, usually a chart token like var(--cat-1). */
  color: string
  /** Dashed lines mark a comparison baseline. */
  dashed?: boolean
  /** One value (in cents) per month, starting now. */
  values: readonly number[]
}

interface LineChartProps {
  title: string
  series: readonly LineSeries[]
  height?: number
}

const PAD = { top: 14, right: 18, bottom: 28, left: 58 }

/** Money over months: hover or arrow keys show every series at that month. */
export function LineChart({ title, series, height = 240 }: LineChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)

  const maxMonth = Math.max(1, ...series.map((s) => s.values.length - 1))
  const yTicks = niceTicks(Math.max(0, ...series.flatMap((s) => s.values)))
  const top = yTicks[yTicks.length - 1]
  const plotWidth = width - PAD.left - PAD.right
  const plotHeight = height - PAD.top - PAD.bottom
  const x = (month: number) => PAD.left + (month / maxMonth) * plotWidth
  const y = (value: number) => PAD.top + (1 - value / top) * plotHeight

  const pick = (event: PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const month = Math.round(((event.clientX - rect.left) / rect.width) * maxMonth)
    setActive(Math.min(maxMonth, Math.max(0, month)))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 12 : 1
    if (event.key === 'ArrowRight') setActive((m) => Math.min(maxMonth, (m ?? -1) + step))
    else if (event.key === 'ArrowLeft') setActive((m) => Math.max(0, (m ?? maxMonth + 1) - step))
    else if (event.key === 'Escape') setActive(null)
    else return
    event.preventDefault()
  }

  const tooltipOnLeft = active !== null && x(active) > width / 2

  return (
    <figure className="chart">
      <div
        ref={ref}
        className="chart-plot"
        tabIndex={0}
        role="group"
        aria-label={`${title}. Use the arrow keys to read values by month.`}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <svg width={width} height={height} aria-hidden="true">
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                className="chart-grid"
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text className="chart-tick" x={PAD.left - 8} y={y(tick) + 4} textAnchor="end">
                {formatMoneyCompact(tick)}
              </text>
            </g>
          ))}
          {monthTicks(maxMonth, plotWidth).map((month) => (
            <text
              key={month}
              className="chart-tick"
              x={x(month)}
              y={height - 8}
              textAnchor="middle"
            >
              {monthTickLabel(month)}
            </text>
          ))}
          {active !== null && (
            <line
              className="chart-crosshair"
              x1={x(active)}
              x2={x(active)}
              y1={PAD.top}
              y2={PAD.top + plotHeight}
            />
          )}
          {series.map((s) => (
            <path
              key={s.key}
              d={s.values
                .map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
                .join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? '6 5' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {series.map((s) => {
            const month =
              active === null ? s.values.length - 1 : Math.min(active, s.values.length - 1)
            if (active !== null && active > s.values.length - 1) return null
            return (
              <circle
                key={s.key}
                cx={x(month)}
                cy={y(s.values[month])}
                r={4}
                fill={s.color}
                stroke="var(--surface)"
                strokeWidth={2}
              />
            )
          })}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={() => setActive(null)}
          />
        </svg>
        {active !== null && (
          <div
            className="chart-tooltip"
            style={
              tooltipOnLeft
                ? { right: width - x(active) + 10, top: PAD.top }
                : { left: x(active) + 10, top: PAD.top }
            }
          >
            <div className="chart-tooltip-title">{monthLabel(active)}</div>
            {series.map((s) => (
              <div key={s.key} className="chart-tooltip-row">
                <LineKey color={s.color} dashed={s.dashed} />
                <b>{active < s.values.length ? formatMoney(s.values[active]) : '—'}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {series.length > 1 && (
        <figcaption className="chart-legend">
          {series.map((s) => (
            <span key={s.key}>
              <LineKey color={s.color} dashed={s.dashed} />
              {s.label}
            </span>
          ))}
        </figcaption>
      )}
      <ChartTable series={series} maxMonth={maxMonth} />
    </figure>
  )
}

function LineKey({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <svg className="legend-line" width="18" height="8" aria-hidden="true">
      <line
        x1="1"
        x2="17"
        y1="4"
        y2="4"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={dashed ? '4 3' : undefined}
      />
    </svg>
  )
}

function ChartTable({ series, maxMonth }: { series: readonly LineSeries[]; maxMonth: number }) {
  const months: number[] = []
  for (let m = 0; m <= maxMonth; m += 12) months.push(m)
  if (months[months.length - 1] !== maxMonth) months.push(maxMonth)
  return (
    <details className="chart-table">
      <summary>Show as table</summary>
      <table>
        <thead>
          <tr>
            <th scope="col">When</th>
            {series.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m}>
              <th scope="row">{monthLabel(m)}</th>
              {series.map((s) => (
                <td key={s.key}>{m < s.values.length ? formatMoney(s.values[m]) : '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
