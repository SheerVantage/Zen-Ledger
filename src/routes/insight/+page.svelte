<script lang="ts">
    import { transactions } from "$lib/stores/transactions";
    import { purposes } from "$lib/stores/purposes";
    import { fade, fly } from "svelte/transition";
    import WealthLedger from "$lib/components/WealthLedger.svelte";
    import { formatAmountShort } from "$lib/utils/formatters";
    import { generateInsights } from "$lib/utils/insights";

    let insights = $derived(generateInsights($transactions, $purposes));

    let activeIndex = $state(0);

    let summaryDateStart = $state(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    );
    let summaryDateEnd = $state(new Date().toISOString().split("T")[0]);

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

<div class="flex flex-col min-h-screen bg-zen-oat pt-8 px-6 pb-24 overflow-y-auto no-scrollbar max-w-lg mx-auto w-full">
    <section class="flex flex-col justify-center mb-10">
        {#if insights.length === 0}
            <div class="flex flex-col items-center justify-center py-16 text-center">
                <span class="text-5xl mb-4 block">🧘</span>
                <h3 class="text-zen-sage font-heading font-bold text-xl mb-2">Gathering wisdom...</h3>
                <p class="text-zen-herb font-body text-sm">Add at least 3 transactions to unlock personalized insights.</p>
            </div>
        {:else}
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
            </div>
            <p class="text-center mt-6 text-zen-herb font-body font-bold text-sm uppercase tracking-widest opacity-40">
                Tap sides for more stories
            </p>
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
                    <p class="text-xl font-heading font-black text-zen-earn tabular-nums">{formatAmountShort(rangeEarnings)}</p>
                </div>
                <div class="w-px h-10 bg-zen-herb/10" aria-hidden="true"></div>
                <div class="flex-1">
                    <span class="text-[10px] font-bold text-zen-herb/70 uppercase tracking-widest">Expenses</span>
                    <p class="text-xl font-heading font-black text-zen-spend tabular-nums">{formatAmountShort(rangeExpenses)}</p>
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
</style>
