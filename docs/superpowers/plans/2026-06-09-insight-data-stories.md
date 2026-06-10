# Insight Data Stories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3 hardcoded static story cards on the Insight page with dynamically generated stories computed from real transaction data.

**Architecture:** Create a new `insights.ts` utility module that aggregates transaction data into story objects. The Insight page imports these stories instead of using hardcoded arrays. Each story is a pure function of transaction data, purpose metadata, and date range. Empty state shows "Gathering wisdom..." when fewer than 3 transactions exist.

**Tech Stack:** TypeScript, Svelte 5 stores ($derived), existing `formatAmountShort` formatter.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/lib/utils/insights.ts` | **NEW** — Story aggregation functions, type definitions, story generator |
| `src/routes/insight/+page.svelte` | **MODIFY** — Import dynamic stories, replace hardcoded array, add empty state |
| `tests/insights.test.ts` | **NEW** — Unit tests for aggregation functions |

---

## Types

```typescript
// src/lib/utils/insights.ts

export interface InsightStory {
  title: string;
  description: string;
  emoji: string;
  color: string;       // Tailwind class like "bg-zen-earn/20"
  priority: number;    // Higher = shown first (0-100)
}
```

---

## Story Generation Functions

Each function takes transactions + purposes + optional date range, returns `InsightStory | null` (null if not enough data).

| Story | Logic | Minimum data |
|-------|-------|-------------|
| **Top Spending Category** | Group expenses by purposeId, sum abs(amount), rank #1 | 3+ expenses |
| **Weekly Spending Trend** | Compare this week's expenses vs last week's | 2+ weeks of data |
| **Savings Rate** | (earnings - expenses) / earnings for current month | 1+ earning + 1+ expense |
| **Largest Single Expense** | Max abs(amount) where accountType=expense, last 30 days | 1+ expense |
| **Party Balance** | Most owed to you or most you owe | 1+ receivable/payable |
| **No-Spend Streak** | Consecutive days with 0 expenses | 2+ days |
| **Account Distribution** | Which payment method is used most | 3+ transactions |

---

### Task 1: Create insight types and story aggregation module

**Files:**
- Create: `src/lib/utils/insights.ts`

- [ ] **Step 1: Create the insights utility module**

```typescript
// src/lib/utils/insights.ts
import { get } from 'svelte/store';
import { transactions, type Transaction } from '$lib/stores/transactions';
import { purposes, type Purpose } from '$lib/stores/purposes';
import { formatAmountShort } from './formatters';

export interface InsightStory {
  title: string;
  description: string;
  emoji: string;
  color: string;
  priority: number;
}

function getExpensesInRange(txs: Transaction[], purposesList: Purpose[], start: string, end: string): Transaction[] {
  return txs.filter(t => {
    const p = purposesList.find(p => p.id === t.purposeId);
    const isExpense = p?.accountType === 'expense' || p?.accountType === 'repaid';
    const inRange = t.date >= start && t.date <= end;
    return isExpense && inRange;
  });
}

