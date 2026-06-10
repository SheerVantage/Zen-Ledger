import { db, type SyncMetadata } from './database';

export async function addToSyncQueue(
  table: string,
  recordId: string,
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    table,
    recordId,
    operation,
    timestamp: new Date().toISOString(),
    synced: false
  });
}

export async function getPendingSyncItems(): Promise<SyncMetadata[]> {
  return db.syncQueue.filter(item => item.synced === false).toArray();
}

export async function markAsSynced(ids: string[]): Promise<void> {
  await db.syncQueue.where('id').anyOf(ids).modify({ synced: true });
}

export async function clearSyncedItems(): Promise<void> {
  await db.syncQueue.filter(item => item.synced === true).delete();
}
