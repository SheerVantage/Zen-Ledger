import { db } from './database';
import type { Party } from '$lib/stores/parties';
import { addToSyncQueue } from './sync-queue';

export async function getAllParties(): Promise<Party[]> {
  return db.parties.toArray();
}

export async function getPartyById(id: string): Promise<Party | undefined> {
  return db.parties.get(id);
}

export async function addParty(p: Party): Promise<void> {
  await db.parties.add(p);
  await addToSyncQueue('parties', p.id, 'create');
}

export async function updateParty(id: string, updates: Partial<Party>): Promise<void> {
  await db.parties.update(id, updates);
  await addToSyncQueue('parties', id, 'update');
}

export async function deleteParty(id: string): Promise<void> {
  await db.parties.delete(id);
  await addToSyncQueue('parties', id, 'delete');
}

export async function bulkAddParties(parties: Party[]): Promise<void> {
  await db.parties.bulkAdd(parties);
}
