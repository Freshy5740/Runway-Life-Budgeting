import type { EntityTable, IDType } from 'dexie'
import { db, type SyncFields } from './db'

const stamp = () => new Date().toISOString()

export function newRecord<T extends object>(fields: T): T & SyncFields {
  const now = stamp()
  return { ...fields, id: crypto.randomUUID(), createdAt: now, updatedAt: now, deletedAt: null }
}

export const alive = <T extends SyncFields>(rows: T[]): T[] => rows.filter((row) => !row.deletedAt)

type Fields<T> = Partial<Omit<T, keyof SyncFields>>

export async function addRecord<T extends SyncFields>(
  table: EntityTable<T, 'id'>,
  fields: Omit<T, keyof SyncFields>,
): Promise<string> {
  const record = newRecord(fields) as unknown as T
  await table.add(record)
  void keepDataPersistent()
  return record.id
}

export async function updateRecord<T extends SyncFields>(
  table: EntityTable<T, 'id'>,
  id: string,
  changes: Fields<T>,
): Promise<void> {
  await table.update(id as IDType<T, 'id'>, { ...changes, updatedAt: stamp() } as never)
}

/** Marks a record deleted (kept so the deletion can sync and be undone). */
export async function removeRecord<T extends SyncFields>(
  table: EntityTable<T, 'id'>,
  id: string,
): Promise<void> {
  const now = stamp()
  await table.update(id as IDType<T, 'id'>, { deletedAt: now, updatedAt: now } as never)
}

export async function restoreRecord<T extends SyncFields>(
  table: EntityTable<T, 'id'>,
  id: string,
): Promise<void> {
  await table.update(id as IDType<T, 'id'>, { deletedAt: null, updatedAt: stamp() } as never)
}

/** Records (or clears, with null) what was spent in a week. */
export async function setWeekSpent(weekStart: string, spentCents: number | null): Promise<void> {
  await db.transaction('rw', db.weekLogs, async () => {
    const existing = await db.weekLogs.where('weekStart').equals(weekStart).first()
    if (spentCents === null) {
      if (existing && !existing.deletedAt) await removeRecord(db.weekLogs, existing.id)
    } else if (existing) {
      await updateRecord(db.weekLogs, existing.id, { spentCents })
      if (existing.deletedAt) await restoreRecord(db.weekLogs, existing.id)
    } else {
      await db.weekLogs.add(newRecord({ weekStart, spentCents }))
    }
  })
}

let persistenceRequested = false

/**
 * Asks the browser not to clear Runway's data when the device runs low on space. Asked once, after
 * the user first saves something, so the request (a prompt in some browsers) has context.
 */
async function keepDataPersistent(): Promise<void> {
  if (persistenceRequested || !navigator.storage?.persist) return
  persistenceRequested = true
  if (!(await navigator.storage.persisted())) await navigator.storage.persist()
}