function getEarningsInRange(txs: Transaction[], purposesList: Purpose[], start: string, end: string): Transaction[] {
  return txs.filter(t => {
    const p = purposesList.find(p => p.id === t.purposeId);
    const isEarning = p?.accountType === 'earning' || p?.accountType === 'recovered';
    const inRange = t.date >= start && t.date <= end;
    return isEarning && inRange;
  });
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
}
```

- [ ] **Step 2: Add the top spending category story**

```typescript
export function topSpendingCategory(
  txs: Transaction[],
  purposesList: Purpose[]
): InsightStory | null {
  const expenses = txs.filter(t => {
    const p = purposesList.find(p => p.id === t.purposeId);
    return p?.accountType === 'expense' || p?.accountType === 'repaid';
  });

  if (expenses.length < 3) return null;

  const byPurpose: Record<string, number> = {};
  expenses.forEach(t => {
    byPurpose[t.purposeId] = (byPurpose[t.purposeId] || 0) + Math.abs(t.amount);
  });

  const sorted = Object.entries(byPurpose).sort((a, b) => b[1] - a[1]);
  const [topId, topAmount] = sorted[0];
  const purpose = purposesList.find(p => p.id === topId);

  if (!purpose) return null;

  const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const percentage = Math.round((topAmount / totalExpenses) * 100);

  return {
    title: `${purpose.emoji} ${purpose.name} leads spending`,
    description: `You've spent ${formatAmountShort(topAmount)} on ${purpose.name} (${percentage}% of total). That's your biggest category.`,
    emoji: purpose.emoji,
    color: 'bg-zen-spend/15',
    priority: 80
  };
}
```

- [ ] **Step 3: Add weekly spending trend story**

```typescript
export function weeklySpendingTrend(
  txs: Transaction[],
  purposesList: Purpose[]
): InsightStory | null {
  const today = new Date();
  const thisWeekStart = getWeekStart(today);
  const lastWeekStart = getWeekStart(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
  const lastWeekEnd = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const thisWeekExpenses = getExpensesInRange(txs, purposesList, thisWeekStart, getToday());
  const lastWeekExpenses = getExpensesInRange(txs, purposesList, lastWeekStart, lastWeekEnd);

  if (lastWeekExpenses.length === 0 || thisWeekExpenses.length === 0) return null;

  const thisWeekTotal = thisWeekExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const lastWeekTotal = lastWeekExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  if (lastWeekTotal === 0) return null;

  const change = Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100);
  const isDown = change < 0;

  return {
    title: isDown ? 'Spending is down this week' : 'Spending is up this week',
    description: isDown
      ? `Nice work! You've spent ${formatAmountShort(Math.abs(change))} less than last week.`
      : `You've spent ${formatAmountShort(Math.abs(change))} more than last week. Keep an eye on it.`,
    emoji: isDown ? '📉' : '📈',
    color: isDown ? 'bg-zen-earn/20' : 'bg-zen-spend/15',
    priority: isDown ? 90 : 70
  };
}
```

- [ ] **Step 4: Add savings rate story**

```typescript
export function savingsRate(
  txs: Transaction[],
  purposesList: Purpose[]
): InsightStory | null {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const today = getToday();

  const earnings = getEarningsInRange(txs, purposesList, monthStart, today);
  const expenses = getExpensesInRange(txs, purposesList, monthStart, today);

  if (earnings.length === 0 || expenses.length === 0) return null;

  const totalEarnings = earnings.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  if (totalEarnings === 0) return null;

  const rate = Math.round(((totalEarnings - totalExpenses) / totalEarnings) * 100);

  return {
    title: `Saving ${rate}% this month`,
    description: rate > 0
      ? `You've earned ${formatAmountShort(totalEarnings)} and spent ${formatAmountShort(totalExpenses)}. That's a ${rate}% savings rate.`
      : `You've spent more than you earned this month. Time to pause.`,
    emoji: rate > 20 ? '💰' : rate > 0 ? '📊' : '⚠️',
    color: rate > 20 ? 'bg-zen-sage/10' : rate > 0 ? 'bg-zen-almond/20' : 'bg-zen-spend/15',
    priority: rate > 20 ? 85 : 60
  };
}
```

- [ ] **Step 5: Add largest expense story**

```typescript
export function largestExpense(
  txs: Transaction[],
  purposesList: Purpose[]
): InsightStory | null {
  const thirtyDaysAgo = getDaysAgo(30);
  const today = getToday();

  const expenses = getExpensesInRange(txs, purposesList, thirtyDaysAgo, today);
  if (expenses.length < 2) return null;

  const largest = expenses.reduce((max, t) => Math.abs(t.amount) > Math.abs(max.amount) ? t : max);
  const purpose = purposesList.find(p => p.id === largest.purposeId);

  return {
    title: `Biggest expense: ${formatAmountShort(Math.abs(largest.amount))}`,
    description: `${purpose?.emoji || '💸'} ${largest.narration} on ${new Date(largest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    emoji: '💸',
    color: 'bg-zen-spend/10',
    priority: 50
  };
}
```

- [ ] **Step 6: Add no-spend streak story**

```typescript
export function noSpendStreak(
  txs: Transaction[],
  purposesList: Purpose[]
): InsightStory | null {
  if (txs.length < 5) return null;

  const expenses = txs.filter(t => {
    const p = purposesList.find(p => p.id === t.purposeId);
    return p?.accountType === 'expense' || p?.accountType === 'repaid';
  });

  if (expenses.length === 0) return null;

  const expenseDates = new Set(expenses.map(t => t.date));
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (expenseDates.has(dateStr)) break;
    streak++;
  }

  if (streak < 2) return null;

  return {
    title: `${streak}-day no-spend streak`,
    description: streak >= 7
      ? `Incredible! ${streak} days without spending. You're on fire.`
      : `You've gone ${streak} days without logging an expense. Keep it up.`,
    emoji: streak >= 7 ? '🔥' : '✨',
    color: 'bg-zen-sage/10',
    priority: streak >= 7 ? 95 : 65
  };
}
```

- [ ] **Step 7: Add account distribution story**

```typescript
export function accountDistribution(
  txs: Transaction[]
): InsightStory | null {
  if (txs.length < 5) return null;

  const byAccount: Record<string, number> = {};
  txs.forEach(t => {
    const acct = t.account || 'unknown';
    byAccount[acct] = (byAccount[acct] || 0) + 1;
  });

  const sorted = Object.entries(byAccount).sort((a, b) => b[1] - a[1]);
  const [topAccount, topCount] = sorted[0];
  const percentage = Math.round((topCount / txs.length) * 100);

  if (percentage < 40) return null;

  return {
    title: `${topAccount} is your go-to`,
    description: `${percentage}% of your transactions use ${topAccount}. That's ${topCount} transactions.`,
    emoji: topAccount === 'cash' ? '💵' : topAccount === 'bank' ? '🏦' : '📱',
    color: 'bg-zen-almond/20',
    priority: 40
  };
}
```

- [ ] **Step 8: Add the main story generator function**

```typescript
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
    accountDistribution(txs)
  ].filter((s): s is InsightStory => s !== null);

  return stories.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/utils/insights.ts
