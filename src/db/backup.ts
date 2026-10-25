import { DEBT_TYPES, type DebtType } from '../engines/loans'
import type { Frequency, RunwayLevel } from '../engines/budget'
import { toCents } from '../lib/money'
import {
  db,
  userTables,
  type BudgetItemRecord,
  type DebtRecord,
  type EnvelopeRecord,
  type PrefRecord,
  type SyncFields,
  type TermRecord,
  type WeekLogRecord,
} from './db'
import type { Prefs } from './prefs'
import { newRecord } from './records'
import { DEFAULT_EMERGENCY_FUND } from './seed'

export interface BackupTables {
  terms: TermRecord[]
  budgetItems: BudgetItemRecord[]
  weekLogs: WeekLogRecord[]
  debts: DebtRecord[]
  envelopes: EnvelopeRecord[]
  prefs: PrefRecord[]
}

export interface RunwayBackup {
  app: 'runway'
  format: 1
  exportedAt: string
  tables: BackupTables
}

const TABLE_NAMES = ['terms', 'budgetItems', 'weekLogs', 'debts', 'envelopes', 'prefs'] as const

export class BackupError extends Error {}

export async function exportBackup(): Promise<RunwayBackup> {
  const [terms, budgetItems, weekLogs, debts, envelopes, prefs] = await Promise.all(
    userTables.map((table) => table.toArray()),
  )
  return {
    app: 'runway',
    format: 1,
    exportedAt: new Date().toISOString(),
    tables: { terms, budgetItems, weekLogs, debts, envelopes, prefs } as BackupTables,
  }
}

/** Reads a Runway backup, or a backup exported from the original single-file prototype. */
export function parseBackup(text: string, now = new Date().toISOString()): BackupTables {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new BackupError("That file isn't a Runway backup (it isn't valid JSON).")
  }
  if (isRecord(data) && data.app === 'runway' && isRecord(data.tables)) {
    const tables = data.tables
    return Object.fromEntries(
      TABLE_NAMES.map((name) => [
        name,
        (Array.isArray(tables[name]) ? tables[name] : []).filter(
          (row: unknown) => isRecord(row) && typeof row.id === 'string',
        ),
      ]),
    ) as unknown as BackupTables
  }
  if (isRecord(data) && Array.isArray(data.terms) && isRecord(data.savings)) {
    return convertPrototypeBackup(data, now)
  }
  throw new BackupError("That file isn't a Runway backup.")
}

/** Replaces everything on this device with the backup's contents. */
export async function restoreBackup(tables: BackupTables): Promise<void> {
  await db.transaction('rw', [...userTables, db.meta], async () => {
    await Promise.all(userTables.map((table) => table.clear()))
    await db.terms.bulkPut(tables.terms)
    await db.budgetItems.bulkPut(tables.budgetItems)
    await db.weekLogs.bulkPut(tables.weekLogs)
    await db.debts.bulkPut(tables.debts)
    await db.envelopes.bulkPut(tables.envelopes)
    await db.prefs.bulkPut(tables.prefs)
    if (!tables.envelopes.some((e) => e.kind === 'emergency' && !e.deletedAt)) {
      await db.envelopes.add(newRecord(DEFAULT_EMERGENCY_FUND))
    }
    await db.meta.put({ key: 'seeded', value: new Date().toISOString() })
  })
}

// ---------- the original prototype's backup format (runway.v2, dollars) ----------

type Loose = Record<string, unknown>

const isRecord = (value: unknown): value is Loose =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const list = (value: unknown): Loose[] => (Array.isArray(value) ? value.filter(isRecord) : [])
const text = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback
const dollars = (value: unknown): number => {
  const n = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(n) ? n : 0
}
const cents = (value: unknown) => toCents(dollars(value))
const frequency = (value: unknown): Frequency =>
  value === 'biweekly' || value === 'monthly' ? value : 'weekly'

