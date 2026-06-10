import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { db } from '$lib/db/database';
import { isSimilar } from '../utils/similarity';
import { addToSyncQueue } from '$lib/db/sync-queue';
import type { AccountType } from '$lib/account-types';

export type { AccountType } from '$lib/account-types';

export interface Purpose {
    id: string;
    name: string;
    emoji: string;
    accountType: AccountType;
    aliases?: string[];
    createdAt: string;
    updatedAt: string;
}

const now = new Date().toISOString();

const initialPurposes: Purpose[] = [
    { id: '1', name: 'Coffee', emoji: '☕', accountType: 'expense', aliases: ['starbucks', 'cafe', 'espresso', 'latte'], createdAt: now, updatedAt: now },
    { id: '2', name: 'Income', emoji: '💰', accountType: 'earning', aliases: ['salary', 'paycheck', 'bonus', 'dividend'], createdAt: now, updatedAt: now },
    { id: '3', name: 'Groceries', emoji: '🍎', accountType: 'expense', aliases: ['market', 'supermarket', 'food', 'apple'], createdAt: now, updatedAt: now },
    { id: '4', name: 'Rent', emoji: '🏠', accountType: 'expense', aliases: ['housing', 'apartment', 'lease'], createdAt: now, updatedAt: now },
    { id: '5', name: 'Loan', emoji: '💸', accountType: 'payable', aliases: ['debt', 'borrowed'], createdAt: now, updatedAt: now },
    { id: '6', name: 'Refund', emoji: '🔄', accountType: 'receivable', aliases: ['reimbursement', 'returned'], createdAt: now, updatedAt: now },
    { id: '7', name: 'Recovered', emoji: '🔄', accountType: 'recovered', aliases: ['debt recovery', 'receivable payment'], createdAt: now, updatedAt: now },
    { id: '8', name: 'Repaid', emoji: '💸', accountType: 'repaid', aliases: ['settlement', 'debt payment'], createdAt: now, updatedAt: now },
    { id: '9', name: 'Transfer', emoji: '🔄', accountType: 'transfer', aliases: ['movement', 'deposited'], createdAt: now, updatedAt: now },
    { id: '10', name: 'Prospect', emoji: '🔭', accountType: 'prospect', aliases: ['plan', 'expected', 'future'], createdAt: now, updatedAt: now },
];

// Initialize default data if DB is empty
async function initializeDefaultData() {
    if (!browser) return;
    const count = await db.purposes.count();
    if (count === 0) {
        await db.purposes.bulkAdd(initialPurposes);
    }
}

// Run initialization on module load
if (browser) {
    initializeDefaultData();
}

function createPurposesStore() {
    const { subscribe, set, update } = writable<Purpose[]>([]);

    // Load initial data from Dexie
    if (browser) {
        db.purposes.toArray().then(data => {
            const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
            set(sorted);
        });
    }

    const persist = async (all: Purpose[]) => {
        const sorted = [...all].sort((a, b) => a.name.localeCompare(b.name));
        set(sorted);
        return sorted;
    };

    return {
        subscribe,
        addPurpose: async (purpose: Omit<Purpose, 'id' | 'createdAt' | 'updatedAt'>) => {
            const timestamp = new Date().toISOString();
            const newPurpose: Purpose = { 
                ...purpose, 
                id: Math.random().toString(36).substring(2, 9),
                createdAt: timestamp,
                updatedAt: timestamp
            };
            
            await db.purposes.add(newPurpose);
            await addToSyncQueue('purposes', newPurpose.id, 'create');
            
            const allPurposes = await db.purposes.toArray();
            await persist(allPurposes);
        },
        updatePurpose: async (id: string, updates: Partial<Purpose>) => {
            const timestamp = new Date().toISOString();
            await db.purposes.update(id, { ...updates, updatedAt: timestamp });
            await addToSyncQueue('purposes', id, 'update');
            
            const allPurposes = await db.purposes.toArray();
            await persist(allPurposes);
        },
        deletePurpose: async (id: string) => {
            await db.purposes.delete(id);
            await addToSyncQueue('purposes', id, 'delete');
            
            const allPurposes = await db.purposes.toArray();
            await persist(allPurposes);
        },
        getPurposeByName: (name: string, allPurposes: Purpose[]) => {
            const lowerName = name.toLowerCase();
            return allPurposes.find(p => 
                p.name.toLowerCase() === lowerName || 
                p.aliases?.some(a => a.toLowerCase() === lowerName)
            );
        },
        findSimilar: (name: string, allPurposes: Purpose[]) => {
            return allPurposes.filter(p => 
                isSimilar(p.name, name) || 
                p.aliases?.some(a => isSimilar(a, name))
            );
        },
        importData: async (data: Purpose[]) => {
            await db.purposes.clear();
            await db.purposes.bulkAdd(data);
            
            const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
            set(sorted);
        }
    };
}

export const purposes = createPurposesStore();
