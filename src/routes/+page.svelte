<script lang="ts">
    import StatusRing from "$lib/components/StatusRing.svelte";
    import TransactionCard from "$lib/components/TransactionCard.svelte";
    import { transactions } from "$lib/stores/transactions";
    import { purposes } from "$lib/stores/purposes";
    import { settings } from "$lib/stores/settings";
    import { recurring, type RecurringTemplate } from "$lib/stores/recurring";
    import AccrualModal from "$lib/components/AccrualModal.svelte";
    import { fade, fly, slide } from "svelte/transition";
    import { formatAmountShort } from "$lib/utils/formatters";

    let userName = $derived($settings.profile.name);
    let isDetailsOpen = $state(false);
    let isAccrualModalOpen = $state(false);
    let activeTemplate = $state<RecurringTemplate | null>(null);

    function openAccrual(template: RecurringTemplate) {
        activeTemplate = template;
        isAccrualModalOpen = true;
    }

    let totalSpentToday = $derived.by(() => {
        const today = new Date().toISOString().split("T")[0];
        return $transactions
            .filter((t) => {
                const p = $purposes.find((purpose) => purpose.id === t.purposeId);
                return t.date === today && p?.accountType === "expense";
            })
            .reduce((acc, t) => acc + Math.abs(t.amount), 0);
    });

    let netBalanceValue = $derived($settings.summaries.global.balance);
    let netPosition = $derived($settings.summaries.global.netPosition);
    let planning = $derived($settings.summaries.planning);
    let loans = $derived($settings.summaries.loans);

    let safeToSpendAmount = $derived(
        Math.max(0, $settings.profile.dailyBudget - totalSpentToday),
    );
    let safeToSpend = $derived(
        `${$settings.profile.currency}${safeToSpendAmount.toFixed(0)}`,
    );
    let ringProgress = $derived(
        $settings.profile.dailyBudget > 0
            ? Math.min(1, Math.max(0, safeToSpendAmount / $settings.profile.dailyBudget))
            : 1,
    );

    let greeting = $derived.by(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    });

    let dailyStatus = $derived.by(() => {
        const remaining = safeToSpendAmount;
        const currency = $settings.profile.currency;
        if (remaining <= 0) {
            return `You've reached today's budget (${currency}${$settings.profile.dailyBudget.toFixed(0)}).`;
        }
        if (totalSpentToday === 0) {
            return `Quiet day so far. ${currency}${remaining.toFixed(0)} left to spend.`;
        }
        return `You've spent ${currency}${totalSpentToday.toFixed(0)} today. ${currency}${remaining.toFixed(0)} left.`;
    });

    const recentTransactions = $derived(
        [...$transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3),
    );

    let isEmptyLedger = $derived($transactions.length === 0);
</script>

