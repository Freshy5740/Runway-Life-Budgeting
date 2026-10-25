import { useToast } from '../../components/toast'
import { DEBT_TYPES, monthlyInterest } from '../../engines/loans'
import { db, type DebtRecord } from '../../db/db'
import { removeRecord, restoreRecord } from '../../db/records'
import { formatMoney } from '../../lib/money'
import { debtColor } from './debtColor'

export function DebtCard({ debt }: { debt: DebtRecord }) {
  const toast = useToast()
  const type = DEBT_TYPES[debt.type]
  const interest = monthlyInterest(debt)
  const minimumTooLow = debt.minPaymentCents > 0 && debt.minPaymentCents <= interest

  async function remove() {
    await removeRecord(db.debts, debt.id)
    toast(`Removed ${debt.name}.`, {
      actionLabel: 'Undo',
      onAction: () => void restoreRecord(db.debts, debt.id),
    })
  }

  return (
    <article className="debt">
      <span className="debt-bar" style={{ background: debtColor(debt.type) }} aria-hidden="true" />
      <header>
        <h3>{debt.name}</h3>
        <button
          type="button"
          className="btn ghost icon-btn"
          aria-label={`Remove ${debt.name}`}
          onClick={remove}
        >
          ×
        </button>
      </header>
      <div className="debt-balance">{formatMoney(debt.balanceCents)}</div>
      <dl>
        <div>
          <dt>{type.label}</dt>
          <dd>{debt.aprPercent}% APR</dd>
        </div>
        <div>
          <dt>Interest builds about</dt>
          <dd>{formatMoney(interest)}/mo</dd>
        </div>
        <div>
          <dt>Minimum</dt>
          <dd>{formatMoney(debt.minPaymentCents)}/mo</dd>
        </div>
      </dl>
      {!type.accruesInSchool && (
        <p className="debt-flag good">No interest while you're in school</p>
      )}
      {minimumTooLow && <p className="debt-flag bad">The minimum barely covers the interest.</p>}
    </article>
  )
}
