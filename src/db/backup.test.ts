import { describe, expect, it } from 'vitest'
import { BackupError, parseBackup } from './backup'
import { readPrefs } from './prefs'

const NOW = '2026-10-25T12:00:00.000Z'

// A trimmed export from the original prototype (runway.v2), amounts in dollars.
const prototypeBackup = {
  v: 2,
  terms: [
    {
      id: 'abc1234',
      name: 'Fall 2026',
      start: '2026-08-24',
      end: '2026-12-14',
      cushion: 200,
      lumps: [{ id: 'l1', label: 'Fall loan disbursement', amount: 6000, date: '2026-08-20' }],
      incomes: [{ id: 'i1', label: 'Campus job', amount: 220, freq: 'biweekly' }],
      bigCosts: [{ id: 'b1', label: 'Tuition', amount: 4200 }],
      recurCosts: [{ id: 'r1', label: 'Groceries', amount: 60.5, freq: 'weekly' }],
    },
  ],
  activeTermId: 'abc1234',
  log: { '2026-08-24': '120', '2026-08-31': '', '2026-09-07': '95.25' },
  debts: [
    {
      id: 'd1',
      name: 'Unsub',
      type: 'fed-unsub',
      balance: 5500,
      apr: 6.39,
      comp: 'daily',
      min: 60,
    },
  ],
  mode: 'repay',
  inSchool: { weeks: 80, contrib: 25 },
  repay: { extra: 100, strat: 'snowball' },
  level: 'ytd',
  savings: {
    emergency: { target: 1000, balance: 250, recur: 10 },
    goals: [{ id: 'g1', name: 'Car', target: 3000, balance: 400, recur: 15 }],
  },
}

describe('parseBackup', () => {
  it('converts a prototype backup to cents and the new layout', () => {
    const tables = parseBackup(JSON.stringify(prototypeBackup), NOW)

    expect(tables.terms).toEqual([
      expect.objectContaining({ id: 'abc1234', name: 'Fall 2026', cushionCents: 20000 }),
    ])
    expect(
      tables.budgetItems.map((i) => [i.kind, i.label, i.amountCents, i.date, i.frequency]),
    ).toEqual([
      ['lump', 'Fall loan disbursement', 600000, '2026-08-20', null],
      ['income', 'Campus job', 22000, null, 'biweekly'],
      ['bigCost', 'Tuition', 420000, null, null],
      ['recurCost', 'Groceries', 6050, null, 'weekly'],
    ])
    expect(tables.weekLogs.map((w) => [w.weekStart, w.spentCents])).toEqual([
      ['2026-08-24', 12000],
      ['2026-09-07', 9525],
    ])
    expect(tables.debts[0]).toMatchObject({
      type: 'fed-unsub',
      balanceCents: 550000,
      aprPercent: 6.39,
      compounding: 'daily',
      minPaymentCents: 6000,
    })
    expect(
      tables.envelopes.map((e) => [
        e.kind,
        e.name,
        e.targetCents,
        e.balanceCents,
        e.autoSaveWeeklyCents,
      ]),
    ).toEqual([
      ['emergency', 'Emergency reserve', 100000, 25000, 1000],
      ['want', 'Car', 300000, 40000, 1500],
    ])
    expect(readPrefs(tables.prefs)).toEqual({
      activeTermId: 'abc1234',
      loanMode: 'repay',
      inSchoolWeeks: 80,
      inSchoolWeeklyCents: 2500,
      repayExtraMonthlyCents: 10000,
      repayStrategy: 'snowball',
      runwayLevel: 'year',
    })
    const all = Object.values(tables).flat()
    expect(all.every((r) => r.createdAt === NOW && r.deletedAt === null && r.id)).toBe(true)
  })

  it('reads its own export format back', () => {
    const tables = parseBackup(JSON.stringify(prototypeBackup), NOW)
    const backup = { app: 'runway', format: 1, exportedAt: NOW, tables }
    expect(parseBackup(JSON.stringify(backup))).toEqual(tables)
  })

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('not json')).toThrow(BackupError)
    expect(() => parseBackup('{"hello":"world"}')).toThrow(BackupError)
  })
})
