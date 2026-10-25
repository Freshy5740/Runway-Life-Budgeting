import { useState, type FormEvent } from 'react'
import { Card, Note } from '../../components/Card'
import { MoneyInput } from '../../components/MoneyInput'
import { useData } from '../../app/plan'
import { weeklyAutoSave } from '../../engines/savings'
import { db } from '../../db/db'
import { addRecord, updateRecord } from '../../db/records'
import { formatMoney, parseMoney } from '../../lib/money'
import { EnvelopeCard } from './EnvelopeCard'
import './sky-miles.css'

function NewEnvelopeForm() {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [auto, setAuto] = useState('')

  async function add(event: FormEvent) {
    event.preventDefault()
    const targetCents = parseMoney(target)
    if (!name.trim() || !targetCents) return
    await addRecord(db.envelopes, {
      kind: 'want',
      name: name.trim(),
      targetCents,
      balanceCents: 0,
      autoSaveWeeklyCents: parseMoney(auto) ?? 0,
    })
    setName('')
    setTarget('')
    setAuto('')
  }

  return (
    <form className="add-row" onSubmit={add}>
      <label className="field">
        <span>Envelope</span>
        <input value={name} placeholder="Road-trip car" onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field">
        <span>Target</span>
        <input
          inputMode="decimal"
          value={target}
          placeholder="3000"
          onChange={(e) => setTarget(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Auto-save / wk</span>
        <input
          inputMode="decimal"
          value={auto}
          placeholder="15"
          onChange={(e) => setAuto(e.target.value)}
        />
      </label>
      <button type="submit" className="btn gold">
        Add
      </button>
    </form>
  )
}

export function SkyMiles() {
  const { envelopes } = useData()
  const emergency = envelopes.find((e) => e.kind === 'emergency')
  const wants = envelopes.filter((e) => e.kind === 'want')
  const weekly = weeklyAutoSave(envelopes)

  return (
    <>
      <div className="grid-2">
        <Card title="Emergency fund" hint="your reserve tank">
          {emergency && (
            <>
              <EnvelopeCard envelope={emergency} />
              <div className="fields two">
                <label className="field">
                  <span>Target to reach</span>
                  <MoneyInput
                    placeholder="1000"
                    valueCents={emergency.targetCents || null}
                    onChangeCents={(cents) =>
                      void updateRecord(db.envelopes, emergency.id, { targetCents: cents ?? 0 })
                    }
                  />
                </label>
                <label className="field">
                  <span>Auto-save / week</span>
                  <MoneyInput
                    placeholder="10"
                    valueCents={emergency.autoSaveWeeklyCents || null}
                    onChangeCents={(cents) =>
                      void updateRecord(db.envelopes, emergency.id, {
                        autoSaveWeeklyCents: cents ?? 0,
                      })
                    }
                  />
                </label>
              </div>
            </>
          )}
          <Note>
            A reserve of about one month of fixed costs keeps a flat tire or surprise fee from
            wrecking your week.
          </Note>
        </Card>
        <Card title="Envelopes" hint="savings for wants; drop in a tip anytime">
          <NewEnvelopeForm />
          {wants.length ? (
            <div className="envelopes">
              {wants.map((envelope) => (
                <EnvelopeCard key={envelope.id} envelope={envelope} />
              ))}
            </div>
          ) : (
            <p className="empty">No envelopes yet. Start one for a movie night or a car.</p>
          )}
        </Card>
      </div>
      <Card title="The tip jar" hint="how auto-save affects your week">
        <Note tone="gold">
          {weekly > 0 ? (
            <>
              Auto-save sets aside <b>{formatMoney(weekly)}/week</b> from your weekly budget in
              every term, so that money never counts as spendable. Drop it into your envelopes as
              you move it to savings, or set an envelope's auto-save to 0 to stop.
            </>
          ) : (
            <>
              No auto-save yet. Give an envelope a weekly amount to set it aside from your budget
              automatically, or drop in tips by hand whenever you have spare cash.
            </>
          )}
        </Note>
      </Card>
    </>
  )
}
