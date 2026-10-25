import { useState } from 'react'
import { formatMoney } from '../../lib/money'
import './charts.css'

export interface DonutSlice {
  key: string
  label: string
  value: number
  color: string
}

const SIZE = 160
const OUTER = 70
const INNER = 44

/** Part-to-whole for a handful of categories. Hovering a slice or its legend row shows it in the middle. */
export function DonutChart({ title, slices }: { title: string; slices: readonly DonutSlice[] }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  const focus = slices.find((s) => s.key === hovered)
  const c = SIZE / 2

  const arcs = slices.map((slice, i) => {
    const before = slices.slice(0, i).reduce((sum, s) => sum + s.value, 0)
    const fraction = total > 0 ? slice.value / total : 0
    const start = -Math.PI / 2 + (total > 0 ? before / total : 0) * 2 * Math.PI
    return { slice, fraction, start, end: start + fraction * 2 * Math.PI }
  })

  const point = (r: number, a: number) =>
    `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`
  const arcPath = (start: number, end: number) => {
    const large = end - start > Math.PI ? 1 : 0
    return `M${point(OUTER, start)} A${OUTER} ${OUTER} 0 ${large} 1 ${point(OUTER, end)} L${point(INNER, end)} A${INNER} ${INNER} 0 ${large} 0 ${point(INNER, start)} Z`
  }

  return (
    <figure className="donut" aria-label={title}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        {arcs.map(({ slice, fraction, start, end }) =>
          fraction >= 0.999 ? (
            <circle
              key={slice.key}
              cx={c}
              cy={c}
              r={(OUTER + INNER) / 2}
              fill="none"
              stroke={slice.color}
              strokeWidth={OUTER - INNER}
            />
          ) : (
            <path
              key={slice.key}
              d={arcPath(start, end)}
              fill={slice.color}
              stroke="var(--surface)"
              strokeWidth={2}
              opacity={hovered && hovered !== slice.key ? 0.35 : 1}
              onPointerEnter={() => setHovered(slice.key)}
              onPointerLeave={() => setHovered(null)}
            />
          ),
        )}
        <text className="donut-caption" x={c} y={c - 6} textAnchor="middle">
          {focus ? `${Math.round((100 * focus.value) / total)}%` : 'total'}
        </text>
        <text className="donut-value" x={c} y={c + 14} textAnchor="middle">
          {formatMoney(focus ? focus.value : total)}
        </text>
      </svg>
      <figcaption>
        <ul className="donut-legend">
          {slices.map((slice) => (
            <li
              key={slice.key}
              tabIndex={0}
              className={hovered === slice.key ? 'active' : undefined}
              onPointerEnter={() => setHovered(slice.key)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(slice.key)}
              onBlur={() => setHovered(null)}
            >
              <i style={{ background: slice.color }} aria-hidden="true" />
              <span className="donut-label">{slice.label}</span>
              <span className="mono">{formatMoney(slice.value)}</span>
              <span className="donut-pct mono">
                {total > 0 ? Math.round((100 * slice.value) / total) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}
