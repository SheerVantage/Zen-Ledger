import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { db } from '$lib/db/database';
import { addToSyncQueue } from '$lib/db/sync-queue';

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

const initialTemplates: RecurringTemplate[] = [];

// We'll store recurring templates in a special way using settings table
const RECURRING_KEY = 'recurring';

// Initialize default data if DB is empty
async function initializeDefaultData() {
    if (!browser) return;
    const settings = await db.settings.get(RECURRING_KEY);
    if (!settings) {
        await db.settings.put({ id: RECURRING_KEY, recurring: initialTemplates } as any);
    }
}

// Run initialization on module load
if (browser) {
    initializeDefaultData();
}

function createRecurringStore() {
    const { subscribe, update, set } = writable<RecurringTemplate[]>([]);

    // Load initial data from Dexie
    if (browser) {
        db.settings.get(RECURRING_KEY).then((data: any) => {
            if (data?.recurring) {
                const sorted = [...data.recurring].sort((a, b) => a.title.localeCompare(b.title));
                set(sorted);
            }
        });
    }

    const persist = async (all: RecurringTemplate[]) => {
        const sorted = [...all].sort((a, b) => a.title.localeCompare(b.title));
        await db.settings.put({ id: RECURRING_KEY, recurring: sorted } as any);
        set(sorted);
        return sorted;
    };

    return {
        subscribe,
        addTemplate: async (t: Omit<RecurringTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
            const timestamp = new Date().toISOString();
            const newTemplate: RecurringTemplate = {
                ...t,
                id: Math.random().toString(36).substring(2, 9),
                createdAt: timestamp,
                updatedAt: timestamp
            };
            
            const current = await db.settings.get(RECURRING_KEY) as any;
            const all = current?.recurring || [];
            await persist([...all, newTemplate]);
            await addToSyncQueue('settings', RECURRING_KEY, 'update');
        },
        updateTemplate: async (id: string, updates: Partial<RecurringTemplate>) => {
            const timestamp = new Date().toISOString();
            const current = await db.settings.get(RECURRING_KEY) as any;
            const all: RecurringTemplate[] = current?.recurring || [];
            const updated = all.map(t => t.id === id ? { ...t, ...updates, updatedAt: timestamp } : t);
            await persist(updated);
            await addToSyncQueue('settings', RECURRING_KEY, 'update');
        },
        deleteTemplate: async (id: string) => {
            const current = await db.settings.get(RECURRING_KEY) as any;
            const all: RecurringTemplate[] = current?.recurring || [];
            const updated = all.filter(t => t.id !== id);
            await persist(updated);
            await addToSyncQueue('settings', RECURRING_KEY, 'update');
        },
        importData: async (data: RecurringTemplate[]) => {
            await persist(data);
        }
    };
}

export const recurring = createRecurringStore();
