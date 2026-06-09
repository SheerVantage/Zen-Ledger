import { describe, it, expect } from 'vitest';
import { generateInsights, type InsightStory } from '$lib/utils/insights';

interface Transaction {
  id: string;
  narration: string;
  amount: number;
  purposeId: string;
  date: string;
  partyId?: string;
  linkedTo?: string;
  account?: string;
  status?: 'completed' | 'pending' | 'partial';
  createdAt: string;
  updatedAt: string;
}

interface Purpose {
  id: string;
  name: string;
  emoji: string;
  accountType: 'expense' | 'earning' | 'receivable' | 'payable' | 'recovered' | 'repaid' | 'transfer' | 'prospect';
  aliases?: string[];
  createdAt: string;
  updatedAt: string;
}

const now = new Date().toISOString();

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function makePurpose(overrides: Partial<Purpose> = {}): Purpose {
  return {
    id: overrides.id ?? 'p1',
    name: overrides.name ?? 'Test Purpose',
    emoji: overrides.emoji ?? '🧪',
    accountType: overrides.accountType ?? 'expense',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: overrides.id ?? 'tx1',
    narration: overrides.narration ?? 'test narration',
    amount: overrides.amount ?? -100,
    purposeId: overrides.purposeId ?? 'p1',
    date: overrides.date ?? getToday(),
    account: overrides.account ?? 'cash',
    status: overrides.status ?? 'completed',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const PURPOSE_EXPENSE_A = makePurpose({ id: 'expA', name: 'Rent', emoji: '🏠', accountType: 'expense' });
const PURPOSE_EXPENSE_B = makePurpose({ id: 'expB', name: 'Groceries', emoji: '🍎', accountType: 'expense' });
const PURPOSE_EARNING = makePurpose({ id: 'earn', name: 'Salary', emoji: '💰', accountType: 'earning' });

describe('generateInsights', () => {
  it('returns empty array when no transactions', () => {
    const result = generateInsights([], []);
    expect(result).toEqual([]);
  });

  it('returns max 5 stories', () => {
    const purposes = [
      PURPOSE_EXPENSE_A,
      PURPOSE_EXPENSE_B,
      PURPOSE_EARNING,
    ];

    // Create enough transactions to trigger all 6 generators:
    // 1. topSpendingCategory: >=3 expenses
    // 2. weeklySpendingTrend: expenses this week + last week
    // 3. savingsRate: current month earning + expense
    // 4. largestExpense: >=1 expense in last 30 days
    // 5. noSpendStreak: no expenses today/yesterday (streak >= 2)
    // 6. accountDistribution: >=3 transactions

    const thisMonday = (() => {
      const d = new Date();
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1;
      d.setDate(d.getDate() - diff);
      return d.toISOString().split('T')[0];
    })();

    const txs: Transaction[] = [
      // topSpendingCategory: 3 expenses for rent
      makeTx({ id: 'tx1', amount: -500, purposeId: 'expA', date: getDaysAgo(2) }),
      makeTx({ id: 'tx2', amount: -600, purposeId: 'expA', date: getDaysAgo(3) }),
      makeTx({ id: 'tx3', amount: -400, purposeId: 'expA', date: getDaysAgo(4) }),
      // savingsRate: current month earning
      makeTx({ id: 'tx4', amount: 3000, purposeId: 'earn', date: getDaysAgo(1) }),
      // accountDistribution: 3+ txs (already satisfied by above)
      // weeklySpendingTrend: expense this week
      makeTx({ id: 'tx5', amount: -100, purposeId: 'expB', date: thisMonday }),
      // weeklySpendingTrend: expense last week
      makeTx({ id: 'tx6', amount: -150, purposeId: 'expB', date: getDaysAgo(9) }),
      // noSpendStreak: ensure today and yesterday have no expenses
      // (already handled since all expenses are daysAgo >= 1)
    ];

    const result = generateInsights(txs, purposes);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('sorts stories by priority descending', () => {
    const purposes = [
      PURPOSE_EXPENSE_A,
      PURPOSE_EXPENSE_B,
      PURPOSE_EARNING,
    ];

    const thisMonday = (() => {
      const d = new Date();
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1;
      d.setDate(d.getDate() - diff);
      return d.toISOString().split('T')[0];
    })();

    const txs: Transaction[] = [
      makeTx({ id: 'tx1', amount: -500, purposeId: 'expA', date: getDaysAgo(2) }),
      makeTx({ id: 'tx2', amount: -600, purposeId: 'expA', date: getDaysAgo(3) }),
      makeTx({ id: 'tx3', amount: -400, purposeId: 'expA', date: getDaysAgo(4) }),
      makeTx({ id: 'tx4', amount: 3000, purposeId: 'earn', date: getDaysAgo(1) }),
      makeTx({ id: 'tx5', amount: -100, purposeId: 'expB', date: thisMonday }),
      makeTx({ id: 'tx6', amount: -150, purposeId: 'expB', date: getDaysAgo(9) }),
    ];

    const result = generateInsights(txs, purposes);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].priority).toBeGreaterThanOrEqual(result[i].priority);
    }
  });
});

describe('topSpendingCategory (via generateInsights)', () => {
  it('identifies category with highest spending', () => {
    const purposes = [PURPOSE_EXPENSE_A, PURPOSE_EXPENSE_B];

    const txs: Transaction[] = [
      makeTx({ id: 'tx1', amount: -100, purposeId: 'expB', date: getDaysAgo(1) }),
      makeTx({ id: 'tx2', amount: -500, purposeId: 'expA', date: getDaysAgo(2) }),
      makeTx({ id: 'tx3', amount: -600, purposeId: 'expA', date: getDaysAgo(3) }),
      makeTx({ id: 'tx4', amount: -200, purposeId: 'expA', date: getDaysAgo(4) }),
    ];

    const result = generateInsights(txs, purposes);
    const topStory = result.find(s => s.title.startsWith('Top Spending'));
    expect(topStory).toBeDefined();
    expect(topStory!.title).toContain('Rent');
  });

  it('returns null with fewer than 3 expenses', () => {
    const purposes = [PURPOSE_EXPENSE_A];

    const txs: Transaction[] = [
      makeTx({ id: 'tx1', amount: -100, purposeId: 'expA', date: getDaysAgo(1) }),
      makeTx({ id: 'tx2', amount: -200, purposeId: 'expA', date: getDaysAgo(2) }),
    ];

    const result = generateInsights(txs, purposes);
    const topStory = result.find(s => s.title.startsWith('Top Spending'));
    expect(topStory).toBeUndefined();
  });
});

describe('savingsRate (via generateInsights)', () => {
  it('calculates correct savings rate', () => {
    const purposes = [PURPOSE_EXPENSE_A, PURPOSE_EARNING];

    // earning: 1000, expense: 200 → rate = (1000-200)/1000 = 80%
    const txs: Transaction[] = [
      makeTx({ id: 'tx1', amount: 1000, purposeId: 'earn', date: getDaysAgo(1) }),
      makeTx({ id: 'tx2', amount: -200, purposeId: 'expA', date: getDaysAgo(2) }),
    ];

    const result = generateInsights(txs, purposes);
    const savingsStory = result.find(s => s.title === 'Savings Rate');
    expect(savingsStory).toBeDefined();
    expect(savingsStory!.description).toContain('80%');
  });

  it('returns null with no earnings', () => {
    const purposes = [PURPOSE_EXPENSE_A];

    const txs: Transaction[] = [
      makeTx({ id: 'tx1', amount: -100, purposeId: 'expA', date: getDaysAgo(1) }),
      makeTx({ id: 'tx2', amount: -200, purposeId: 'expA', date: getDaysAgo(2) }),
      makeTx({ id: 'tx3', amount: -300, purposeId: 'expA', date: getDaysAgo(3) }),
    ];

    const result = generateInsights(txs, purposes);
    const savingsStory = result.find(s => s.title === 'Savings Rate');
    expect(savingsStory).toBeUndefined();
  });
});

describe('largestExpense (via generateInsights)', () => {
  it('finds the single largest expense', () => {
    const purposes = [PURPOSE_EXPENSE_A, PURPOSE_EXPENSE_B];

    const txs: Transaction[] = [
      makeTx({ id: 'tx1', amount: -50, purposeId: 'expB', date: getDaysAgo(1) }),
      makeTx({ id: 'tx2', amount: -500, purposeId: 'expA', date: getDaysAgo(5) }),
      makeTx({ id: 'tx3', amount: -100, purposeId: 'expB', date: getDaysAgo(10) }),
    ];

    const result = generateInsights(txs, purposes);
    const largestStory = result.find(s => s.title === 'Largest Expense');
    expect(largestStory).toBeDefined();
    expect(largestStory!.description).toContain('Rent');
    expect(largestStory!.description).toContain('500');
  });

  it('returns null with no expenses', () => {
    const purposes = [PURPOSE_EARNING];

    const txs: Transaction[] = [
      makeTx({ id: 'tx1', amount: 1000, purposeId: 'earn', date: getDaysAgo(1) }),
    ];

    const result = generateInsights(txs, purposes);
    const largestStory = result.find(s => s.title === 'Largest Expense');
    expect(largestStory).toBeUndefined();
  });
});
