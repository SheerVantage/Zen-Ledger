import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { liveQuery } from 'dexie';
import { db } from '$lib/db/database';
import { purposes } from './purposes';
import { settings } from './settings';
import { addToSyncQueue } from '$lib/db/sync-queue';

export interface Transaction {
    id: string;
    narration: string;
    amount: number;
    purposeId: string;
    date: string; // YYYY-MM-DD
    partyId?: string;
    reverseOf?: string; // ID of the original transaction this settles (legacy)
    linkedTo?: string;  // ID of the original transaction this settles
    fundId?: string;    // Which fund this transaction affects (default: "cash")
    fromFundId?: string; // For transfers: source fund
    toFundId?: string;   // For transfers: destination fund
    status?: 'completed' | 'pending' | 'partial';
    isPassthrough?: boolean;
    prospectType?: 'expected_income' | 'expected_expense' | 'pipeline' | 'possible_repayment' | 'plan';
    confidence?: 'high' | 'medium' | 'low';
    expectedDate?: string; // ISO date
    createdAt: string;
    updatedAt: string;
}

const now = new Date().toISOString();

const initialTransactions: Transaction[] = [
    { id: '1', narration: 'Starbucks coffee with friends', amount: -4.50, purposeId: '1', date: '2026-02-28', createdAt: now, updatedAt: now },
    { id: '2', narration: 'Monthly Salary Deposit', amount: 3200.00, purposeId: '2', date: '2026-02-28', createdAt: now, updatedAt: now },
];

// Initialize default data if DB is empty
async function initializeDefaultData() {
    if (!browser) return;
    const count = await db.transactions.count();
    if (count === 0) {
        await db.transactions.bulkAdd(initialTransactions);
    }
}

// Run initialization on module load
if (browser) {
    initializeDefaultData();
}

// Create a writable store that syncs with Dexie
function createTransactionsStore() {
    const { subscribe, update, set } = writable<Transaction[]>([]);

    // Load initial data from Dexie
    if (browser) {
        db.transactions.toArray().then(data => {
            set(data);
            settings.recalculate(data, get(purposes));
        });
    }

    const _recalculate = (all: Transaction[]) => {
        settings.recalculate(all, get(purposes));
    };

    return {
        subscribe,
        addTransaction: async (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
            const id = Math.random().toString(36).substring(2, 9);
            const timestamp = new Date().toISOString();

            const allPurposes = await db.purposes.toArray();
            const purpose = allPurposes.find(p => p.id === t.purposeId);
            const accountType = purpose?.accountType || 'expense';

            let defaultStatus: Transaction['status'] = 'completed';
            if (['receivable', 'payable', 'prospect'].includes(accountType)) {
                defaultStatus = 'pending';
            }

            const newTransaction: Transaction = {
                fundId: 'cash',
                status: defaultStatus,
                isPassthrough: false,
                ...t,
                id,
                createdAt: timestamp,
                updatedAt: timestamp
            };

            await db.transactions.add(newTransaction);
            await addToSyncQueue('transactions', id, 'create');

            const allTransactions = await db.transactions.toArray();
            set(allTransactions);
            _recalculate(allTransactions);
            
            return id;
        },
        deleteTransaction: async (id: string) => {
            await db.transactions.delete(id);
            await addToSyncQueue('transactions', id, 'delete');

            const allTransactions = await db.transactions.toArray();
            set(allTransactions);
            _recalculate(allTransactions);
        },
        updateTransaction: async (id: string, updates: Partial<Transaction>) => {
            const timestamp = new Date().toISOString();
            await db.transactions.update(id, { ...updates, updatedAt: timestamp });
            await addToSyncQueue('transactions', id, 'update');

            const allTransactions = await db.transactions.toArray();
            set(allTransactions);
            _recalculate(allTransactions);
        },
        importData: async (data: Transaction[]) => {
            await db.transactions.clear();
            await db.transactions.bulkAdd(data);
            
            set(data);
            _recalculate(data);
        },
        settleTransaction: async (originalId: string, amount?: number) => {
            const allTransactions = await db.transactions.toArray();
            const original = allTransactions.find(t => t.id === originalId);
            if (!original) return;

            const allPurposes = await db.purposes.toArray();
            const originalPurpose = allPurposes.find(p => p.id === original.purposeId);
            const accountType = originalPurpose?.accountType || 'expense';

            // Find matching settlement purpose: receivable -> recovered, payable -> repaid
            const settlementType = accountType === 'receivable' ? 'recovered' : 'repaid';
            const settlementPurpose = allPurposes.find(p => p.accountType === settlementType);

            const settlementAmount = amount !== undefined ? amount : Math.abs(original.amount);
            const timestamp = new Date().toISOString();

            const settlement: Transaction = {
                id: Math.random().toString(36).substring(2, 9),
                narration: `Settlement: ${original.narration}`,
                amount: accountType === 'payable' ? -settlementAmount : settlementAmount,
                purposeId: settlementPurpose?.id || original.purposeId,
                partyId: original.partyId,
                date: new Date().toISOString().split('T')[0],
                linkedTo: originalId,
                fundId: original.fundId || 'cash',
                status: 'completed',
                createdAt: timestamp,
                updatedAt: timestamp
            };

            await db.transactions.add(settlement);
            await addToSyncQueue('transactions', settlement.id, 'create');

            // Update parent status
            const linkedSettlements = allTransactions.filter(t => t.linkedTo === originalId);
            const totalSettled = linkedSettlements.reduce((sum, s) => sum + Math.abs(s.amount), 0) + Math.abs(settlement.amount);
            const isFullySettled = totalSettled >= Math.abs(original.amount);

            await db.transactions.update(originalId, {
                status: isFullySettled ? 'completed' : 'partial',
                updatedAt: timestamp
            });
            await addToSyncQueue('transactions', originalId, 'update');

            const updatedTransactions = await db.transactions.toArray();
            set(updatedTransactions);
            _recalculate(updatedTransactions);
        }
    };
}

export const transactions = createTransactionsStore();
export const addTransaction = transactions.addTransaction;
export const deleteTransaction = transactions.deleteTransaction;
export const updateTransaction = transactions.updateTransaction;
export const settleTransaction = transactions.settleTransaction;
