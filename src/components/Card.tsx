import type { ReactNode } from 'react'

interface CardProps {
  title: string
  hint?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** A titled panel. The title is a small uppercase label, as in the prototype. */
export function Card({ title, hint, actions, children, className }: CardProps) {
  return (
    <section className={`card ${className ?? ''}`}>
      <header className="card-head">
        <h2>{title}</h2>
        {hint && <span className="card-hint">{hint}</span>}
        {actions && <div className="card-actions">{actions}</div>}
      </header>
      {children}
    </section>
  )
}

interface StatProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: 'good' | 'gold' | 'bad'
}

export function Stat({ label, value, sub, tone }: StatProps) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${tone ?? ''}`}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

export function Note({ tone, children }: { tone?: 'good' | 'bad' | 'gold'; children: ReactNode }) {
  return <div className={`note ${tone ?? ''}`}>{children}</div>
}
