import { db } from './database';
import type { Purpose } from '$lib/stores/purposes';
import { addToSyncQueue } from './sync-queue';

export async function getAllPurposes(): Promise<Purpose[]> {
  return db.purposes.toArray();
}

export async function getPurposeById(id: string): Promise<Purpose | undefined> {
  return db.purposes.get(id);
}

export async function addPurpose(p: Purpose): Promise<void> {
  await db.purposes.add(p);
  await addToSyncQueue('purposes', p.id, 'create');
}

export async function updatePurpose(id: string, updates: Partial<Purpose>): Promise<void> {
  await db.purposes.update(id, updates);
  await addToSyncQueue('purposes', id, 'update');
}

export async function deletePurpose(id: string): Promise<void> {
  await db.purposes.delete(id);
  await addToSyncQueue('purposes', id, 'delete');
}

export async function bulkAddPurposes(purposes: Purpose[]): Promise<void> {
  await db.purposes.bulkAdd(purposes);
}
