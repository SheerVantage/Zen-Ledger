<script lang="ts">
    import StatusRing from "$lib/components/StatusRing.svelte";
    import InputPill from "$lib/components/InputPill.svelte";
    import ParserModal from "$lib/components/ParserModal.svelte";
    import TransactionCard from "$lib/components/TransactionCard.svelte";
    import PurposeManager from "$lib/components/PurposeManager.svelte";
    import { transactions, addTransaction } from "$lib/stores/transactions";
    import { purposes } from "$lib/stores/purposes";
    import { parties } from "$lib/stores/parties";
    import { settings } from "$lib/stores/settings";
    import { theme } from "$lib/stores/ui";
    import { recurring, type RecurringTemplate } from "$lib/stores/recurring";
    import AccrualModal from "$lib/components/AccrualModal.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import { fade, fly, slide, scale } from "svelte/transition";
    import { formatAmountShort } from "$lib/utils/formatters";

    let userName = $derived($settings.profile.name);

    // Accrual Modal State
    let isAccrualModalOpen = $state(false);
    let activeTemplate = $state<RecurringTemplate | null>(null);

    function openAccrual(template: RecurringTemplate) {
        activeTemplate = template;
        isAccrualModalOpen = true;
    }

    // Filtering State
    let searchQuery = $state("");
    let selectedCategoryId = $state("All");
    let isFilterPanelOpen = $state(false);
    // Transaction List Filter State
    let filterDateStart = $state("");
    let filterDateEnd = $state("");
    let filterPartyId = $state("");
    let filterAmountMin = $state("");
    let filterAmountMax = $state("");

    // Summary Date Range State
    let summaryDateStart = $state(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    let summaryDateEnd = $state(new Date().toISOString().split('T')[0]);

    // Derived Summary Calculations
    let rangeEarnings = $derived.by(() => {
        return $transactions
            .filter(t => {
                const p = $purposes.find(purpose => purpose.id === t.purposeId);
                const isEarning = p?.accountType === 'earning' || p?.accountType === 'recovered' || p?.accountType === 'payable';
                const inRange = (!summaryDateStart || t.date >= summaryDateStart) && (!summaryDateEnd || t.date <= summaryDateEnd);
                return isEarning && inRange;
            })
            .reduce((acc, t) => acc + Math.abs(t.amount), 0);
    });

    let rangeExpenses = $derived.by(() => {
        return $transactions
            .filter(t => {
                const p = $purposes.find(purpose => purpose.id === t.purposeId);
                const isExpense = p?.accountType === 'expense' || p?.accountType === 'repaid' // || p?.accountType === 'receivable';
                const inRange = (!summaryDateStart || t.date >= summaryDateStart) && (!summaryDateEnd || t.date <= summaryDateEnd);
                return isExpense && inRange;
            })
            .reduce((acc, t) => acc + Math.abs(t.amount), 0);
    });

    // Dynamic daily status (remains derived as it depends on 'today')
    let totalSpentToday = $derived.by(() => {
        const today = new Date().toISOString().split("T")[0];
        return $transactions
            .filter((t) => {
                const p = $purposes.find(purpose => purpose.id === t.purposeId);
                return t.date === today && p?.accountType === 'expense';
            })
            .reduce((acc, t) => acc + Math.abs(t.amount), 0);
    });

    let totalReceivable = $derived($settings.summaries.global.receivables);
    let totalPayable = $derived($settings.summaries.global.payables);
    let netBalanceValue = $derived($settings.summaries.global.balance);
    let netPosition = $derived($settings.summaries.global.netPosition);

    let planning = $derived($settings.summaries.planning);
    let loans = $derived($settings.summaries.loans);

    let safeToSpend = $derived($settings.profile.currency + ($settings.profile.dailyBudget - totalSpentToday).toFixed(0));
    let dailyStatus = $derived(
        `You've spent ${$settings.profile.currency}${totalSpentToday.toFixed(0)} today.`,
    );

    function toggleTheme() {
        theme.toggle();
    }

    const availableParties = $derived($parties);
    
    // Extract categories (purposes) actually used in transactions for the quick filter
    let usedPurposeIds = $derived(new Set($transactions.map(t => t.purposeId)));
    const availablePurposes = $derived($purposes.filter(p => usedPurposeIds.has(p.id)));

    // Filtered Recent Transactions
    const filteredTransactions = $derived.by(() => {
        let list = $transactions;

        // Search Query
        if (searchQuery) {
            list = list.filter((t) =>
                t.narration.toLowerCase().includes(searchQuery.toLowerCase()),
            );
        }

        // Quick Category Filter
        if (selectedCategoryId !== "All") {
            list = list.filter((t) => t.purposeId === selectedCategoryId);
        }

        // Advanced Filters
        if (filterDateStart) {
            list = list.filter((t) => t.date >= filterDateStart);
        }
        if (filterDateEnd) {
            list = list.filter((t) => t.date <= filterDateEnd);
        }
        if (filterPartyId) {
            list = list.filter((t) => t.partyId === filterPartyId);
        }
        if (filterAmountMin) {
            list = list.filter((t) => Math.abs(t.amount) >= Number(filterAmountMin));
        }
        if (filterAmountMax) {
            list = list.filter((t) => Math.abs(t.amount) <= Number(filterAmountMax));
        }

        return list.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ).slice(0, 5); 
    });

    function handleNewTransaction(text: string, overrides?: { partyId?: string; purposeId?: string; account?: string; toAccount?: string }) {
        import("$lib/utils/transactionParser").then(({ parseTransaction }) => {
            const parsed = parseTransaction(text);
            addTransaction({
                ...parsed,
                ...(overrides?.partyId ? { partyId: overrides.partyId } : {}),
                ...(overrides?.purposeId ? { purposeId: overrides.purposeId } : {}),
                ...(overrides?.account ? { account: overrides.account } : {}),
                ...(overrides?.toAccount ? { toAccount: overrides.toAccount } : {}),
            });
        });
    }
