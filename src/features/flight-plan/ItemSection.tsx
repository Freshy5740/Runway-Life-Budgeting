import { useState, type FormEvent } from 'react'
import { useToast } from '../../components/toast'
import { perWeek, type BudgetItemKind, type Frequency } from '../../engines/budget'
import { db, type BudgetItemRecord, type TermRecord } from '../../db/db'
import { addRecord, removeRecord, restoreRecord } from '../../db/records'
import { formatDate } from '../../lib/dates'
import { formatMoney, parseMoney } from '../../lib/money'

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 wks' },
  { value: 'monthly', label: 'Monthly' },
]

const frequencyText = (f: Frequency | null) =>
  f === 'biweekly' ? 'every 2 wks' : f === 'monthly' ? 'monthly' : 'weekly'

const SECTIONS: Record<
  BudgetItemKind,
  {
    chip: string
    title: string
    labelName: string
    labelHint: string
    amountName: string
    amountHint: string
    button: 'primary' | 'gold'
    empty: string
  }
> = {
  lump: {
    chip: 'one-time',
    title: 'Disbursements & deposits',
    labelName: 'Source',
    labelHint: 'Fall loan disbursement',
    amountName: 'Amount',
    amountHint: '6000',
    button: 'primary',
    empty: 'No disbursements yet. A past date means money you already have.',
  },
  income: {
    chip: 'recurring',
    title: 'Paychecks & stipends',
    labelName: 'Source',
    labelHint: 'Campus job',
    amountName: 'Amount',
    amountHint: '220',
    button: 'primary',
    empty: 'No paychecks yet.',
  },
  bigCost: {
    chip: 'wave 1 · big chunks',
    title: 'Tuition, books, meal plan, campus housing',
    labelName: 'Cost',
    labelHint: 'Tuition',
    amountName: 'Amount this term',
    amountHint: '9000',
    button: 'gold',
    empty: 'No big-ticket costs yet.',
  },
  recurCost: {
    chip: 'wave 2 · ongoing',
    title: 'Groceries, eating out, off-campus rent',
    labelName: 'Cost',
    labelHint: 'Groceries',
    amountName: 'Amount',
    amountHint: '60',
    button: 'gold',
    empty: 'No ongoing costs yet.',
  },
}

/** How a row reads: its pill, the detail line, and the amount column. */
function describe(item: BudgetItemRecord): { pill: string; meta: string; amount: string } {
  const amount = formatMoney(item.amountCents)
  const weekly = formatMoney(item.amountCents * perWeek(item.frequency ?? 'weekly'))
  switch (item.kind) {
    case 'lump':
      return { pill: 'lump', meta: `received ${formatDate(item.date ?? '')}`, amount }
    case 'income':
      return {
        pill: 'in',
        meta: `${amount} ${frequencyText(item.frequency)}`,
        amount: `${weekly}/wk`,
      }
    case 'bigCost':
      return { pill: 'out', meta: 'one-time this term', amount: `−${amount}` }
    case 'recurCost':
      return {
        pill: 'out',
        meta: `${amount} ${frequencyText(item.frequency)}`,
        amount: `−${weekly}/wk`,
      }
  }
}

function ItemRow({ item }: { item: BudgetItemRecord }) {
  const toast = useToast()
  const view = describe(item)

  async function remove() {
    await removeRecord(db.budgetItems, item.id)
    toast(`Removed ${item.label}.`, {
      actionLabel: 'Undo',
      onAction: () => void restoreRecord(db.budgetItems, item.id),
    })
  }

  return (
    <li>
      <span className={`pill ${view.pill}`}>{view.pill}</span>
      <span className="name">
        {item.label}
        <span className="meta">{view.meta}</span>
      </span>
      <span className={`amount ${view.pill}`}>{view.amount}</span>
      <button
        type="button"
        className="btn ghost icon-btn"
        aria-label={`Remove ${item.label}`}
        onClick={remove}
      >
        ×
      </button>
    </li>
  )
}

interface ItemSectionProps {
  kind: BudgetItemKind
  term: TermRecord
  items: BudgetItemRecord[]
}

/** One list on Flight Plan (e.g. paychecks) with its add form. */
export function ItemSection({ kind, term, items }: ItemSectionProps) {
  const config = SECTIONS[kind]
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('weekly')
  const hasDate = kind === 'lump'
  const hasFrequency = kind === 'income' || kind === 'recurCost'
  const formId = `add-${kind}`

  async function add(event: FormEvent) {
    event.preventDefault()
    const amountCents = parseMoney(amount)
    if (!label.trim() || !amountCents) return
    await addRecord(db.budgetItems, {
      termId: term.id,
      kind,
      label: label.trim(),
      amountCents,
      date: hasDate ? date || term.start : null,
      frequency: hasFrequency ? frequency : null,
    })
    setLabel('')
    setAmount('')
    setDate('')
  }

  return (
    <>
      <h3 className="subhead">
        <span className="chip">{config.chip}</span> {config.title}
      </h3>
      <form
        id={formId}
        className={`add-row ${hasDate || hasFrequency ? '' : 'three'}`}
        onSubmit={add}
      >
        <label className="field">
          <span>{config.labelName}</span>
          <input
            value={label}
            placeholder={config.labelHint}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <label className="field">
          <span>{config.amountName}</span>
          <input
            inputMode="decimal"
            value={amount}
            placeholder={config.amountHint}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        {hasDate && (
          <label className="field">
            <span>Date received</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        )}
        {hasFrequency && (
          <label className="field">
            <span>How often</span>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="submit" className={`btn ${config.button}`}>
          Add
        </button>
      </form>
      {items.length ? (
        <ul className="items">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <p className="empty">{config.empty}</p>
      )}
    </>
  )
}
