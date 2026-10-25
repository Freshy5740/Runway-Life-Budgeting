import Dexie, { type EntityTable } from 'dexie'

interface MetaRecord {
  key: string
  value: string
}

/**
 * The on-device database. Schema changes always add a new db.version(n) with an upgrade;
 * never edit a version that has shipped, or existing users' data won't migrate.
 */
export const db = new Dexie('runway') as Dexie & {
  meta: EntityTable<MetaRecord, 'key'>
}

db.version(1).stores({
  meta: 'key',
})

/** When this device first opened Runway (ISO string), recorded on the first visit. */
export async function getFirstOpened(): Promise<string> {
  return db.transaction('rw', db.meta, async () => {
    const existing = await db.meta.get('firstOpened')
    if (existing) return existing.value
    const now = new Date().toISOString()
    await db.meta.put({ key: 'firstOpened', value: now })
    return now
  })
}
