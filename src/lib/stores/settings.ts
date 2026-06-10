import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { db } from '$lib/db/database';
import type { Transaction } from './transactions';
import type { Purpose } from './purposes';

export interface PartySummary {
    balance: number;
    receivables: number;
    payables: number;
}

export interface FinancialSummaries {
    global: {
        balance: number;
        receivables: number;
        payables: number;
        netPosition: number;
    };
    planning: {
        expectedInflow: number;
        expectedOutflow: number;
        byConfidence: Record<'high' | 'medium' | 'low', { inflow: number, outflow: number }>;
    };
    loans: {
        loanedOut: number;
        borrowed: number;
    };
    partyWise: Record<string, PartySummary>;
}

export interface UserProfile {
    name: string;
    currency: string;
    dailyBudget: number;
}

export interface SettingsState {
    id: string;
    profile: UserProfile;
    summaries: FinancialSummaries;
    lastRecalculated: string;
}

const SETTINGS_ID = 'default';

const initialSettings: SettingsState = {
    id: SETTINGS_ID,
    profile: {
        name: 'User',
        currency: '৳',
        dailyBudget: 2000
    },
    summaries: {
        global: { balance: 0, receivables: 0, payables: 0, netPosition: 0 },
        planning: { 
            expectedInflow: 0, 
            expectedOutflow: 0, 
            byConfidence: { 
                high: { inflow: 0, outflow: 0 }, 
                medium: { inflow: 0, outflow: 0 }, 
                low: { inflow: 0, outflow: 0 } 
            } 
        },
        loans: { loanedOut: 0, borrowed: 0 },
        partyWise: {}
    },
    lastRecalculated: new Date().toISOString()
};

// Initialize default settings if DB is empty
async function initializeDefaultData() {
    if (!browser) return;
    const count = await db.settings.count();
    if (count === 0) {
        await db.settings.add(initialSettings);
    }
}

// Run initialization on module load
if (browser) {
    initializeDefaultData();
}

function createSettingsStore() {
    const { subscribe, set, update } = writable<SettingsState>(initialSettings);

    // Load initial data from Dexie
    if (browser) {
        db.settings.get(SETTINGS_ID).then(data => {
            if (data) {
                set(data);
            }
        });
    }

    const persist = async (state: SettingsState) => {
        await db.settings.put(state);
        set(state);
    };

    return {
        subscribe,
        updateProfile: async (updates: Partial<UserProfile>) => {
            const current = get({ subscribe });
            const updated = { ...current, profile: { ...current.profile, ...updates } };
            await persist(updated);
        },
        recalculate: (transactions: Transaction[], purposes: Purpose[]) => {
            const partySummaries: Record<string, PartySummary> = {};
            const planning = {
                expectedInflow: 0,
                expectedOutflow: 0,
                byConfidence: {
                    high: { inflow: 0, outflow: 0 },
                    medium: { inflow: 0, outflow: 0 },
                    low: { inflow: 0, outflow: 0 }
                }
            };
            const loans = { loanedOut: 0, borrowed: 0 };
            
            let netReceivables = 0;
            let netPayables = 0;
            let netPosition = 0;
            let totalIncome = 0;
            let totalExpense = 0;

            const settlementMap: Record<string, number> = {};
            transactions.forEach(t => {
                if (t.linkedTo) {
                    settlementMap[t.linkedTo] = (settlementMap[t.linkedTo] || 0) + Math.abs(t.amount);
                }
            });

            transactions.forEach(t => {
                const p = purposes.find(purpose => purpose.id === t.purposeId);
                const type = p?.accountType || 'expense';
                const partyId = t.partyId || 'unknown';
                const amount = Math.abs(t.amount);

                if (type === 'prospect') {
                    const conf = t.confidence || 'medium';
                    const isExpectedIn = ['expected_income', 'pipeline', 'possible_repayment'].includes(t.prospectType || '');
                    if (isExpectedIn) {
                        planning.expectedInflow += amount;
                        planning.byConfidence[conf].inflow += amount;
                    } else {
                        planning.expectedOutflow += amount;
                        planning.byConfidence[conf].outflow += amount;
                    }
                    return;
                }

                if (type === 'transfer') {
                    return;
                }

                const isLiquidIn = ['earning', 'recovered', 'payable'].includes(type);
                const isLiquidOut = ['expense', 'repaid', 'receivable'].includes(type);

                if (isLiquidIn) netPosition += amount;
                if (isLiquidOut) netPosition -= amount;
                
                if (type === 'earning' && !t.isPassthrough) totalIncome += amount;
                if (type === 'expense' && !t.isPassthrough) totalExpense += amount;

                if (type === 'receivable' || type === 'payable') {
                    const settledAmount = settlementMap[t.id] || 0;
                    const outstanding = Math.max(0, amount - settledAmount);
                    
                    if (type === 'receivable') {
                        netReceivables += outstanding;
                        if (partyId) {
                            if (!partySummaries[partyId]) partySummaries[partyId] = { balance: 0, receivables: 0, payables: 0 };
                            partySummaries[partyId].receivables += outstanding;
                        }
                        loans.loanedOut += outstanding;
                    } else {
                        netPayables += outstanding;
                        if (partyId) {
                            if (!partySummaries[partyId]) partySummaries[partyId] = { balance: 0, receivables: 0, payables: 0 };
                            partySummaries[partyId].payables += outstanding;
                        }
                        loans.borrowed += outstanding;
                    }
                }
            });

            Object.keys(partySummaries).forEach(pid => {
                partySummaries[pid].balance = partySummaries[pid].receivables - partySummaries[pid].payables;
            });

            const globalBalance = netPosition + netReceivables - netPayables;

            const current = get({ subscribe });
            const updated: SettingsState = {
                ...current,
                summaries: {
                    global: {
                        balance: globalBalance,
                        receivables: netReceivables,
                        payables: netPayables,
                        netPosition: netPosition
                    },
                    planning,
                    loans,
                    partyWise: partySummaries
                },
                lastRecalculated: new Date().toISOString()
            };
            
            // Persist to Dexie (fire and forget for performance)
            db.settings.put(updated);
            set(updated);
        }
    };
}

export const settings = createSettingsStore();
