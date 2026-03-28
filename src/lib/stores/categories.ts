import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export type AccountType = 'expense' | 'earning' | 'receivable' | 'payable' | 'recovered' | 'repaid' | 'transfer' | 'prospect';

export interface Category {
    id: AccountType;
    name: string;
    emoji: string;
    description: string;
    direction: 'in' | 'out' | 'neutral';
    updatedAt: string;
}

const STORAGE_KEY = 'zen_ledger_categories_v1';

const now = new Date().toISOString();

const defaultCategories: Category[] = [
    { id: 'expense',    name: 'Expense',    emoji: '💸', description: 'Money paid out for goods or services', direction: 'out',     updatedAt: now },
    { id: 'earning',    name: 'Earning',    emoji: '💰', description: 'Money received as income',             direction: 'in',      updatedAt: now },
    { id: 'receivable', name: 'Receivable', emoji: '📈', description: 'Money owed to you',                    direction: 'neutral', updatedAt: now },
    { id: 'payable',    name: 'Payable',    emoji: '📉', description: 'Money you owe to others',              direction: 'neutral', updatedAt: now },
    { id: 'recovered',  name: 'Recovered',  emoji: '✅', description: 'Receivable amount collected',         direction: 'in',      updatedAt: now },
    { id: 'repaid',     name: 'Repaid',     emoji: '🔁', description: 'Payable amount settled',              direction: 'out',     updatedAt: now },
    { id: 'transfer',   name: 'Transfer',   emoji: '🔄', description: 'Money moved between your own accounts', direction: 'neutral', updatedAt: now },
    { id: 'prospect',   name: 'Prospect',   emoji: '🔭', description: 'Planned or expected future transaction', direction: 'neutral', updatedAt: now },
];

function createCategoriesStore() {
    const stored = browser ? localStorage.getItem(STORAGE_KEY) : null;

    // Merge stored overrides onto defaults (user can rename but not add/delete)
    let initial: Category[] = defaultCategories;
    if (stored) {
        const stored_data: Partial<Category>[] = JSON.parse(stored);
        initial = defaultCategories.map(def => {
            const override = stored_data.find(s => s.id === def.id);
            return override ? { ...def, ...override } : def;
        });
    }

    const { subscribe, update, set } = writable<Category[]>(initial);

    const persist = (all: Category[]) => {
        if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        return all;
    };

    return {
        subscribe,
        updateCategory: (id: AccountType, updates: Partial<Pick<Category, 'name' | 'emoji' | 'description'>>) => {
            update(all => {
                const timestamp = new Date().toISOString();
                const updated = all.map(c => c.id === id ? { ...c, ...updates, updatedAt: timestamp } : c);
                return persist(updated);
            });
        },
        resetDefaults: () => {
            const reset = defaultCategories.map(c => ({ ...c, updatedAt: new Date().toISOString() }));
            set(reset);
            persist(reset);
        },
        importData: (data: Partial<Category>[]) => {
            const merged = defaultCategories.map(def => {
                const override = data.find(s => s.id === def.id);
                return override ? { ...def, ...override } : def;
            });
            set(merged);
            persist(merged);
        },
        getById: (id: AccountType): Category | undefined => {
            return get({ subscribe }).find(c => c.id === id);
        }
    };
}

export const categories = createCategoriesStore();
