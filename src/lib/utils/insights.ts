import type { Transaction } from '$lib/stores/transactions';
import type { Purpose } from '$lib/stores/purposes';
import { formatAmountShort } from './formatters';

export interface InsightStory {
  title: string;
  description: string;
  emoji: string;
  color: string;       // Tailwind class like "bg-zen-earn/20"
  priority: number;    // Higher = shown first (0-100)
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

function getWeekStart(): string {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday as start
  date.setDate(date.getDate() - diff);
  return date.toISOString().split('T')[0];
}

function getExpensesInRange(
  txs: Transaction[],
  purposesList: Purpose[],
  startDate: string,
  endDate: string
): Transaction[] {
  return txs.filter(tx => {
    const purpose = purposesList.find(p => p.id === tx.purposeId);
    const isExpense = purpose?.accountType === 'expense';
    const inRange = tx.date >= startDate && tx.date <= endDate;
    return isExpense && inRange;
  });
}

function getEarningsInRange(
  txs: Transaction[],
  purposesList: Purpose[],
  startDate: string,
  endDate: string
): Transaction[] {
  return txs.filter(tx => {
    const purpose = purposesList.find(p => p.id === tx.purposeId);
    const isEarning = purpose?.accountType === 'earning';
    const inRange = tx.date >= startDate && tx.date <= endDate;
    return isEarning && inRange;
  });
}

function topSpendingCategory(
  txs: Transaction[],
  purposesList: Purpose[]
): InsightStory | null {
  const expenses = txs.filter(tx => {
    const purpose = purposesList.find(p => p.id === tx.purposeId);
    return purpose?.accountType === 'expense';
  });

  if (expenses.length < 3) return null;

  const categoryTotals = new Map<string, number>();
  expenses.forEach(tx => {
    const current = categoryTotals.get(tx.purposeId) || 0;
    categoryTotals.set(tx.purposeId, current + Math.abs(tx.amount));
  });

  let topId = '';
  let topAmount = 0;
  categoryTotals.forEach((amount, id) => {
    if (amount > topAmount) {
      topAmount = amount;
      topId = id;
    }
  });

  const purpose = purposesList.find(p => p.id === topId);
  if (!purpose) return null;

  return {
    title: `Top Spending: ${purpose.name}`,
    description: `You spent ${formatAmountShort(topAmount)} on ${purpose.name} — your biggest category.`,
    emoji: purpose.emoji,
    color: 'bg-zen-expense/20',
    priority: 90
  };
}

function weeklySpendingTrend(
  txs: Transaction[],
  purposesList: Purpose[]
): InsightStory | null {
  const today = getToday();
  const thisWeekStart = getWeekStart();
  const lastWeekStart = getDaysAgo(new Date().getDay() + 7);
  const lastWeekEnd = getDaysAgo(new Date().getDay());

  const thisWeekExpenses = getExpensesInRange(txs, purposesList, thisWeekStart, today);
  const lastWeekExpenses = getExpensesInRange(txs, purposesList, lastWeekStart, lastWeekEnd);

  if (lastWeekExpenses.length === 0 || thisWeekExpenses.length === 0) return null;

  const thisWeekTotal = thisWeekExpenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const lastWeekTotal = lastWeekExpenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  if (lastWeekTotal === 0) return null;

  const change = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
  const direction = change > 0 ? 'up' : 'down';
  const absChange = Math.abs(change).toFixed(0);

  return {
    title: `Weekly Trend`,
    description: `Spending is ${direction} ${absChange}% from last week.`,
    emoji: direction === 'up' ? '📈' : '📉',
    color: direction === 'up' ? 'bg-zen-expense/20' : 'bg-zen-earn/20',
    priority: 80
  };
}

function savingsRate(
  txs: Transaction[],
  purposesList: Purpose[]
): InsightStory | null {
  const today = getToday();
  const monthStart = today.slice(0, 7) + '-01';

  const earnings = getEarningsInRange(txs, purposesList, monthStart, today);
  const expenses = getExpensesInRange(txs, purposesList, monthStart, today);

  if (earnings.length < 1 || expenses.length < 1) return null;

  const totalEarnings = earnings.reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpenses = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  if (totalEarnings <= 0) return null;

  const rate = ((totalEarnings - totalExpenses) / totalEarnings) * 100;
  const rateStr = rate.toFixed(0);

  return {
    title: `Savings Rate`,
    description: `You're saving ${rateStr}% of your income this month.`,
    emoji: rate >= 20 ? '🎉' : '💰',
    color: rate >= 20 ? 'bg-zen-earn/20' : 'bg-amber-500/20',
    priority: 85
  };
}

function largestExpense(
  txs: Transaction[],
  purposesList: Purpose[]
): InsightStory | null {
  const today = getToday();
  const thirtyDaysAgo = getDaysAgo(30);

  const expenses = getExpensesInRange(txs, purposesList, thirtyDaysAgo, today);
  if (expenses.length < 1) return null;

  let largest = expenses[0];
  expenses.forEach(tx => {
    if (Math.abs(tx.amount) > Math.abs(largest.amount)) {
      largest = tx;
    }
  });

  const purpose = purposesList.find(p => p.id === largest.purposeId);

  return {
    title: `Largest Expense`,
    description: `${formatAmountShort(largest.amount)} on ${purpose?.name || 'Unknown'}${largest.narration ? `: ${largest.narration}` : ''}`,
    emoji: '💸',
    color: 'bg-zen-expense/20',
    priority: 75
  };
}

function noSpendStreak(
  txs: Transaction[],
  purposesList: Purpose[]
): InsightStory | null {
  const today = getToday();
  const expenses = txs.filter(tx => {
    const purpose = purposesList.find(p => p.id === tx.purposeId);
    return purpose?.accountType === 'expense';
  });

  if (expenses.length === 0) return null;

  const expenseDates = new Set(expenses.map(tx => tx.date));
  let streak = 0;
  let currentDate = new Date();
  const maxDays = 365;

  for (let i = 0; i < maxDays; i++) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (expenseDates.has(dateStr)) break;
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  if (streak < 2) return null;

  return {
    title: `No-Spend Streak`,
    description: `${streak} days without spending! Keep it up.`,
    emoji: '🔥',
    color: 'bg-zen-earn/20',
    priority: 70
  };
}

function accountDistribution(
  txs: Transaction[],
  purposesList: Purpose[]
): InsightStory | null {
  if (txs.length < 3) return null;

  const accountCounts = new Map<string, number>();
  txs.forEach(tx => {
    const account = tx.account || 'cash';
    accountCounts.set(account, (accountCounts.get(account) || 0) + 1);
  });

  let topAccount = 'cash';
  let topCount = 0;
  accountCounts.forEach((count, account) => {
    if (count > topCount) {
      topCount = count;
      topAccount = account;
    }
  });

  const percentage = ((topCount / txs.length) * 100).toFixed(0);

  return {
    title: `Preferred Method`,
    description: `${percentage}% of transactions use ${topAccount}.`,
    emoji: '💳',
    color: 'bg-blue-500/20',
    priority: 60
  };
}

export function generateInsights(
  txs: Transaction[],
  purposesList: Purpose[]
): InsightStory[] {
  const stories: InsightStory[] = [
    topSpendingCategory(txs, purposesList),
    weeklySpendingTrend(txs, purposesList),
    savingsRate(txs, purposesList),
    largestExpense(txs, purposesList),
    noSpendStreak(txs, purposesList),
    accountDistribution(txs, purposesList)
  ].filter((story): story is InsightStory => story !== null);

  stories.sort((a, b) => b.priority - a.priority);
  return stories.slice(0, 5);
}