<div class="flex flex-col min-h-screen max-w-lg mx-auto w-full">
    <section class="px-6 pt-3 pb-2" in:fade={{ delay: 100 }}>
        <header class="mb-1 px-1">
            <h1 class="text-zen-sage font-heading font-bold text-xl">{greeting}, {userName}.</h1>
            <p class="text-zen-herb text-sm font-body font-semibold mt-1 max-w-prose">{dailyStatus}</p>
        </header>
        <StatusRing progress={ringProgress} amount={safeToSpend} compact />
    </section>

    {#if isEmptyLedger}
        <section class="px-6 py-8 text-center" in:fade={{ delay: 200 }}>
            <p class="text-zen-herb text-sm font-body font-semibold max-w-xs mx-auto leading-relaxed">
                Tap the <span class="text-zen-sage font-bold">+</span> button below to log your first transaction.
            </p>
        </section>
    {/if}

    <section class="px-6 py-3" in:fade={{ delay: 200 }}>
        <button
            type="button"
            onclick={() => (isDetailsOpen = !isDetailsOpen)}
            class="w-full flex items-center justify-between bg-zen-panel border border-zen-herb/10 rounded-zen px-4 py-3 text-left shadow-sm hover:shadow-zen-soft transition-all active:scale-[0.99]"
            aria-expanded={isDetailsOpen}
        >
            <span class="text-zen-sage font-heading font-bold text-sm">Financial details</span>
            <span class="text-zen-herb text-xs font-bold uppercase tracking-widest">
                {isDetailsOpen ? "Hide" : "Show"}
            </span>
        </button>

        {#if isDetailsOpen}
            <div transition:slide class="mt-3 space-y-3">
                <div class="grid grid-cols-2 gap-3">
                    <article class="bg-zen-panel p-4 rounded-zen border border-zen-herb/10 flex flex-col">
                        <span class="text-[10px] uppercase tracking-[0.15em] text-zen-herb font-bold opacity-70 mb-1">Liquid Cash</span>
                        <span class="text-zen-sage font-heading font-black text-xl tabular-nums leading-none">{formatAmountShort(netPosition)}</span>
                    </article>
                    <article class="bg-zen-panel p-4 rounded-zen border border-zen-herb/10 flex flex-col">
                        <span class="text-[10px] uppercase tracking-[0.15em] text-zen-herb font-bold opacity-70 mb-1">Net Worth</span>
                        <span class="text-zen-sage font-heading font-black text-xl tabular-nums leading-none">{formatAmountShort(netBalanceValue)}</span>
                    </article>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <article class="bg-zen-sage/5 rounded-zen p-3 border border-zen-sage/10 space-y-2">
                        <span class="text-[10px] font-bold text-zen-sage uppercase tracking-widest">Planning</span>
                        <div class="flex justify-between text-xs tabular-nums">
                            <span class="text-zen-earn font-black">+{formatAmountShort(planning.expectedInflow)}</span>
                            <span class="text-zen-spend font-black">-{formatAmountShort(planning.expectedOutflow)}</span>
                        </div>
                        {#if planning.expectedInflow === 0 && planning.expectedOutflow === 0}
                            <p class="text-[10px] text-zen-herb/50 italic">No future plans yet</p>
                        {/if}
                    </article>
                    <article class="bg-zen-almond/10 rounded-zen p-3 border border-zen-herb/10 space-y-2">
                        <span class="text-[10px] font-bold text-zen-sage uppercase tracking-widest">Loans</span>
                        <div class="flex justify-between text-xs tabular-nums">
                            <span class="text-zen-sage font-black">{formatAmountShort(loans.loanedOut)}</span>
                            <span class="text-zen-spend font-black">{formatAmountShort(loans.borrowed)}</span>
                        </div>
                        {#if loans.loanedOut === 0 && loans.borrowed === 0}
                            <p class="text-[10px] text-zen-herb/50 italic">No active loans</p>
                        {/if}
                    </article>
                </div>

                <a
                    href="/insight"
                    class="block text-center text-[10px] font-bold uppercase tracking-widest text-zen-herb hover:text-zen-sage py-2 transition-colors"
                >
                    Weekly range review on Insight →
                </a>
            </div>
        {/if}
    </section>

    {#if $recurring.length > 0}
        <section class="px-6 mt-2" in:fade={{ delay: 350 }}>
            <h2 class="text-zen-herb text-[10px] uppercase font-bold tracking-widest opacity-60 mb-3 px-1">Quick Accruals</h2>
            <div class="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {#each $recurring as rt (rt.id)}
                    <button
                        onclick={() => openAccrual(rt)}
                        class="flex-shrink-0 bg-zen-panel border border-zen-herb/10 rounded-zen p-3 shadow-sm hover:shadow-zen active:scale-[0.98] transition-all flex items-center gap-3 pr-6"
                    >
                        <div class="h-10 w-10 flex-shrink-0 rounded-xl bg-zen-almond/30 flex items-center justify-center text-xl">
                            {$purposes.find((p) => p.id === rt.purposeId)?.emoji || "📝"}
                        </div>
                        <div class="text-left">
                            <p class="text-xs font-bold text-zen-sage leading-none mb-1">{rt.title}</p>
                            <p class="text-[10px] font-bold text-zen-herb opacity-50 uppercase tracking-tighter">
                                {rt.schedule}
                            </p>
                        </div>
                    </button>
                {/each}
            </div>
        </section>
    {/if}

    <section class="px-6 mt-6 mb-24" in:fade={{ delay: 500 }}>
        <div class="flex items-end justify-between mb-4 gap-3">
            <h2 class="text-zen-sage font-heading font-bold text-xl">Recent</h2>
            {#if $transactions.length > 0}
                <a href="/stream" class="text-[10px] font-bold uppercase tracking-widest text-zen-herb hover:text-zen-sage transition-colors">
                    View all in Stream
                </a>
            {/if}
        </div>

        <div class="space-y-1">
            {#each recentTransactions as item (item.id)}
                <div in:fly={{ y: 16, duration: 350 }}>
                    <TransactionCard {item} />
                </div>
            {:else}
                <div class="py-10 flex flex-col items-center text-center opacity-70">
                    <p class="text-zen-herb text-sm font-body font-semibold italic">Nothing logged yet today</p>
                </div>
            {/each}
        </div>
    </section>

    <AccrualModal
        isOpen={isAccrualModalOpen}
        template={activeTemplate}
        onClose={() => { isAccrualModalOpen = false; }}
    />
</div>

<style>
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
