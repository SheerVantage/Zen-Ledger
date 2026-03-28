import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { isSimilar } from '../utils/similarity';

export type AccountType = 'expense' | 'earning' | 'receivable' | 'payable' | 'recovered' | 'repaid' | 'transfer' | 'prospect';

export interface Purpose {
    id: string;
    name: string;
    emoji: string;
    accountType: AccountType;
    aliases?: string[];
    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY = 'zen_ledger_purposes_v1';

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

function createPurposesStore() {
    const stored = browser ? localStorage.getItem(STORAGE_KEY) : null;
    let initial = stored ? JSON.parse(stored) : initialPurposes;

    // Migration: Ensure all existing purposes have timestamps and new default purposes exist
    let needsMigration = false;
    
    // 1. Check for missing default purposes
    initialPurposes.forEach(defaultP => {
        if (!initial.find((p: any) => p.accountType === defaultP.accountType && p.name === defaultP.name)) {
            needsMigration = true;
            initial.push(defaultP);
        }
    });

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

    const { subscribe, set, update } = writable<Purpose[]>(initial.sort((a: Purpose, b: Purpose) => a.name.localeCompare(b.name)));
    const persist = (all: Purpose[]) => {
        const sorted = [...all].sort((a, b) => a.name.localeCompare(b.name));
        if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
        return sorted;
    };

    return {
        subscribe,
        addPurpose: (purpose: Omit<Purpose, 'id' | 'createdAt' | 'updatedAt'>) => {
            update(all => {
                const timestamp = new Date().toISOString();
                const newPurpose: Purpose = { 
                    ...purpose, 
                    id: Math.random().toString(36).substring(2, 9),
                    createdAt: timestamp,
                    updatedAt: timestamp
                };
                return persist([...all, newPurpose]);
            });
        },
        updatePurpose: (id: string, updates: Partial<Purpose>) => {
            update(all => {
                const timestamp = new Date().toISOString();
                const updated = all.map(p => p.id === id ? { ...p, ...updates, updatedAt: timestamp } : p);
                return persist(updated);
            });
        },
        deletePurpose: (id: string) => {
            update(all => {
                const updated = all.filter(p => p.id !== id);
                return persist(updated);
            });
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
        importData: (data: Purpose[]) => {
            set(data);
            if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    };
}

export const purposes = createPurposesStore();
