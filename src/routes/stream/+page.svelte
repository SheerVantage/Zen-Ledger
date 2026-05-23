<script lang="ts">
    import { onMount } from "svelte";
    import { transactions, type Transaction } from "$lib/stores/transactions";
    import { purposes } from "$lib/stores/purposes";
    import { parties } from "$lib/stores/parties";
    import TransactionCard from "$lib/components/TransactionCard.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import { fade, fly, slide } from "svelte/transition";
    import { cubicOut } from "svelte/easing";

    let searchQuery = $state("");
    let selectedCategoryId = $state("All");
    let isFilterPanelOpen = $state(false);
    let filterDateStart = $state("");
    let filterDateEnd = $state("");
    let filterPartyId = $state("");
    let filterAmountMin = $state("");
    let filterAmountMax = $state("");
    let filterToolbarEl: HTMLElement | null = $state(null);

    const availableParties = $derived($parties);
    let usedPurposeIds = $derived(new Set($transactions.map((t) => t.purposeId)));
    const availablePurposes = $derived($purposes.filter((p) => usedPurposeIds.has(p.id)));

    const filteredTransactions = $derived.by(() => {
        let list = $transactions;

        if (searchQuery) {
            list = list.filter((t) =>
                t.narration.toLowerCase().includes(searchQuery.toLowerCase()),
            );
        }
        if (selectedCategoryId !== "All") {
            list = list.filter((t) => t.purposeId === selectedCategoryId);
        }
        if (filterDateStart) list = list.filter((t) => t.date >= filterDateStart);
        if (filterDateEnd) list = list.filter((t) => t.date <= filterDateEnd);
        if (filterPartyId) list = list.filter((t) => t.partyId === filterPartyId);
        if (filterAmountMin) list = list.filter((t) => Math.abs(t.amount) >= Number(filterAmountMin));
        if (filterAmountMax) list = list.filter((t) => Math.abs(t.amount) <= Number(filterAmountMax));

        return list.sort((a, b) => b.date.localeCompare(a.date));
    });

    let groupedTransactions = $derived.by(() => {
        const groups: Record<string, Transaction[]> = {};
        filteredTransactions.forEach((t) => {
            if (!groups[t.date]) groups[t.date] = [];
            groups[t.date].push(t);
        });
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    });

    let isEmpty = $derived($transactions.length === 0);
    let noMatches = $derived(!isEmpty && filteredTransactions.length === 0);

    const hasActiveFilters = $derived(
        Boolean(
            searchQuery ||
                selectedCategoryId !== "All" ||
                filterDateStart ||
                filterDateEnd ||
                filterPartyId ||
                filterAmountMin ||
                filterAmountMax,
        ),
    );

    const resultLabel = $derived(
        filteredTransactions.length === 1 ? "1 transaction" : `${filteredTransactions.length} transactions`,
    );

    function syncToolbarHeight() {
        if (typeof document === "undefined" || !filterToolbarEl) return;
        const height = filterToolbarEl.getBoundingClientRect().height;
        document.documentElement.style.setProperty("--stream-toolbar-height", `${height}px`);
    }

    onMount(() => {
        if (!filterToolbarEl) return;

        const observer = new ResizeObserver(() => syncToolbarHeight());
        observer.observe(filterToolbarEl);
        syncToolbarHeight();

        return () => observer.disconnect();
    });

    $effect(() => {
        isFilterPanelOpen;
        selectedCategoryId;
        availablePurposes.length;
        queueMicrotask(syncToolbarHeight);
    });

    function formatDateHeader(dateStr: string) {
        const today = new Date().toISOString().split("T")[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().split("T")[0];

        if (dateStr === today) return "Today";
        if (dateStr === yesterday) return "Yesterday";

        return new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
        });
    }

    function clearFilters() {
        filterDateStart = "";
        filterDateEnd = "";
        filterPartyId = "";
        filterAmountMin = "";
        filterAmountMax = "";
        searchQuery = "";
        selectedCategoryId = "All";
    }

    const chipClass = (active: boolean) =>
        `stream-chip ${active ? "stream-chip--active" : "stream-chip--idle"}`;
