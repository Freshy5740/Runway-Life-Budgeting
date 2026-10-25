import { useState, type FormEvent } from 'react'
import { DEBT_TYPE_ORDER, DEBT_TYPES, type Compounding, type DebtType } from '../../engines/loans'
import { db } from '../../db/db'
import { addRecord } from '../../db/records'
import { parseMoney } from '../../lib/money'

export function DebtForm() {
  const [name, setName] = useState('')
  const [type, setType] = useState<DebtType>('fed-unsub')
  const [balance, setBalance] = useState('')
  const [apr, setApr] = useState('')
  const [compounding, setCompounding] = useState<Compounding>('monthly')
  const [minPayment, setMinPayment] = useState('')

  async function add(event: FormEvent) {
    event.preventDefault()
    const balanceCents = parseMoney(balance)
    if (!name.trim() || !balanceCents) return
    const aprPercent = Math.max(0, parseFloat(apr) || 0)
    await addRecord(db.debts, {
      name: name.trim(),
      type,
      balanceCents,
      aprPercent,
      compounding,
      minPaymentCents: parseMoney(minPayment) ?? 0,
    })
    setName('')
    setBalance('')
    setApr('')
    setMinPayment('')
  }

  return (
    <form onSubmit={add}>
      <div className="fields">
        <label className="field">
          <span>Name</span>
          <input
            value={name}
            placeholder="Unsubsidized federal"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Type</span>
          <select value={type} onChange={(e) => setType(e.target.value as DebtType)}>
            {DEBT_TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {DEBT_TYPES[t].label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Balance</span>
          <input
            inputMode="decimal"
            value={balance}
            placeholder="12000"
            onChange={(e) => setBalance(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Interest (APR %)</span>
          <input
            inputMode="decimal"
            value={apr}
            placeholder="6.53"
            onChange={(e) => setApr(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Compounds</span>
          <select
            value={compounding}
            onChange={(e) => setCompounding(e.target.value as Compounding)}
          >
            <option value="monthly">Monthly</option>
            <option value="daily">Daily</option>
          </select>
        </label>
        <label className="field">
          <span>Min payment / mo</span>
          <input
            inputMode="decimal"
            value={minPayment}
            placeholder="120"
            onChange={(e) => setMinPayment(e.target.value)}
          />
        </label>
      </div>
      <button type="submit" className="btn primary">
        Add to Baggage Claim
      </button>
    </form>
  )
}
