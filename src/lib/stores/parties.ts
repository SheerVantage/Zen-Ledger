import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { db } from '$lib/db/database';
import { isSimilar } from '../utils/similarity';
import { addToSyncQueue } from '$lib/db/sync-queue';

export interface Party {
    id: string;
    name: string;
    emoji: string;
    aliases?: string[];
    createdAt: string;
    updatedAt: string;
}

const now = new Date().toISOString();

const initialParties: Party[] = [
    { id: '1', name: 'John Doe', emoji: '🧑', aliases: ['john', 'doe'], createdAt: now, updatedAt: now },
    { id: '2', name: 'Starbucks', emoji: '☕', aliases: ['cafe', 'coffee shop'], createdAt: now, updatedAt: now },
    { id: '3', name: 'Amazon', emoji: '📦', aliases: ['online store', 'shopping'], createdAt: now, updatedAt: now },
    { id: '4', name: 'Landlord', emoji: '🏠', aliases: ['rent payment', 'apartment'], createdAt: now, updatedAt: now },
];

// Initialize default data if DB is empty
async function initializeDefaultData() {
    if (!browser) return;
    const count = await db.parties.count();
    if (count === 0) {
        await db.parties.bulkAdd(initialParties);
    }
}

// Run initialization on module load
if (browser) {
    initializeDefaultData();
}

function createPartiesStore() {
    const { subscribe, update, set } = writable<Party[]>([]);

    // Load initial data from Dexie
    if (browser) {
        db.parties.toArray().then(data => {
            const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
            set(sorted);
        });
    }

    const persist = async (all: Party[]) => {
        const sorted = [...all].sort((a, b) => a.name.localeCompare(b.name));
        set(sorted);
        return sorted;
    };

    return {
        subscribe,
        addParty: async (p: Omit<Party, 'id' | 'createdAt' | 'updatedAt'>) => {
            const timestamp = new Date().toISOString();
            const newParty: Party = { 
                ...p, 
                id: Math.random().toString(36).substring(2, 9),
                createdAt: timestamp,
                updatedAt: timestamp
            };
            
            await db.parties.add(newParty);
            await addToSyncQueue('parties', newParty.id, 'create');
            
            const allParties = await db.parties.toArray();
            await persist(allParties);
        },
        updateParty: async (id: string, updates: Partial<Party>) => {
            const timestamp = new Date().toISOString();
            await db.parties.update(id, { ...updates, updatedAt: timestamp });
            await addToSyncQueue('parties', id, 'update');
            
            const allParties = await db.parties.toArray();
            await persist(allParties);
        },
        deleteParty: async (id: string) => {
            await db.parties.delete(id);
            await addToSyncQueue('parties', id, 'delete');
            
            const allParties = await db.parties.toArray();
            await persist(allParties);
        },
        getPartyByName: (name: string, allParties: Party[]) => {
            const lowerName = name.toLowerCase();
            return allParties.find(p => 
                p.name.toLowerCase() === lowerName || 
                p.aliases?.some(a => a.toLowerCase() === lowerName)
            );
        },
        findSimilar: (name: string, allParties: Party[]) => {
            return allParties.filter(p => 
                isSimilar(p.name, name) || 
                p.aliases?.some(a => isSimilar(a, name))
            );
        },
        importData: async (data: Party[]) => {
            await db.parties.clear();
            await db.parties.bulkAdd(data);
            
            const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
            set(sorted);
        }
    };
}

export const parties = createPartiesStore();