export function convertPrototypeBackup(proto: Loose, now: string): BackupTables {
  const stamp = (id?: unknown): SyncFields => ({
    id: typeof id === 'string' && id ? id : crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  })

  const terms: TermRecord[] = []
  const budgetItems: BudgetItemRecord[] = []
  for (const t of list(proto.terms)) {
    const term: TermRecord = {
      ...stamp(t.id),
      name: text(t.name, 'Term'),
      start: text(t.start),
      end: text(t.end),
      cushionCents: cents(t.cushion),
    }
    terms.push(term)
    const add = (kind: BudgetItemRecord['kind'], row: Loose, extra: Partial<BudgetItemRecord>) =>
      budgetItems.push({
        ...stamp(row.id),
        termId: term.id,
        kind,
        label: text(row.label),
        amountCents: cents(row.amount),
        date: null,
        frequency: null,
        ...extra,
      })
    for (const l of list(t.lumps)) add('lump', l, { date: text(l.date, term.start) })
    for (const i of list(t.incomes)) add('income', i, { frequency: frequency(i.freq) })
    for (const c of list(t.bigCosts)) add('bigCost', c, {})
    for (const c of list(t.recurCosts)) add('recurCost', c, { frequency: frequency(c.freq) })
  }

  const log = isRecord(proto.log) ? proto.log : {}
  const weekLogs: WeekLogRecord[] = Object.entries(log)
    .filter(([, spent]) => spent !== '' && spent !== null && spent !== undefined)
    .map(([weekStart, spent]) => ({ ...stamp(), weekStart, spentCents: cents(spent) }))

  const debts: DebtRecord[] = list(proto.debts).map((d) => ({
    ...stamp(d.id),
    name: text(d.name, 'Loan'),
    type: (text(d.type) in DEBT_TYPES ? d.type : 'other') as DebtType,
    balanceCents: cents(d.balance),
    aprPercent: dollars(d.apr),
    compounding: d.comp === 'daily' ? 'daily' : 'monthly',
    minPaymentCents: cents(d.min),
  }))

  const savings = isRecord(proto.savings) ? proto.savings : {}
  const emergency = isRecord(savings.emergency) ? savings.emergency : {}
  const envelopes: EnvelopeRecord[] = [
    {
      ...stamp(),
      kind: 'emergency',
      name: 'Emergency reserve',
      targetCents: cents(emergency.target ?? 1000),
      balanceCents: cents(emergency.balance),
      autoSaveWeeklyCents: cents(emergency.recur),
    },
    ...list(savings.goals).map((g): EnvelopeRecord => ({
      ...stamp(g.id),
      kind: 'want',
      name: text(g.name, 'Envelope'),
      targetCents: cents(g.target),
      balanceCents: cents(g.balance),
      autoSaveWeeklyCents: cents(g.recur),
    })),
  ]

  const inSchool = isRecord(proto.inSchool) ? proto.inSchool : {}
  const repay = isRecord(proto.repay) ? proto.repay : {}
  const level = text(proto.level, 'week')
  const prefValues: Partial<Prefs> = {
    activeTermId: text(proto.activeTermId) || terms[0]?.id || null,
    loanMode: proto.mode === 'repay' ? 'repay' : 'school',
    inSchoolWeeks: Math.max(1, Math.round(dollars(inSchool.weeks ?? 80))),
    inSchoolWeeklyCents: cents(inSchool.contrib ?? 25),
    repayExtraMonthlyCents: cents(repay.extra ?? 100),
    repayStrategy:
      repay.strat === 'snowball' || repay.strat === 'minimum' ? repay.strat : 'avalanche',
    runwayLevel: (level === 'ytd'
      ? 'year'
      : ['week', 'month', 'term'].includes(level)
        ? level
        : 'week') as RunwayLevel,
  }
  const prefs: PrefRecord[] = Object.entries(prefValues).map(([id, value]) => ({
    ...stamp(id),
    value,
  }))

  return { terms, budgetItems, weekLogs, debts, envelopes, prefs }
}