git commit -m "feat(insight): add dynamic story aggregation utility"
```

---

### Task 2: Update Insight page to use dynamic stories

**Files:**
- Modify: `src/routes/insight/+page.svelte`

- [ ] **Step 1: Import the new utility and replace hardcoded array**

In `src/routes/insight/+page.svelte`, replace the hardcoded `insights` array with dynamic generation:

```svelte
<script lang="ts">
    import { transactions } from "$lib/stores/transactions";
    import { purposes } from "$lib/stores/purposes";
    import { fade, fly } from "svelte/transition";
    import WealthLedger from "$lib/components/WealthLedger.svelte";
    import { formatAmountShort } from "$lib/utils/formatters";
    import { generateInsights, type InsightStory } from "$lib/utils/insights";

    let activeIndex = $state(0);

    let summaryDateStart = $state(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    );
    let summaryDateEnd = $state(new Date().toISOString().split("T")[0]);

    const insights = $derived(generateInsights($transactions, $purposes));
    const isEmpty = $derived($transactions.length < 3);

    let rangeEarnings = $derived.by(() =>
        $transactions
            .filter((t) => {
                const p = $purposes.find((purpose) => purpose.id === t.purposeId);
                const isEarning =
                    p?.accountType === "earning" ||
                    p?.accountType === "recovered" ||
                    p?.accountType === "payable";
                const inRange =
                    (!summaryDateStart || t.date >= summaryDateStart) &&
                    (!summaryDateEnd || t.date <= summaryDateEnd);
                return isEarning && inRange;
            })
            .reduce((acc, t) => acc + Math.abs(t.amount), 0),
    );

    let rangeExpenses = $derived.by(() =>
        $transactions
            .filter((t) => {
                const p = $purposes.find((purpose) => purpose.id === t.purposeId);
                const isExpense = p?.accountType === "expense" || p?.accountType === "repaid";
                const inRange =
                    (!summaryDateStart || t.date >= summaryDateStart) &&
                    (!summaryDateEnd || t.date <= summaryDateEnd);
                return isExpense && inRange;
            })
            .reduce((acc, t) => acc + Math.abs(t.amount), 0),
    );
