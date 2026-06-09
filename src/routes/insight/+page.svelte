<script lang="ts">
    import { transactions } from "$lib/stores/transactions";
    import { purposes } from "$lib/stores/purposes";
    import { settings } from "$lib/stores/settings";
    import { fade, fly } from "svelte/transition";
    import WealthLedger from "$lib/components/WealthLedger.svelte";
    import { formatAmountShort } from "$lib/utils/formatters";

    let activeIndex = $state(0);

    // Date range state
    let summaryDateStart = $state(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    );
    let summaryDateEnd = $state(new Date().toISOString().split("T")[0]);

    // Preset state
    type Preset = "week" | "month" | "30days" | "year";
    let selectedPreset = $state<Preset>("month");

    // Currency from settings
    let currency = $derived($settings.profile.currency);

    // Check if transactions exist
    let hasTransactions = $derived($transactions.length > 0);

    // Transaction counts for period comparison
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

    // Previous period calculations for comparison
    let previousPeriodEarnings = $derived.by(() => {
        const daysDiff = (new Date(summaryDateEnd).getTime() - new Date(summaryDateStart).getTime()) / (1000 * 60 * 60 * 24);
        const prevEnd = new Date(new Date(summaryDateStart).getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - daysDiff * 24 * 60 * 60 * 1000);
        const prevStartStr = prevStart.toISOString().split("T")[0];
        const prevEndStr = prevEnd.toISOString().split("T")[0];

        return $transactions
            .filter((t) => {
                const p = $purposes.find((purpose) => purpose.id === t.purposeId);
                const isEarning =
                    p?.accountType === "earning" ||
                    p?.accountType === "recovered" ||
                    p?.accountType === "payable";
                const inRange = t.date >= prevStartStr && t.date <= prevEndStr;
                return isEarning && inRange;
            })
            .reduce((acc, t) => acc + Math.abs(t.amount), 0);
    });

    let previousPeriodExpenses = $derived.by(() => {
        const daysDiff = (new Date(summaryDateEnd).getTime() - new Date(summaryDateStart).getTime()) / (1000 * 60 * 60 * 24);
        const prevEnd = new Date(new Date(summaryDateStart).getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - daysDiff * 24 * 60 * 60 * 1000);
        const prevStartStr = prevStart.toISOString().split("T")[0];
        const prevEndStr = prevEnd.toISOString().split("T")[0];

        return $transactions
            .filter((t) => {
                const p = $purposes.find((purpose) => purpose.id === t.purposeId);
                const isExpense = p?.accountType === "expense" || p?.accountType === "repaid";
                const inRange = t.date >= prevStartStr && t.date <= prevEndStr;
                return isExpense && inRange;
            })
            .reduce((acc, t) => acc + Math.abs(t.amount), 0);
    });

    // Receivables and payables
    let openReceivables = $derived($settings.summaries.global.receivables);
    let openPayables = $derived($settings.summaries.global.payables);

    // Check if any transactions in current month
    let currentMonth = new Date().toISOString().slice(0, 7);
    let hasCurrentMonthTransactions = $derived(
        $transactions.some((t) => t.date.startsWith(currentMonth))
    );

    // Dynamic insight cards
    let insights = $derived.by(() => {
        const cards: Array<{
            title: string;
            description: string;
            emoji: string;
            color: string;
        }> = [];

        // 1. Spending ahead of income
        if (rangeExpenses > rangeEarnings && rangeEarnings > 0) {
            cards.push({
                title: "Spending ahead of income",
                description: `Your expenses (${currency}${formatAmountShort(rangeExpenses)}) exceed earnings (${currency}${formatAmountShort(rangeEarnings)}). Consider reviewing your spending.`,
                emoji: "📊",
                color: "bg-zen-spend/20",
            });
        }

        // 2. Spending down vs previous period
        if (previousPeriodExpenses > 0 && rangeExpenses < previousPeriodExpenses) {
            const savings = Math.round(((previousPeriodExpenses - rangeExpenses) / previousPeriodExpenses) * 100);
            cards.push({
                title: `Spending down ${savings}%`,
                description: `Nice work! You've spent ${currency}${formatAmountShort(previousPeriodExpenses - rangeExpenses)} less compared to the previous period.`,
                emoji: "🥗",
                color: "bg-zen-earn/20",
            });
        }

        // 3. Income up vs previous period
        if (previousPeriodEarnings > 0 && rangeEarnings > previousPeriodEarnings) {
            const growth = Math.round(((rangeEarnings - previousPeriodEarnings) / previousPeriodEarnings) * 100);
            cards.push({
                title: `Income up ${growth}%`,
                description: `Great progress! Your earnings increased by ${currency}${formatAmountShort(rangeEarnings - previousPeriodEarnings)} compared to last period.`,
                emoji: "📈",
                color: "bg-zen-sage/10",
            });
        }

        // 4. Open receivables
        if (openReceivables > 0) {
            cards.push({
                title: `${currency}${formatAmountShort(openReceivables)} in receivables outstanding`,
                description: `You have money waiting to come in. Follow up on outstanding receivables to keep cash flowing.`,
                emoji: "💰",
                color: "bg-zen-earn/20",
            });
        }

        // 5. Open payables
        if (openPayables > 0) {
            cards.push({
                title: `${currency}${formatAmountShort(openPayables)} in payables pending`,
                description: `You have obligations due. Plan your payments to maintain good relationships.`,
                emoji: "📉",
                color: "bg-zen-almond/20",
            });
        }

        // 6. No transactions this month
        if (!hasCurrentMonthTransactions) {
            cards.push({
                title: "First transaction will unlock insights",
                description: `Start logging your income and expenses to see personalized financial insights.`,
                emoji: "🌱",
                color: "bg-zen-sage/10",
            });
        }

        // 7. Default: All clear
        if (cards.length === 0) {
            cards.push({
                title: "All clear. No red flags this period.",
                description: `Your finances look balanced. Keep up the good work!`,
                emoji: "🌿",
                color: "bg-zen-sage/10",
            });
        }

        // Limit to max 4 cards
        return cards.slice(0, 4);
    });

    // Preset functions
    function setPreset(preset: Preset) {
        selectedPreset = preset;
        const today = new Date();

        switch (preset) {
            case "week": {
                const startOfWeek = new Date(today);
                const dayOfWeek = startOfWeek.getDay();
                const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start
                startOfWeek.setDate(today.getDate() - diff);
                summaryDateStart = startOfWeek.toISOString().split("T")[0];
                summaryDateEnd = today.toISOString().split("T")[0];
                break;
            }
            case "month": {
                summaryDateStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
                summaryDateEnd = today.toISOString().split("T")[0];
                break;
            }
            case "30days": {
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);
                summaryDateStart = thirtyDaysAgo.toISOString().split("T")[0];
                summaryDateEnd = today.toISOString().split("T")[0];
                break;
            }
            case "year": {
                summaryDateStart = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
                summaryDateEnd = today.toISOString().split("T")[0];
                break;
            }
        }
    }

    // Sync preset when dates change manually
    $effect(() => {
        const startDate = new Date(summaryDateStart);
        const endDate = new Date(summaryDateEnd);
        const today = new Date();

        // Check if matches "This Week"
        const weekStart = new Date(today);
        const dayOfWeek = weekStart.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(today.getDate() - diff);
        const weekStartStr = weekStart.toISOString().split("T")[0];
        const todayStr = today.toISOString().split("T")[0];

        if (summaryDateStart === weekStartStr && summaryDateEnd === todayStr) {
            selectedPreset = "week";
            return;
        }

        // Check if matches "This Month"
        const monthStartStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
        if (summaryDateStart === monthStartStr && summaryDateEnd === todayStr) {
            selectedPreset = "month";
            return;
        }

        // Check if matches "Last 30 Days"
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
        if (summaryDateStart === thirtyDaysAgoStr && summaryDateEnd === todayStr) {
            selectedPreset = "30days";
            return;
        }

        // Check if matches "This Year"
        const yearStartStr = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
        if (summaryDateStart === yearStartStr && summaryDateEnd === todayStr) {
            selectedPreset = "year";
            return;
        }
    });

    const chipClass = (active: boolean) =>
        `zen-preset-chip ${active ? "zen-preset-chip--active" : "zen-preset-chip--idle"}`;
