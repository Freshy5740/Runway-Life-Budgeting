import Dexie, { type EntityTable } from 'dexie'
import type { BudgetItemKind, Frequency } from '../engines/budget'
import type { Compounding, DebtType } from '../engines/loans'
import type { IsoDate } from '../lib/dates'
import type { Cents } from '../lib/money'

/** Fields every synced record carries. Deleting sets deletedAt instead of erasing the row. */
export interface SyncFields {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface TermRecord extends SyncFields {
  name: string
  start: IsoDate
  end: IsoDate
  cushionCents: Cents
}

export interface BudgetItemRecord extends SyncFields {
  termId: string
  kind: BudgetItemKind
  label: string
  amountCents: Cents
  /** One-time arrivals only. */
  date: IsoDate | null
  /** Recurring arrivals and departures only. */
  frequency: Frequency | null
}

export interface WeekLogRecord extends SyncFields {
  weekStart: IsoDate
  spentCents: Cents
}

export interface DebtRecord extends SyncFields {
  name: string
  type: DebtType
  balanceCents: Cents
  aprPercent: number
  compounding: Compounding
  minPaymentCents: Cents
}

export type EnvelopeKind = 'emergency' | 'want'

export interface EnvelopeRecord extends SyncFields {
  kind: EnvelopeKind
  name: string
  targetCents: Cents
  balanceCents: Cents
  autoSaveWeeklyCents: Cents
}

/** A user setting; its id is the setting's name so it merges cleanly across devices. */
export interface PrefRecord extends SyncFields {
  value: unknown
}

/** Device-only bookkeeping (never synced). */
interface MetaRecord {
  key: string
  value: unknown
}

/**
 * The on-device database. Schema changes always add a new db.version(n) with an upgrade;
 * never edit a version that has shipped, or existing users' data won't migrate.
 */
export const db = new Dexie('runway') as Dexie & {
  meta: EntityTable<MetaRecord, 'key'>
  terms: EntityTable<TermRecord, 'id'>
  budgetItems: EntityTable<BudgetItemRecord, 'id'>
  weekLogs: EntityTable<WeekLogRecord, 'id'>
  debts: EntityTable<DebtRecord, 'id'>
  envelopes: EntityTable<EnvelopeRecord, 'id'>
  prefs: EntityTable<PrefRecord, 'id'>
}

db.version(1).stores({
  meta: 'key',
})

db.version(2).stores({
  terms: 'id',
  budgetItems: 'id, termId',
  weekLogs: 'id, &weekStart',
  debts: 'id',
  envelopes: 'id, kind',
  prefs: 'id',
})

/** The tables that hold the user's plan (everything that gets exported and, later, synced). */
export const userTables = [
  db.terms,
  db.budgetItems,
  db.weekLogs,
  db.debts,
  db.envelopes,
  db.prefs,
] as const
