import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { purposes } from './purposes';
import { settings } from './settings';

export interface Transaction {
    id: string;
    narration: string;
    amount: number;
    purposeId: string;
    date: string; // YYYY-MM-DD
    partyId?: string;
    reverseOf?: string; // ID of the original transaction this settles (legacy)
    linkedTo?: string;  // ID of the original transaction this settles
    account?: string;   // "cash" | "bank" | "bkash" | "nagad" | user-defined
    toAccount?: string; // Only for category = "transfer"
    status?: 'completed' | 'pending' | 'partial';
    isPassthrough?: boolean;
    prospectType?: 'expected_income' | 'expected_expense' | 'pipeline' | 'possible_repayment' | 'plan';
    confidence?: 'high' | 'medium' | 'low';
    expectedDate?: string; // ISO date
    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY = 'zen_ledger_v1';

const now = new Date().toISOString();

const initialTransactions: Transaction[] = [
    { id: '1', narration: 'Starbucks coffee with friends', amount: -4.50, purposeId: '1', date: '2026-02-28', createdAt: now, updatedAt: now },
    { id: '2', narration: 'Monthly Salary Deposit', amount: 3200.00, purposeId: '2', date: '2026-02-28', createdAt: now, updatedAt: now },
];

function createStore() {
    const stored = browser ? localStorage.getItem(STORAGE_KEY) : null;
    let initial = stored ? JSON.parse(stored) : initialTransactions;

    // Migration for old data
    let needsMigration = false;
    initial = initial.map((t: any) => {
        let updated = t;
        if (t.title) {
            needsMigration = true;
            updated = {
                id: t.id,
                narration: t.title,
                amount: t.amount,
                purposeId: '1',
                date: t.date
            };
        }
        if (!updated.createdAt || !updated.updatedAt) {
            needsMigration = true;
            updated = {
                ...updated,
                createdAt: updated.createdAt || now,
                updatedAt: updated.updatedAt || now
            };
        }
        return updated;
    });

    // Data Migration (v2.0.0) - Fix missing partyId for receivables/payables
    const allPurposes = get(purposes); // Get current purposes for migration logic
    initial = initial.map((t: Transaction) => {
        const purpose = allPurposes.find(p => p.id === t.purposeId);
        const isAccrual = purpose && ['receivable', 'payable'].includes(purpose.accountType);
        if (isAccrual && !t.partyId) {
            needsMigration = true;
            return { ...t, partyId: 'unknown' }; // Assign 'unknown' if missing
        }
        return t;
    });

    if (needsMigration && browser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }

    const { subscribe, update, set } = writable<Transaction[]>(initial);

    const _recalculate = (all: Transaction[]) => {
        settings.recalculate(all, get(purposes));
    };

    // Initial recalculation
    _recalculate(initial);

    return {
        subscribe,
        addTransaction: (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
            const id = Math.random().toString(36).substring(2, 9);
            const timestamp = new Date().toISOString();

            update(all => {
                const allPurposes = get(purposes);
                const purpose = allPurposes.find(p => p.id === t.purposeId);
                const accountType = purpose?.accountType || 'expense';

                let defaultStatus: Transaction['status'] = 'completed';
                if (['receivable', 'payable', 'prospect'].includes(accountType)) {
                    defaultStatus = 'pending';
                }

                const newTransaction: Transaction = {
                    account: 'cash',
                    status: defaultStatus,
                    isPassthrough: false,
                    ...t,
                    id,
                    createdAt: timestamp,
                    updatedAt: timestamp
                };
                const updated = [newTransaction, ...all];
                if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                _recalculate(updated);
                return updated;
            });
            return id;
        },
        deleteTransaction: (id: string) => {
            update(all => {
                const updated = all.filter(t => t.id !== id);
                if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                _recalculate(updated);
                return updated;
            });
        },
        updateTransaction: (id: string, updates: Partial<Transaction>) => {
            update(all => {
                const timestamp = new Date().toISOString();
                const updated = all.map(t => t.id === id ? { ...t, ...updates, updatedAt: timestamp } : t);
                if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                _recalculate(updated);
                return updated;
            });
        },
        importData: (data: Transaction[]) => {
            set(data);
            if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            _recalculate(data);
        },
        settleTransaction: (originalId: string, amount?: number) => {
            update(all => {
                const original = all.find(t => t.id === originalId);
                if (!original) return all;
        
                const allPurposes = get(purposes);
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
                    account: 'cash',
                    status: 'completed',
                    createdAt: timestamp,
                    updatedAt: timestamp
                };
        
                // Update parent status
                let updatedList = [settlement, ...all];
                
                // Recalculate outstanding for the parent
                const linkedSettlements = updatedList.filter(t => t.linkedTo === originalId);
                const totalSettled = linkedSettlements.reduce((sum, s) => sum + Math.abs(s.amount), 0);
                const isFullySettled = totalSettled >= Math.abs(original.amount);
                
                updatedList = updatedList.map(t => {
                    if (t.id === originalId) {
                        return {
                            ...t,
                            status: isFullySettled ? 'completed' : 'partial',
                            updatedAt: timestamp
                        };
                    }
                    return t;
                });
        
                if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
                _recalculate(updatedList);
                return updatedList;
            });
        }
    };
}

export const transactions = createStore();
export const addTransaction = transactions.addTransaction;
export const deleteTransaction = transactions.deleteTransaction;
export const updateTransaction = transactions.updateTransaction;
export const settleTransaction = transactions.settleTransaction;
