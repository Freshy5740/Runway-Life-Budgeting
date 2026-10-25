import { useState, type FormEvent } from 'react'
import { useToast } from '../../components/toast'
import { progressPercent } from '../../engines/savings'
import { db, type EnvelopeRecord } from '../../db/db'
import { removeRecord, restoreRecord, updateRecord } from '../../db/records'
import { formatMoney, parseMoney } from '../../lib/money'

function EnvelopeIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true" className="envelope-icon">
      <rect
        x="1"
        y="1"
        width="16"
        height="12"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M1.8 2.2 9 7.6l7.2-5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A savings envelope (or the emergency fund): progress, and a box to drop money in. */
export function EnvelopeCard({ envelope }: { envelope: EnvelopeRecord }) {
  const toast = useToast()
  const [tip, setTip] = useState('')
  const isWant = envelope.kind === 'want'
  const percent = progressPercent(envelope)
  const reached = envelope.targetCents > 0 && envelope.balanceCents >= envelope.targetCents

  async function drop(event: FormEvent) {
    event.preventDefault()
    const amount = parseMoney(tip)
    if (!amount) return
    const before = envelope.balanceCents
    await updateRecord(db.envelopes, envelope.id, { balanceCents: before + amount })
    setTip('')
    toast(
      `Dropped ${formatMoney(amount, { showCents: amount % 100 !== 0 })} in ${envelope.name}.`,
      {
        actionLabel: 'Undo',
        onAction: () => void updateRecord(db.envelopes, envelope.id, { balanceCents: before }),
      },
    )
  }

  async function remove() {
    await removeRecord(db.envelopes, envelope.id)
    toast(`Removed ${envelope.name}.`, {
      actionLabel: 'Undo',
      onAction: () => void restoreRecord(db.envelopes, envelope.id),
    })
  }

  return (
    <article className={`envelope ${envelope.kind}`}>
      <header>
        {isWant && <EnvelopeIcon />}
        <h3>{envelope.name}</h3>
        {reached && <span className="pill in">Goal reached</span>}
        {isWant && (
          <button
            type="button"
            className="btn ghost icon-btn"
            aria-label={`Remove ${envelope.name}`}
            onClick={remove}
          >
            ×
          </button>
        )}
      </header>
      <div
        className="progress"
        role="progressbar"
        aria-label={`${envelope.name} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div style={{ width: `${percent}%` }} />
      </div>
      <div className="envelope-numbers">
        <span>
          <b>{formatMoney(envelope.balanceCents)}</b> saved
        </span>
        <span>
          {percent}% of <b>{formatMoney(envelope.targetCents)}</b>
        </span>
      </div>
      <form className="envelope-actions" onSubmit={drop}>
        <input
          className="input"
          inputMode="decimal"
          placeholder="$ tip"
          aria-label={`Amount to drop in ${envelope.name}`}
          value={tip}
          onChange={(e) => setTip(e.target.value)}
        />
        <button type="submit" className={`btn sm ${isWant ? 'gold' : 'primary'}`}>
          Drop in
        </button>
        {envelope.autoSaveWeeklyCents > 0 && (
          <span className="envelope-auto">auto {formatMoney(envelope.autoSaveWeeklyCents)}/wk</span>
        )}
      </form>
    </article>
  )
}
