import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Schedule = 'weekly' | 'monthly' | 'occasional';

export interface RecurringTemplate {
    id: string;
    title: string;
    purposeId: string;
    partyId: string;
    amount?: number;
    isVariable: boolean;
    schedule: Schedule;
    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY = 'zen_ledger_recurring_v1';

const initialTemplates: RecurringTemplate[] = [];

function createRecurringStore() {
    const stored = browser ? localStorage.getItem(STORAGE_KEY) : null;
    const initial = stored ? JSON.parse(stored) : initialTemplates;

    const { subscribe, update, set } = writable<RecurringTemplate[]>(initial);

    const persist = (all: RecurringTemplate[]) => {
        const sorted = [...all].sort((a, b) => a.title.localeCompare(b.title));
        if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
        return sorted;
    };

    return {
        subscribe,
        addTemplate: (t: Omit<RecurringTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
            update(all => {
                const timestamp = new Date().toISOString();
                const newTemplate: RecurringTemplate = {
                    ...t,
                    id: Math.random().toString(36).substring(2, 9),
                    createdAt: timestamp,
                    updatedAt: timestamp
                };
                return persist([...all, newTemplate]);
            });
        },
        updateTemplate: (id: string, updates: Partial<RecurringTemplate>) => {
            update(all => {
                const timestamp = new Date().toISOString();
                const updated = all.map(t => t.id === id ? { ...t, ...updates, updatedAt: timestamp } : t);
                return persist(updated);
            });
        },
        deleteTemplate: (id: string) => {
            update(all => {
                const updated = all.filter(t => t.id !== id);
                return persist(updated);
            });
        },
        importData: (data: RecurringTemplate[]) => {
            set(data);
            if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    };
}

export const recurring = createRecurringStore();
