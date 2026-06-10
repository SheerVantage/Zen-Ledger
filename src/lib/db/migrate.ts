import { browser } from '$app/environment';
import { db } from './database';
import { bulkAddTransactions } from './transactions';
import { bulkAddPurposes } from './purposes';
import { bulkAddParties } from './parties';

const STORAGE_KEYS = {
  transactions: 'zen_ledger_v1',
  purposes: 'zen_ledger_purposes_v1',
  parties: 'zen_ledger_parties_v1',
  settings: 'zen_ledger_settings_v1'
};

export async function migrateFromLocalStorage(): Promise<boolean> {
  if (!browser) return false;
  
  // Check if migration already done
  const txCount = await db.transactions.count();
  if (txCount > 0) return false;
  
  console.log('Starting localStorage migration...');
  
  // Migrate transactions
  const txData = localStorage.getItem(STORAGE_KEYS.transactions);
  if (txData) {
    try {
      const transactions = JSON.parse(txData);
      if (Array.isArray(transactions) && transactions.length > 0) {
        await bulkAddTransactions(transactions);
        console.log(`Migrated ${transactions.length} transactions`);
      }
    } catch (e) {
      console.error('Failed to migrate transactions:', e);
    }
  }
  
  // Migrate purposes
  const purposesData = localStorage.getItem(STORAGE_KEYS.purposes);
  if (purposesData) {
    try {
      const purposes = JSON.parse(purposesData);
      if (Array.isArray(purposes) && purposes.length > 0) {
        await bulkAddPurposes(purposes);
        console.log(`Migrated ${purposes.length} purposes`);
      }
    } catch (e) {
      console.error('Failed to migrate purposes:', e);
    }
  }
  
  // Migrate parties
  const partiesData = localStorage.getItem(STORAGE_KEYS.parties);
  if (partiesData) {
    try {
      const parties = JSON.parse(partiesData);
      if (Array.isArray(parties) && parties.length > 0) {
        await bulkAddParties(parties);
        console.log(`Migrated ${parties.length} parties`);
      }
    } catch (e) {
      console.error('Failed to migrate parties:', e);
    }
  }
  
  console.log('Migration complete');
  return true;
}

/**
 * Migrate existing transactions from old `account` field to `fundId`.
 * Converts account strings like "cash", "bank", "bkash" to fundId references.
 */
export async function migrateAccountToFundId(): Promise<void> {
  if (!browser) return;

  const transactions = await db.transactions.toArray();
  let migrated = 0;

  for (const tx of transactions) {
    const updates: Record<string, any> = {};

    // Convert old `account` field to `fundId`
    if ((tx as any).account && !tx.fundId) {
      updates.fundId = (tx as any).account;
    }

    // Convert old `toAccount` field to `toFundId`
    if ((tx as any).toAccount && !tx.toFundId) {
      updates.toFundId = (tx as any).toAccount;
    }

    if (Object.keys(updates).length > 0) {
      await db.transactions.update(tx.id, updates);
      migrated++;
    }
  }

  if (migrated > 0) {
    console.log(`Migrated ${migrated} transactions from account to fundId`);
  }
}

/**
 * Clean up old categories data from settings table.
 */
export async function cleanupCategoriesData(): Promise<void> {
  if (!browser) return;

  const settings = await db.settings.get('categories');
  if (settings) {
    await db.settings.delete('categories');
    console.log('Cleaned up old categories data');
  }
}

export async function isMigrationComplete(): Promise<boolean> {
  const txCount = await db.transactions.count();
  return txCount > 0;
}
