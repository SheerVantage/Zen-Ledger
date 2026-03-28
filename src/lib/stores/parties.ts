import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { isSimilar } from '../utils/similarity';

export interface Party {
    id: string;
    name: string;
    emoji: string;
    aliases?: string[];
    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY = 'zen_ledger_parties_v1';

const now = new Date().toISOString();

const initialParties: Party[] = [
    { id: '1', name: 'John Doe', emoji: '🧑', aliases: ['john', 'doe'], createdAt: now, updatedAt: now },
    { id: '2', name: 'Starbucks', emoji: '☕', aliases: ['cafe', 'coffee shop'], createdAt: now, updatedAt: now },
    { id: '3', name: 'Amazon', emoji: '📦', aliases: ['online store', 'shopping'], createdAt: now, updatedAt: now },
    { id: '4', name: 'Landlord', emoji: '🏠', aliases: ['rent payment', 'apartment'], createdAt: now, updatedAt: now },
];

function createPartiesStore() {
    const stored = browser ? localStorage.getItem(STORAGE_KEY) : null;
    let initial = stored ? JSON.parse(stored) : initialParties;

    // Migration: Ensure all existing parties have timestamps
    let needsMigration = false;
    initial = initial.map((p: any) => {
        if (!p.createdAt || !p.updatedAt) {
            needsMigration = true;
            return {
                ...p,
                createdAt: p.createdAt || now,
                updatedAt: p.updatedAt || now
            };
        }
        return p;
    });

    if (needsMigration && browser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }

    const { subscribe, update, set } = writable<Party[]>(initial.sort((a: Party, b: Party) => a.name.localeCompare(b.name)));
    const persist = (all: Party[]) => {
        const sorted = [...all].sort((a, b) => a.name.localeCompare(b.name));
        if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
        return sorted;
    };

    return {
        subscribe,
        addParty: (p: Omit<Party, 'id' | 'createdAt' | 'updatedAt'>) => {
            update(all => {
                const timestamp = new Date().toISOString();
                const newParty: Party = { 
                    ...p, 
                    id: Math.random().toString(36).substring(2, 9),
                    createdAt: timestamp,
                    updatedAt: timestamp
                };
                return persist([...all, newParty]);
            });
        },
        updateParty: (id: string, updates: Partial<Party>) => {
            update(all => {
                const timestamp = new Date().toISOString();
                const updated = all.map(p => p.id === id ? { ...p, ...updates, updatedAt: timestamp } : p);
                return persist(updated);
            });
        },
        deleteParty: (id: string) => {
            update(all => {
                const updated = all.filter(p => p.id !== id);
                return persist(updated);
            });
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
        importData: (data: Party[]) => {
            set(data);
            if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    };
}

export const parties = createPartiesStore();
