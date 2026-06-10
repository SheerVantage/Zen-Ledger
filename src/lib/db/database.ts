import Dexie, { type Table } from 'dexie';
import type { Transaction } from '$lib/stores/transactions';
import type { Purpose } from '$lib/stores/purposes';
import type { Party } from '$lib/stores/parties';
import type { Fund } from '$lib/stores/funds';
import type { SettingsState } from '$lib/stores/settings';

export interface SyncMetadata {
  id: string;
  table: string;
  recordId: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: string;
  synced: boolean;
  userId?: string;
}

export class ZenLedgerDB extends Dexie {
  transactions!: Table<Transaction>;
  purposes!: Table<Purpose>;
  parties!: Table<Party>;
  funds!: Table<Fund>;
  settings!: Table<SettingsState>;
  syncQueue!: Table<SyncMetadata>;

  constructor() {
    super('zen-ledger-db');
    this.version(1).stores({
      transactions: 'id, purposeId, date, partyId, fundId, linkedTo, createdAt',
      purposes: 'id, name, accountType',
      parties: 'id, name',
      funds: 'id, name',
      settings: 'id',
      syncQueue: '++id, table, recordId, timestamp, synced'
    });
  }
}

export const db = new ZenLedgerDB();
