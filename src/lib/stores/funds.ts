import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { db } from '$lib/db/database';
import { addToSyncQueue } from '$lib/db/sync-queue';

export interface Fund {
    id: string;
    name: string;
    emoji: string;
    createdAt: string;
    updatedAt: string;
}

const now = new Date().toISOString();

const defaultFunds: Fund[] = [
    { id: 'cash',  name: 'Cash',  emoji: '💵', createdAt: now, updatedAt: now },
    { id: 'bank',  name: 'Bank',  emoji: '🏦', createdAt: now, updatedAt: now },
    { id: 'bkash', name: 'bKash', emoji: '📱', createdAt: now, updatedAt: now },
];

async function initializeDefaultData() {
    if (!browser) return;
    const count = await db.funds.count();
    if (count === 0) {
        await db.funds.bulkAdd(defaultFunds);
    }
}

if (browser) {
    initializeDefaultData();
}

function createFundsStore() {
    const { subscribe, set, update } = writable<Fund[]>([]);

    if (browser) {
        db.funds.toArray().then(data => {
            const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
            set(sorted);
        });
    }

    const persist = async (all: Fund[]) => {
        const sorted = [...all].sort((a, b) => a.name.localeCompare(b.name));
        set(sorted);
        return sorted;
    };

    return {
        subscribe,
        addFund: async (fund: Omit<Fund, 'id' | 'createdAt' | 'updatedAt'>) => {
            const timestamp = new Date().toISOString();
            const newFund: Fund = {
                ...fund,
                id: Math.random().toString(36).substring(2, 9),
                createdAt: timestamp,
                updatedAt: timestamp
            };

            await db.funds.add(newFund);
            await addToSyncQueue('funds', newFund.id, 'create');

            const allFunds = await db.funds.toArray();
            await persist(allFunds);
        },
        updateFund: async (id: string, updates: Partial<Fund>) => {
            const timestamp = new Date().toISOString();
            await db.funds.update(id, { ...updates, updatedAt: timestamp });
            await addToSyncQueue('funds', id, 'update');

            const allFunds = await db.funds.toArray();
            await persist(allFunds);
        },
        deleteFund: async (id: string) => {
            await db.funds.delete(id);
            await addToSyncQueue('funds', id, 'delete');

            const allFunds = await db.funds.toArray();
            await persist(allFunds);
        },
        importData: async (data: Fund[]) => {
            await db.funds.clear();
            await db.funds.bulkAdd(data);

            const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
            set(sorted);
        }
    };
}

export const funds = createFundsStore();