</script>

<div class="flex flex-col min-h-screen">
    <!-- Main Visualization -->
    <!-- Intelligence Dashboard (v2.1.0) -->
    <section class="px-8 pt-4 pb-2 space-y-6" in:fade={{ delay: 200 }}>
        <!-- Primary Metrics (Liquid vs Net) -->
        <div class="grid grid-cols-2 gap-4">
            <div class="bg-zen-surface/40 backdrop-blur-3xl p-5 rounded-[2.5rem] border border-zen-herb/10 shadow-zen-soft flex flex-col group hover:bg-zen-surface/60 transition-all relative overflow-hidden">
                <div class="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
                    <Icon name="wallet" size="80" />
                </div>
                <span class="text-[10px] uppercase tracking-[0.2em] text-zen-herb font-bold opacity-50 mb-1">Liquid Cash</span>
                <span class="text-zen-sage font-heading font-black text-3xl tabular-nums leading-none mb-1">{formatAmountShort(netPosition)}</span>
                <span class="text-[9px] text-zen-herb/40 font-bold uppercase tracking-wider">Ready to spend</span>
            </div>
            <div class="bg-zen-surface/20 backdrop-blur-3xl p-5 rounded-[2.5rem] border border-zen-herb/10 shadow-sm flex flex-col group hover:bg-zen-surface/40 transition-all relative overflow-hidden">
                <div class="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
                    <Icon name="activity" size="80" />
                </div>
                <span class="text-[10px] uppercase tracking-[0.2em] text-zen-herb font-bold opacity-50 mb-1">Net Worth</span>
                <span class="text-zen-sage font-heading font-black text-3xl tabular-nums leading-none mb-1">{formatAmountShort(netBalanceValue)}</span>
                <span class="text-[9px] text-zen-herb/40 font-bold uppercase tracking-wider">Incl. Accruals</span>
            </div>
        </div>

        <!-- Planning & Loans Intelligence -->
        <div class="grid grid-cols-2 gap-4">
            <!-- Planning Card -->
            <div class="bg-zen-sage/5 rounded-[2rem] p-4 border border-zen-sage/10 space-y-3 relative group hover:bg-zen-sage/10 transition-all">
                <div class="flex items-center justify-between">
                    <span class="text-[9px] font-bold text-zen-sage uppercase tracking-widest">Planning</span>
                    <span class="text-[14px]">🔭</span>
                </div>
                <div class="flex flex-col">
                    <div class="flex justify-between items-baseline">
                        <span class="text-[8px] font-bold text-zen-herb/50 uppercase">Expected In</span>
                        <span class="text-xs font-black text-emerald-500/80">+{formatAmountShort(planning.expectedInflow)}</span>
                    </div>
                    <div class="flex justify-between items-baseline">
                        <span class="text-[8px] font-bold text-zen-herb/50 uppercase">Outflow</span>
                        <span class="text-xs font-black text-zen-spend/80">-{formatAmountShort(planning.expectedOutflow)}</span>
                    </div>
                </div>
                {#if planning.expectedInflow === 0 && planning.expectedOutflow === 0}
                    <p class="text-[8px] text-zen-herb/30 italic">No future plans detected</p>
                {/if}
            </div>

            <!-- Loans Card -->
            <div class="bg-blue-500/5 rounded-[2rem] p-4 border border-blue-500/10 space-y-3 relative group hover:bg-blue-500/10 transition-all">
                <div class="flex items-center justify-between">
                    <span class="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Loans</span>
                    <span class="text-[14px]">💸</span>
                </div>
                <div class="flex flex-col">
                    <div class="flex justify-between items-baseline">
                        <span class="text-[8px] font-bold text-zen-herb/50 uppercase">Loaned Out</span>
                        <span class="text-xs font-black text-zen-sage/80">{formatAmountShort(loans.loanedOut)}</span>
                    </div>
                    <div class="flex justify-between items-baseline">
                        <span class="text-[8px] font-bold text-zen-herb/50 uppercase">Borrowed</span>
                        <span class="text-xs font-black text-zen-spend/80">{formatAmountShort(loans.borrowed)}</span>
                    </div>
                </div>
                {#if loans.loanedOut === 0 && loans.borrowed === 0}
                    <p class="text-[8px] text-zen-herb/30 italic">No active loans</p>
                {/if}
            </div>
        </div>

        <!-- Range Performance -->
        <div class="bg-zen-surface/10 rounded-[2rem] p-5 border border-zen-herb/5 space-y-4">
            <div class="flex items-center justify-between">
                <h2 class="text-zen-herb text-[10px] uppercase font-bold tracking-[0.2em] opacity-50">Range Review</h2>
                <div class="flex items-center gap-2 bg-zen-surface/40 p-1 rounded-xl border border-zen-herb/5">
                    <input type="date" bind:value={summaryDateStart} class="bg-transparent border-none text-[8px] text-zen-sage font-bold uppercase p-0 px-1 focus:ring-0" />
                    <span class="text-zen-herb/20 text-[8px]">-</span>
                    <input type="date" bind:value={summaryDateEnd} class="bg-transparent border-none text-[8px] text-zen-sage font-bold uppercase p-0 px-1 focus:ring-0" />
                </div>
            </div>
            
            <div class="flex gap-6 items-center">
                <div class="flex-1 flex flex-col">
                    <span class="text-[8px] font-bold text-zen-herb/60 uppercase mb-1">Income</span>
                    <span class="text-xl font-heading font-black text-emerald-500 leading-none">{formatAmountShort(rangeEarnings)}</span>
                </div>
                <div class="w-px h-8 bg-zen-herb/10"></div>
                <div class="flex-1 flex flex-col">
                    <span class="text-[8px] font-bold text-zen-herb/60 uppercase mb-1">Expenses</span>
                    <span class="text-xl font-heading font-black text-zen-spend leading-none">{formatAmountShort(rangeExpenses)}</span>
                </div>
                <div class="h-10 w-10 rounded-2xl bg-zen-sage/10 flex items-center justify-center text-xs font-black text-zen-sage">
                    {rangeEarnings > rangeExpenses ? '📈' : '📉'}
                </div>
            </div>
        </div>
    </section>

    <!-- Quick Accruals Section -->
    {#if $recurring.length > 0}
        <section class="px-8 mt-6" in:fade={{ delay: 350 }}>
            <div class="flex items-center justify-between mb-4 px-1">
                <h2 class="text-zen-herb text-[10px] uppercase font-bold tracking-widest opacity-60">Quick Accruals</h2>
            </div>
            <div class="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {#each $recurring as rt (rt.id)}
                    <button 
                        onclick={() => openAccrual(rt)}
                        class="flex-shrink-0 bg-zen-panel border border-zen-herb/10 rounded-2xl p-3 shadow-sm hover:shadow-zen-soft hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 pr-6 group"
                    >
                        <div class="h-10 w-10 flex-shrink-0 rounded-xl bg-zen-almond/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            {$purposes.find(p => p.id === rt.purposeId)?.emoji || '📝'}
                        </div>
                        <div class="text-left">
                            <p class="text-xs font-bold text-zen-sage leading-none mb-1">{rt.title}</p>
                            <p class="text-[9px] font-bold text-zen-herb opacity-40 uppercase tracking-tighter">
                                {rt.schedule} • {rt.isVariable ? 'Variable' : `$${rt.amount || 0}`}
                            </p>
                        </div>
                    </button>
                {/each}
            </div>
        </section>
    {/if}

    <!-- Quick Add Section -->
    <section class="px-8 mt-4" in:fade={{ delay: 400 }}>
        <InputPill onInput={handleNewTransaction} />
    </section>

    <!-- Recent Transactions Section -->
    <section class="px-8 mt-4 mb-24" in:fade={{ delay: 600 }}>
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
                <h2 class="text-zen-sage font-heading font-bold text-xl">Recent</h2>
            </div>
            <div class="flex items-center gap-2">
                <button 
                    onclick={() => isFilterPanelOpen = !isFilterPanelOpen}
                    class="p-2 rounded-full transition-all {isFilterPanelOpen ? 'bg-zen-sage text-white shadow-zen-soft' : 'bg-zen-surface text-zen-herb hover:bg-zen-almond/20'}"
                    aria-label="Toggle Filters"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                </button>
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search..."
                    class="bg-zen-surface/50 border border-zen-herb/10 rounded-full px-4 py-1.5 text-sm text-zen-sage focus:outline-none focus:ring-2 focus:ring-zen-sage/20 w-32 transition-all focus:w-48"
                />
            </div>
        </div>

        {#if isFilterPanelOpen}
            <div 
                transition:slide
                class="bg-zen-surface backdrop-blur-3xl rounded-2xl p-4 mb-6 shadow-zen-soft border border-zen-herb/5 space-y-4"
            >
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label for="filter-start" class="text-[9px] font-bold uppercase text-zen-herb/60 tracking-widest px-1">From Date</label>
                        <input id="filter-start" type="date" bind:value={filterDateStart} class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg px-3 py-1.5 text-xs text-zen-sage" />
                    </div>
                    <div class="space-y-1">
                        <label for="filter-end" class="text-[9px] font-bold uppercase text-zen-herb/60 tracking-widest px-1">To Date</label>
                        <input id="filter-end" type="date" bind:value={filterDateEnd} class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg px-3 py-1.5 text-xs text-zen-sage" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <label for="filter-party" class="text-[9px] font-bold uppercase text-zen-herb/60 tracking-widest px-1">Party</label>
                        <select id="filter-party" bind:value={filterPartyId} class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg px-3 py-1.5 text-xs text-zen-sage">
                            <option value="">All Parties</option>
                            {#each availableParties as p}
                                <option value={p.id}>{p.name}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label for="filter-min" class="text-[9px] font-bold uppercase text-zen-herb/60 tracking-widest px-1">Min Amount</label>
                        <input id="filter-min" type="number" bind:value={filterAmountMin} placeholder="0.00" class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg px-3 py-1.5 text-xs text-zen-sage" />
                    </div>
                </div>

                <div class="flex justify-between items-center pt-2">
                    <button 
                        onclick={() => {
                            filterDateStart = ""; filterDateEnd = ""; filterPartyId = ""; filterAmountMin = ""; filterAmountMax = "";
                        }}
                        class="text-[10px] uppercase font-bold text-zen-spend opacity-60 hover:opacity-100 px-2"
                    >
                        Clear All
                    </button>
                </div>
            </div>
        {/if}

        {#if availablePurposes.length > 0}
            <div class="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                <button
                    onclick={() => (selectedCategoryId = "All")}
                    class="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all {selectedCategoryId ===
                    'All'
                        ? 'bg-zen-sage text-white shadow-zen-soft'
                        : 'bg-zen-surface text-zen-herb hover:bg-zen-almond/20'}"
                >
                    All
                </button>
                {#each availablePurposes as p}
                    <button
                        onclick={() => (selectedCategoryId = p.id)}
                        class="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all {selectedCategoryId ===
                        p.id
                            ? 'bg-zen-sage text-white shadow-zen-soft'
                            : 'bg-zen-surface text-zen-herb hover:bg-zen-almond/20'}"
                    >
                        {p.name}
                    </button>
                {/each}
            </div>
        {/if}

        <div class="space-y-1">
            {#each filteredTransactions as item (item.id)}
                <div in:fly={{ y: 20, duration: 400 }}>
                    <TransactionCard {item} />
                </div>
            {:else}
                <div
                    class="py-12 flex flex-col items-center justify-center opacity-40 italic"
                >
                    <p class="text-zen-herb text-sm">No transactions found</p>
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
    :global(body) {
        overflow-y: auto; /* Allow scrolling for recent transactions */
    }
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
