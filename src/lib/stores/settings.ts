import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
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
        netPosition: number; // Renamed from cashAtHand
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
    profile: UserProfile;
    summaries: FinancialSummaries;
    lastRecalculated: string;
}

const STORAGE_KEY = 'zen_ledger_settings_v1';

const initialSettings: SettingsState = {
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

function createSettingsStore() {
    const stored = browser ? localStorage.getItem(STORAGE_KEY) : null;
    const initial = stored ? JSON.parse(stored) : initialSettings;

    const { subscribe, set, update } = writable<SettingsState>(initial);

    return {
        subscribe,
        updateProfile: (updates: Partial<UserProfile>) => {
            update(s => {
                const updated = { ...s, profile: { ...s.profile, ...updates } };
                if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });
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
            let netPosition = 0; // Liquid cash (cash + bank + etc)
            let totalIncome = 0;
            let totalExpense = 0;

            // Map transactions for quick lookup (for settlement tracking)
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
                    return; // Prospects don't affect actual balances
                }

                if (type === 'transfer') {
                    // Internal movement — net impact on total liquid cash is 0
                    // But we could track account-wise balances here if needed
                    return;
                }

                // Calculate liquid flow
                const isLiquidIn = ['earning', 'recovered', 'payable'].includes(type);
                const isLiquidOut = ['expense', 'repaid', 'receivable'].includes(type);

                // Passthrough transactions affect cash position but are often neutral eventually
                if (isLiquidIn) netPosition += amount;
                if (isLiquidOut) netPosition -= amount;

                // For global balance (Net Worth), passthrough should ideally be neutral if paired
                // but if we have an uncleared passthrough, it *is* part of our cash.
                
                if (type === 'earning' && !t.isPassthrough) totalIncome += amount;
                if (type === 'expense' && !t.isPassthrough) totalExpense += amount;

                // Handle Accruals (Receivables/Payables)
                if (type === 'receivable' || type === 'payable') {
                    const settledAmount = settlementMap[t.id] || 0;
                    const outstanding = Math.max(0, amount - settledAmount);
                    
                    if (type === 'receivable') {
                        netReceivables += outstanding;
                        if (partyId) {
                            if (!partySummaries[partyId]) partySummaries[partyId] = { balance: 0, receivables: 0, payables: 0 };
                            partySummaries[partyId].receivables += outstanding;
                        }
                        // Broadened detection: any receivable is 'loaned out' in this context
                        loans.loanedOut += outstanding;
                    } else {
                        netPayables += outstanding;
                        if (partyId) {
                            if (!partySummaries[partyId]) partySummaries[partyId] = { balance: 0, receivables: 0, payables: 0 };
                            partySummaries[partyId].payables += outstanding;
                        }
                        // Broadened detection: any payable is 'borrowed'
                        loans.borrowed += outstanding;
                    }
                }
            });

            // Finalize party summaries
            Object.keys(partySummaries).forEach(pid => {
                partySummaries[pid].balance = partySummaries[pid].receivables - partySummaries[pid].payables;
            });

            const globalBalance = netPosition + netReceivables - netPayables;

            update(s => {
                const updated = {
                    ...s,
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
                if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
            });
        }
    };
}

export const settings = createSettingsStore();
