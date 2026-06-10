import { db } from './database';
import type { Transaction } from '$lib/stores/transactions';
import { addToSyncQueue } from './sync-queue';

export async function getAllTransactions(): Promise<Transaction[]> {
  return db.transactions.toArray();
}

export async function getTransactionById(id: string): Promise<Transaction | undefined> {
  return db.transactions.get(id);
}

export async function addTransaction(t: Transaction): Promise<void> {
  await db.transactions.add(t);
  await addToSyncQueue('transactions', t.id, 'create');
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
  await db.transactions.update(id, updates);
  await addToSyncQueue('transactions', id, 'update');
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id);
  await addToSyncQueue('transactions', id, 'delete');
}

export async function bulkAddTransactions(transactions: Transaction[]): Promise<void> {
  await db.transactions.bulkAdd(transactions);
}
