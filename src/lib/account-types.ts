export type AccountType = 'expense' | 'earning' | 'receivable' | 'payable' | 'recovered' | 'repaid' | 'transfer' | 'prospect';

export interface AccountTypeMeta {
    id: AccountType;
    name: string;
    emoji: string;
    description: string;
    direction: 'in' | 'out' | 'neutral';
}

export const ACCOUNT_TYPES: AccountTypeMeta[] = [
    { id: 'expense',    name: 'Expense',    emoji: '💸', description: 'Money paid out for goods or services', direction: 'out' },
    { id: 'earning',    name: 'Earning',    emoji: '💰', description: 'Money received as income', direction: 'in' },
    { id: 'receivable', name: 'Receivable', emoji: '📈', description: 'Money owed to you', direction: 'neutral' },
    { id: 'payable',    name: 'Payable',    emoji: '📉', description: 'Money you owe to others', direction: 'neutral' },
    { id: 'recovered',  name: 'Recovered',  emoji: '✅', description: 'Receivable amount collected', direction: 'in' },
    { id: 'repaid',     name: 'Repaid',     emoji: '🔁', description: 'Payable amount settled', direction: 'out' },
    { id: 'transfer',   name: 'Transfer',   emoji: '🔄', description: 'Money moved between your own funds', direction: 'neutral' },
    { id: 'prospect',   name: 'Prospect',   emoji: '🔭', description: 'Planned or expected future transaction', direction: 'neutral' },
];

export function getAccountType(id: AccountType): AccountTypeMeta | undefined {
    return ACCOUNT_TYPES.find(t => t.id === id);
}
