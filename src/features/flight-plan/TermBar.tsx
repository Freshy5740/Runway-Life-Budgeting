import { MoneyInput } from '../../components/MoneyInput'
import { TextInput } from '../../components/TextInput'
import { useToast } from '../../components/toast'
import { useData } from '../../app/plan'
import { db, type TermRecord } from '../../db/db'
import { setPref } from '../../db/prefs'
import { addRecord, removeRecord, restoreRecord, updateRecord } from '../../db/records'
import { nextTermDates } from '../../db/seed'
import { seasonName } from '../../lib/dates'

/** Pick, name, date and add/delete terms. */
export function TermBar({ term, terms }: { term: TermRecord | null; terms: TermRecord[] }) {
  const toast = useToast()
  const { budgetItems } = useData()

  async function addTerm() {
    const latestEnd = terms.reduce<string | null>(
      (end, t) => (end && end > t.end ? end : t.end),
      null,
    )
    const { start, end } = nextTermDates(latestEnd)
    const name = seasonName(start)
    const id = await addRecord(db.terms, { name, start, end, cushionCents: 0 })
    await setPref('activeTermId', id)
    toast(`Added ${name}. Rename it or change its dates here.`)
  }

  async function deleteTerm(doomed: TermRecord) {
    if (!window.confirm(`Delete "${doomed.name}" and everything planned in it?`)) return
    const itemIds = budgetItems.filter((item) => item.termId === doomed.id).map((item) => item.id)
    const fallback = terms.find((t) => t.id !== doomed.id)
    await db.transaction('rw', [db.terms, db.budgetItems, db.prefs], async () => {
      await removeRecord(db.terms, doomed.id)
      for (const id of itemIds) await removeRecord(db.budgetItems, id)
      await setPref('activeTermId', fallback?.id ?? null)
    })
    toast(`Deleted ${doomed.name}.`, {
      actionLabel: 'Undo',
      onAction: () =>
        void db.transaction('rw', [db.terms, db.budgetItems, db.prefs], async () => {
          await restoreRecord(db.terms, doomed.id)
          for (const id of itemIds) await restoreRecord(db.budgetItems, id)
          await setPref('activeTermId', doomed.id)
        }),
    })
  }

  if (!term) {
    return (
      <section className="card">
        <p className="empty">No terms yet. A term is a semester or quarter you budget for.</p>
        <button type="button" className="btn primary" onClick={addTerm}>
          + Add a term
        </button>
      </section>
    )
  }

  return (
    <section className="card term-bar" aria-label="Term">
      <div className="term-fields">
        <label className="field">
          <span>Term</span>
          <select value={term.id} onChange={(e) => void setPref('activeTermId', e.target.value)}>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Name</span>
          <TextInput
            value={term.name}
            onCommit={(name) => {
              if (name.trim()) void updateRecord(db.terms, term.id, { name: name.trim() })
            }}
          />
        </label>
        <label className="field">
          <span>Starts</span>
          <input
            type="date"
            value={term.start}
            onChange={(e) =>
              e.target.value && void updateRecord(db.terms, term.id, { start: e.target.value })
            }
          />
        </label>
        <label className="field">
          <span>Ends</span>
          <input
            type="date"
            value={term.end}
            min={term.start}
            onChange={(e) =>
              e.target.value && void updateRecord(db.terms, term.id, { end: e.target.value })
            }
          />
        </label>
        <label className="field">
          <span>Cushion to keep</span>
          <MoneyInput
            placeholder="0"
            valueCents={term.cushionCents || null}
            onChangeCents={(cents) =>
              void updateRecord(db.terms, term.id, { cushionCents: cents ?? 0 })
            }
          />
        </label>
      </div>
      <div className="term-actions">
        <button type="button" className="btn sm" onClick={addTerm}>
          + Add term
        </button>
        <button
          type="button"
          className="btn sm ghost"
          disabled={terms.length <= 1}
          title={terms.length <= 1 ? 'Keep at least one term' : undefined}
          onClick={() => void deleteTerm(term)}
        >
          Delete term
        </button>
      </div>
    </section>
  )
}