</script>
```

- [ ] **Step 2: Replace the story cards section with empty state handling**

Replace the story cards `<section>` block:

```svelte
    <section class="flex flex-col justify-center mb-10">
        {#if isEmpty}
            <div class="w-full aspect-[4/5] max-h-[420px] bg-zen-panel rounded-zen border border-zen-herb/10 flex flex-col items-center justify-center p-10 text-center" in:fade={{ duration: 400 }}>
                <span class="text-5xl mb-4" aria-hidden="true">🌿</span>
                <h2 class="text-zen-sage text-2xl font-heading font-extrabold mb-3">Gathering wisdom...</h2>
                <p class="text-zen-herb font-body font-bold text-base leading-relaxed max-w-xs">
                    Add at least 3 transactions and I'll start showing you real insights.
                </p>
            </div>
        {:else}
            <div class="relative w-full aspect-[4/5] max-h-[420px]">
                {#each insights as insight, i (insight.title)}
                    {#if activeIndex === i}
                        <div
                            class="absolute inset-0 {insight.color} rounded-zen shadow-zen-soft p-10 flex flex-col justify-between border border-zen-herb/10"
                            in:fly={{ x: 300, duration: 600, opacity: 0 }}
                            out:fly={{ x: -300, duration: 600, opacity: 0 }}
                        >
                            <div>
                                <span class="text-6xl mb-6 block">{insight.emoji}</span>
                                <h2 class="text-zen-sage text-3xl font-heading font-extrabold mb-4 leading-tight">
                                    {insight.title}
                                </h2>
                            </div>
                            <p class="text-zen-sage/80 font-body font-bold text-xl leading-relaxed">
                                {insight.description}
                            </p>
                            <div class="flex space-x-2 mt-8">
                                {#each insights as _, dotIndex}
                                    <div
                                        class="h-1.5 rounded-full transition-all duration-300 {activeIndex === dotIndex ? 'w-8 bg-zen-sage' : 'w-2 bg-zen-sage/20'}"
                                    ></div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                {/each}
                {#if insights.length > 1}
                    <button
                        class="absolute inset-y-0 left-0 w-1/3 z-20 appearance-none bg-transparent border-none cursor-pointer"
                        onclick={() => (activeIndex = Math.max(0, activeIndex - 1))}
                        aria-label="Previous insight"
                    ></button>
                    <button
                        class="absolute inset-y-0 right-0 w-1/3 z-20 appearance-none bg-transparent border-none cursor-pointer"
                        onclick={() => (activeIndex = Math.min(insights.length - 1, activeIndex + 1))}
                        aria-label="Next insight"
                    ></button>
                {/if}
            </div>
            <p class="text-center mt-6 text-zen-herb font-body font-bold text-sm uppercase tracking-widest opacity-40">
                {insights.length > 1 ? 'Tap sides for more stories' : 'More stories as you log transactions'}
            </p>
        {/if}
    </section>
```

- [ ] **Step 3: Reset activeIndex when insights change**

Add this effect below the existing state declarations:

```svelte
    $effect(() => {
        insights;
        activeIndex = 0;
    });
```

- [ ] **Step 4: Run existing tests to verify no regressions**

Run: `npm test`
Expected: All 19 Playwright tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/routes/insight/+page.svelte
git commit -m "feat(insight): wire story cards to real transaction data"
```

---

### Task 3: Add unit tests for insight aggregation

**Files:**
- Create: `tests/insights.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
// tests/insights.test.ts
import { describe, it, expect } from 'vitest';
import {
  topSpendingCategory,
  weeklySpendingTrend,
  savingsRate,
  noSpendStreak,
  accountDistribution,
  generateInsights,
  type InsightStory
} from '../src/lib/utils/insights';
import type { Transaction } from '../src/lib/stores/transactions';
import type { Purpose } from '../src/lib/stores/purposes';

const mockPurposes: Purpose[] = [
  { id: 'p1', name: 'Coffee', emoji: '☕', accountType: 'expense', aliases: [], createdAt: '', updatedAt: '' },
  { id: 'p2', name: 'Groceries', emoji: '🛒', accountType: 'expense', aliases: [], createdAt: '', updatedAt: '' },
  { id: 'p3', name: 'Income', emoji: '💰', accountType: 'earning', aliases: [], createdAt: '', updatedAt: '' },
  { id: 'p4', name: 'Refund', emoji: '↩️', accountType: 'receivable', aliases: [], createdAt: '', updatedAt: '' },
];

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    narration: 'Test',
    amount: -100,
    purposeId: 'p1',
    date: new Date().toISOString().split('T')[0],
    createdAt: '',
    updatedAt: '',
    ...overrides
  };
}

describe('topSpendingCategory', () => {
  it('returns null with fewer than 3 expenses', () => {
    const txs = [
      tx({ purposeId: 'p1' }),
      tx({ id: 't2', purposeId: 'p1' }),
    ];
    expect(topSpendingCategory(txs, mockPurposes)).toBeNull();
  });

  it('returns top category with 3+ expenses', () => {
    const txs = [
      tx({ purposeId: 'p1', amount: -50 }),
      tx({ id: 't2', purposeId: 'p1', amount: -30 }),
      tx({ id: 't3', purposeId: 'p1', amount: -20 }),
      tx({ id: 't4', purposeId: 'p2', amount: -10 }),
    ];
    const result = topSpendingCategory(txs, mockPurposes);
    expect(result).not.toBeNull();
    expect(result!.title).toContain('Coffee');
  });
});

describe('noSpendStreak', () => {
  it('returns null with fewer than 5 transactions', () => {
    expect(noSpendStreak([], mockPurposes)).toBeNull();
  });

  it('detects a streak', () => {
    const today = new Date();
    const txs: Transaction[] = [];
    // No expenses for last 3 days, one expense 4 days ago
    for (let i = 4; i < 10; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      txs.push(tx({
        id: `t${i}`,
        purposeId: 'p1',
        date: d.toISOString().split('T')[0]
      }));
    }
    const result = noSpendStreak(txs, mockPurposes);
    expect(result).not.toBeNull();
    expect(result!.title).toContain('3-day');
  });
});

describe('accountDistribution', () => {
  it('returns null with fewer than 5 transactions', () => {
    expect(accountDistribution([])).toBeNull();
  });

  it('detects dominant account', () => {
    const txs = [
      tx({ account: 'bank' }),
      tx({ id: 't2', account: 'bank' }),
      tx({ id: 't3', account: 'bank' }),
      tx({ id: 't4', account: 'bank' }),
      tx({ id: 't5', account: 'cash' }),
    ];
    const result = accountDistribution(txs);
    expect(result).not.toBeNull();
    expect(result!.title).toContain('bank');
  });
});

describe('generateInsights', () => {
  it('returns empty array with no transactions', () => {
    expect(generateInsights([], mockPurposes)).toEqual([]);
  });

  it('returns stories sorted by priority', () => {
    const txs = Array.from({ length: 20 }, (_, i) =>
      tx({ id: `t${i}`, purposeId: i % 2 === 0 ? 'p1' : 'p2', amount: -(i * 10 + 10) })
    );
    const results = generateInsights(txs, mockPurposes);
    expect(results.length).toBeGreaterThan(0);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].priority).toBeLessThanOrEqual(results[i - 1].priority);
    }
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `npx vitest run tests/insights.test.ts`
Expected: All tests pass.

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass (19 Playwright + new vitest).

- [ ] **Step 4: Commit**

```bash
git add tests/insights.test.ts
git commit -m "test(insight): add unit tests for story aggregation"
```

---

### Task 4: Manual QA and polish

- [ ] **Step 1: Manual test on localhost**

Run: `npm run dev`
Verify:
- Empty state shows "Gathering wisdom..." with leaf emoji
- After adding 3 transactions, stories appear
- Stories change as more transactions are added
- Left/right tap navigation works
- Dot indicators update
- Dark mode: stories render correctly
- Mobile: aspect ratio holds, text readable

- [ ] **Step 2: Verify Playwright tests still pass**

Run: `npm test`
Expected: All pass.

- [ ] **Step 3: Final commit if any polish changes needed**

```bash
git add -A
git commit -m "fix(insight): polish story card rendering"
```

---

## Summary

| Task | Files | Description |
|------|-------|-------------|
| 1 | `src/lib/utils/insights.ts` | Story aggregation utility with 6 story generators |
| 2 | `src/routes/insight/+page.svelte` | Wire dynamic stories, add empty state |
| 3 | `tests/insights.test.ts` | Unit tests for aggregation functions |
| 4 | Manual QA | Verify on localhost, check edge cases |

**Stories generated:** Top Spending Category, Weekly Trend, Savings Rate, Largest Expense, No-Spend Streak, Account Distribution. Up to 5 shown, sorted by priority.