</script>

<div class="stream-page flex flex-col min-h-[60vh] pb-8 max-w-lg mx-auto w-full">
    {#if !isEmpty}
        <section
            bind:this={filterToolbarEl}
            class="stream-toolbar px-6 pt-3 pb-4 space-y-3 sticky top-16 z-20"
        >
            <div class="flex items-center gap-2">
                <button
                    type="button"
                    onclick={() => (isFilterPanelOpen = !isFilterPanelOpen)}
                    class="stream-filter-btn relative min-h-11 min-w-11 flex items-center justify-center rounded-full transition-all active:scale-95 {isFilterPanelOpen ? 'bg-zen-sage text-zen-on-primary shadow-zen' : 'bg-zen-panel text-zen-herb border border-zen-hairline'}"
                    aria-label="Toggle filters"
                    aria-expanded={isFilterPanelOpen}
                >
                    <Icon name="filter" size="16" />
                    {#if hasActiveFilters && !isFilterPanelOpen}
                        <span class="stream-filter-dot" aria-hidden="true"></span>
                    {/if}
                </button>
                <label for="stream-search" class="sr-only">Search transactions</label>
                <input
                    id="stream-search"
                    type="search"
                    bind:value={searchQuery}
                    placeholder="Search narrations..."
                    class="stream-search flex-1 bg-zen-panel border border-zen-hairline rounded-full px-4 py-2.5 text-sm text-zen-sage placeholder:text-zen-muted-soft focus:outline-none focus:ring-2 focus:ring-zen-sage/25"
                />
            </div>

            {#if isFilterPanelOpen}
                <div
                    transition:slide={{ duration: 280, easing: cubicOut }}
                    class="bg-zen-panel rounded-zen p-4 border border-zen-hairline space-y-4"
                >
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label for="filter-start" class="zen-field-label">From</label>
                            <input id="filter-start" type="date" bind:value={filterDateStart} class="stream-field-input" />
                        </div>
                        <div class="space-y-1">
                            <label for="filter-end" class="zen-field-label">To</label>
                            <input id="filter-end" type="date" bind:value={filterDateEnd} class="stream-field-input" />
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label for="filter-party" class="zen-field-label">Party</label>
                            <select id="filter-party" bind:value={filterPartyId} class="stream-field-input">
                                <option value="">All parties</option>
                                {#each availableParties as p}
                                    <option value={p.id}>{p.name}</option>
                                {/each}
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label for="filter-min" class="zen-field-label">Min amount</label>
                            <input id="filter-min" type="number" bind:value={filterAmountMin} placeholder="0" class="stream-field-input" />
                        </div>
                    </div>
                    <div class="space-y-1">
                        <label for="filter-max" class="zen-field-label">Max amount</label>
                        <input id="filter-max" type="number" bind:value={filterAmountMax} placeholder="Any" class="stream-field-input" />
                    </div>
                    <button
                        type="button"
                        onclick={clearFilters}
                        class="text-[10px] uppercase font-bold text-zen-spend/80 hover:text-zen-spend px-1 transition-colors active:scale-95"
                    >
                        Clear all filters
                    </button>
                </div>
            {/if}

            {#if availablePurposes.length > 0}
                <div class="flex gap-2 overflow-x-auto no-scrollbar pb-0.5" role="group" aria-label="Filter by purpose">
                    <button type="button" onclick={() => (selectedCategoryId = "All")} class={chipClass(selectedCategoryId === "All")}>
                        All
                    </button>
                    {#each availablePurposes as p}
                        <button type="button" onclick={() => (selectedCategoryId = p.id)} class={chipClass(selectedCategoryId === p.id)}>
                            {p.emoji ? `${p.emoji} ` : ""}{p.name}
                        </button>
                    {/each}
                </div>
            {/if}
        </section>
    {/if}

    {#if isEmpty}
        <section class="flex flex-col items-center justify-center text-center px-8 py-20" in:fade={{ duration: 400 }}>
            <span class="text-4xl mb-4" aria-hidden="true">🍃</span>
            <h2 class="text-zen-sage font-heading font-bold text-xl mb-2">Quiet stream</h2>
            <p class="text-zen-herb text-sm font-body font-semibold max-w-xs leading-relaxed">
                No transactions yet. Tap the + button below to log your first one.
            </p>
        </section>
    {:else if noMatches}
        <section class="flex flex-col items-center text-center px-8 py-16" in:fade={{ duration: 300 }}>
            <span class="text-3xl mb-3" aria-hidden="true">🔍</span>
            <h2 class="text-zen-sage font-heading font-bold text-lg mb-1">Nothing matched</h2>
            <p class="text-zen-herb text-sm font-semibold mb-4 max-w-xs">
                Try a broader search or clear your filters.
            </p>
            <button
                type="button"
                onclick={clearFilters}
                class="px-5 py-2.5 rounded-full bg-zen-sage text-zen-on-primary text-xs font-bold uppercase tracking-wider shadow-zen-soft active:scale-95 transition-transform"
            >
                Clear filters
            </button>
        </section>
    {:else}
        <p class="zen-micro-label px-6 pt-5 pb-1" aria-live="polite">{resultLabel}</p>

        <div class="px-6 pb-4 space-y-12">
            {#each groupedTransactions as [date, items], i}
                <section class="stream-date-group" in:fly={{ y: 12, delay: Math.min(i * 30, 120), duration: 320, easing: cubicOut }}>
                    <div class="stream-date-header">
                        <h2 class="zen-micro-label">{formatDateHeader(date)}</h2>
                    </div>
                    <div class="stream-date-spacer" aria-hidden="true"></div>
                    <div class="stream-date-items">
                        {#each items as item (item.id)}
                            <TransactionCard {item} />
                        {/each}
                    </div>
                </section>
            {/each}
            <p class="zen-caption-muted text-center italic pt-2 pb-6">
                That's everything for now.
            </p>
        </div>
    {/if}
</div>

<style>
    .stream-toolbar {
        background-color: color-mix(in srgb, var(--color-zen-oat) 96%, transparent);
        border-bottom: 1px solid var(--color-zen-hairline);
    }

    .stream-filter-btn:focus-visible,
    .stream-search:focus-visible,
    .stream-chip:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--color-zen-sage) 45%, transparent);
        outline-offset: 2px;
    }

    .stream-filter-dot {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 0.375rem;
        height: 0.375rem;
        border-radius: 9999px;
        background-color: var(--color-zen-spend);
        box-shadow: 0 0 0 2px var(--color-zen-panel);
    }

    .stream-field-input {
        width: 100%;
        padding: 0.375rem 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid var(--color-zen-hairline);
        background-color: var(--color-zen-input);
        font-size: 0.75rem;
        color: var(--color-zen-sage);
    }

    .stream-chip {
        padding: 0.375rem 1rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 700;
        white-space: nowrap;
        transition:
            transform 0.15s cubic-bezier(0.33, 1, 0.68, 1),
            background-color 0.2s cubic-bezier(0.33, 1, 0.68, 1),
            color 0.2s cubic-bezier(0.33, 1, 0.68, 1);
    }

    .stream-chip:active {
        transform: scale(0.96);
    }

    .stream-chip--active {
        background-color: var(--color-zen-sage);
        color: var(--color-zen-on-primary);
        box-shadow: var(--shadow-zen);
    }

    .stream-chip--idle {
        background-color: var(--color-zen-panel);
        color: var(--color-zen-herb);
        border: 1px solid var(--color-zen-hairline);
    }

    .stream-date-header {
        position: sticky;
        top: calc(4rem + var(--stream-toolbar-height, 7.75rem));
        z-index: 10;
        padding: 0.375rem 0 0.25rem;
        background-color: var(--color-zen-oat);
    }

    .stream-date-spacer {
        height: 1.5rem;
    }

    .stream-date-items {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
    }

    .stream-date-items :global(.group) {
        margin-bottom: 0;
    }

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
</style>