</script>

<div class="flex flex-col min-h-screen bg-zen-oat pt-8 px-6 pb-24 overflow-y-auto no-scrollbar max-w-lg mx-auto w-full">
    <section class="flex flex-col justify-center mb-10">
        {#if !hasTransactions}
            <!-- Empty state: no transactions -->
            <div class="flex flex-col items-center justify-center py-16" in:fade={{ duration: 400 }}>
                <span class="text-6xl mb-6" aria-hidden="true">🍃</span>
                <h2 class="text-zen-herb font-heading font-bold text-xl mb-3">Gathering wisdom...</h2>
                <p class="text-zen-herb text-sm font-body font-semibold max-w-xs mx-auto text-center leading-relaxed">
                    Log your first transaction to unlock personalized insights.
                </p>
            </div>
        {:else}
            <!-- Insight cards carousel -->
            <div class="relative w-full aspect-[4/5] max-h-[420px]">
                {#each insights as insight, i}
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
            {#if insights.length > 1}
                <p class="text-center mt-6 text-zen-herb font-body font-bold text-sm uppercase tracking-widest opacity-40">
                    Tap sides for more stories
                </p>
            {/if}
        {/if}
    </section>

    <section class="mb-10" in:fade={{ delay: 150 }}>
        <div class="flex items-center gap-3 mb-4">
            <h2 class="text-zen-sage font-heading font-black text-xl">Weekly Range Review</h2>
            <div class="h-px flex-1 bg-zen-herb/10"></div>
        </div>
        <article class="bg-zen-panel rounded-zen p-5 border border-zen-herb/10 space-y-4">
            <p class="text-zen-herb text-sm font-body font-semibold">
                Compare income and spending over a date range. A calm weekly ritual, not a daily dashboard chore.
            </p>

            <!-- Preset chips -->
            <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                    type="button"
                    onclick={() => setPreset("week")}
                    class={chipClass(selectedPreset === "week")}
                >
                    This Week
                </button>
                <button
                    type="button"
                    onclick={() => setPreset("month")}
                    class={chipClass(selectedPreset === "month")}
                >
                    This Month
                </button>
                <button
                    type="button"
                    onclick={() => setPreset("30days")}
                    class={chipClass(selectedPreset === "30days")}
                >
                    Last 30 Days
                </button>
                <button
                    type="button"
                    onclick={() => setPreset("year")}
                    class={chipClass(selectedPreset === "year")}
                >
                    This Year
                </button>
            </div>

            <div class="flex items-center gap-2 bg-zen-input p-2 rounded-xl border border-zen-herb/10">
                <label for="insight-range-start" class="sr-only">Range start</label>
                <input id="insight-range-start" type="date" bind:value={summaryDateStart} class="bg-transparent border-none text-xs text-zen-sage font-semibold flex-1" />
                <span class="text-zen-herb/40 text-xs" aria-hidden="true">to</span>
                <label for="insight-range-end" class="sr-only">Range end</label>
                <input id="insight-range-end" type="date" bind:value={summaryDateEnd} class="bg-transparent border-none text-xs text-zen-sage font-semibold flex-1" />
            </div>
            <div class="flex gap-6 items-center">
                <div class="flex-1">
                    <span class="text-[10px] font-bold text-zen-herb/70 uppercase tracking-widest">Income</span>
                    <p class="text-xl font-heading font-black text-zen-earn tabular-nums">{currency}{formatAmountShort(rangeEarnings)}</p>
                </div>
                <div class="w-px h-10 bg-zen-herb/10" aria-hidden="true"></div>
                <div class="flex-1">
                    <span class="text-[10px] font-bold text-zen-herb/70 uppercase tracking-widest">Expenses</span>
                    <p class="text-xl font-heading font-black text-zen-spend tabular-nums">{currency}{formatAmountShort(rangeExpenses)}</p>
                </div>
            </div>
        </article>
    </section>

    <section class="mt-4">
        <div class="flex items-center gap-3 mb-6">
            <h2 class="text-zen-sage font-heading font-black text-2xl">Wealth Ledger</h2>
            <div class="h-px flex-1 bg-zen-herb/10"></div>
        </div>
        <WealthLedger />
    </section>
</div>

<style>
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }

    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .zen-preset-chip {
        padding: 0.375rem 0.875rem;
        border-radius: 9999px;
        font-size: 0.6875rem;
        font-weight: 700;
        white-space: nowrap;
        transition:
            transform 0.15s cubic-bezier(0.33, 1, 0.68, 1),
            background-color 0.2s cubic-bezier(0.33, 1, 0.68, 1),
            color 0.2s cubic-bezier(0.33, 1, 0.68, 1);
    }

    .zen-preset-chip:active {
        transform: scale(0.96);
    }

    .zen-preset-chip--active {
        background-color: var(--color-zen-sage);
        color: var(--color-zen-on-primary);
        box-shadow: var(--shadow-zen);
    }

    .zen-preset-chip--idle {
        background-color: var(--color-zen-panel);
        color: var(--color-zen-herb);
        border: 1px solid var(--color-zen-hairline);
    }
</style>