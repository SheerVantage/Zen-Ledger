<script lang="ts">
    import { settings } from "$lib/stores/settings";
    import { parties } from "$lib/stores/parties";
    import { fade, fly, slide } from "svelte/transition";
    import { formatAmount, formatAmountShort } from "$lib/utils/formatters";

    const summaries = $derived($settings.summaries);
    const global = $derived(summaries.global);
    const partyWise = $derived(summaries.partyWise);

    // Filter parties with meaningful balances
    const receivableParties = $derived(
        Object.entries(partyWise)
            .filter(([_, s]) => s.receivables > 0)
            .map(([id, s]) => ({
                id,
                amount: s.receivables,
                party: $parties.find(p => p.id === id)
            }))
            .sort((a, b) => b.amount - a.amount)
    );

    const payableParties = $derived(
        Object.entries(partyWise)
            .filter(([_, s]) => s.payables > 0)
            .map(([id, s]) => ({
                id,
                amount: s.payables,
                party: $parties.find(p => p.id === id)
            }))
            .sort((a, b) => b.amount - a.amount)
    );

</script>

<div class="space-y-6 pb-12">
    <!-- Main Wealth Overview -->
    <div 
        class="bg-gradient-to-br from-zen-sage to-zen-herb rounded-3xl p-8 text-zen-on-primary shadow-zen-soft relative overflow-hidden"
        in:fly={{ y: 20, duration: 800 }}
    >
        <div class="relative z-10 flex flex-col items-center text-center">
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] opacity-70 mb-2">Total Net Wealth</span>
            <h2 class="text-5xl font-heading font-black tabular-nums tracking-tighter mb-4">
                {formatAmountShort(global.balance)}
            </h2>
            
            <div class="grid grid-cols-2 gap-8 w-full max-w-xs mt-4 pt-6 border-t border-zen-on-primary/10">
                <div class="flex flex-col">
                    <span class="text-[9px] uppercase font-bold opacity-60 mb-1">Cash at Hand</span>
                    <span class="text-lg font-bold tabular-nums">{formatAmountShort(global.netPosition)}</span>
                </div>
                <div class="flex flex-col">
                    <span class="text-[9px] uppercase font-bold opacity-60 mb-1">Net Flow</span>
                    <span class="text-lg font-bold tabular-nums">-{((global.receivables - global.payables) / global.balance * 100).toFixed(0)}%</span>
                </div>
            </div>
        </div>

        <!-- Abstract Background Shapes -->
        <div class="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-12 -left-12 w-48 h-48 bg-black/10 rounded-full blur-3xl"></div>
    </div>

    <!-- Ledger Details -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Receivables Card -->
        <div 
            class="bg-zen-panel rounded-2xl p-6 border border-zen-herb/5 shadow-sm space-y-4"
            in:fly={{ x: -20, delay: 200, duration: 600 }}
        >
            <div class="flex items-center justify-between border-b border-zen-herb/5 pb-4">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-zen-earn/10 text-zen-earn flex items-center justify-center text-lg">📈</div>
                    <h3 class="text-zen-sage font-heading font-bold">Owed to Me</h3>
                </div>
                <span class="text-zen-earn font-bold tabular-nums">{formatAmount(global.receivables)}</span>
            </div>

            <div class="space-y-3 max-h-[250px] overflow-y-auto no-scrollbar">
                {#if receivableParties.length === 0}
                    <p class="text-zen-herb/40 text-xs italic text-center py-4">No pending receivables</p>
                {:else}
                    {#each receivableParties as item}
                        <div class="flex items-center justify-between group">
                            <div class="flex items-center gap-3">
                                <span class="text-xl opacity-80">{item.party?.emoji || '👤'}</span>
                                <div>
                                    <p class="text-sm font-bold text-zen-sage group-hover:text-zen-earn transition-colors">{item.party?.name || 'Unknown'}</p>
                                    <p class="text-[9px] uppercase font-bold text-zen-herb/40 tracking-wider">Due from</p>
                                </div>
                            </div>
                            <span class="text-sm font-black text-zen-sage tabular-nums">{formatAmount(item.amount)}</span>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>

        <!-- Payables Card -->
        <div 
            class="bg-zen-panel rounded-2xl p-6 border border-zen-herb/5 shadow-sm space-y-4"
            in:fly={{ x: 20, delay: 400, duration: 600 }}
        >
            <div class="flex items-center justify-between border-b border-zen-herb/5 pb-4">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-zen-spend/5 text-zen-spend flex items-center justify-center text-lg">📉</div>
                    <h3 class="text-zen-sage font-heading font-bold">Owed by Me</h3>
                </div>
                <span class="text-zen-spend font-bold tabular-nums">{formatAmount(global.payables)}</span>
            </div>

            <div class="space-y-3 max-h-[250px] overflow-y-auto no-scrollbar">
                {#if payableParties.length === 0}
                    <p class="text-zen-herb/40 text-xs italic text-center py-4">No pending payables</p>
                {:else}
                    {#each payableParties as item}
                        <div class="flex items-center justify-between group">
                            <div class="flex items-center gap-3">
                                <span class="text-xl opacity-80">{item.party?.emoji || '👤'}</span>
                                <div>
                                    <p class="text-sm font-bold text-zen-sage group-hover:text-zen-spend transition-colors">{item.party?.name || 'Unknown'}</p>
                                    <p class="text-[9px] uppercase font-bold text-zen-herb/40 tracking-wider">Owe to</p>
                                </div>
                            </div>
                            <span class="text-sm font-black text-zen-sage tabular-nums">{formatAmount(item.amount)}</span>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>

    <!-- Summary Statement -->
    <div 
        class="bg-zen-oat/50 rounded-2xl p-4 border border-zen-herb/10 text-center"
        in:fade={{ delay: 600 }}
    >
        <p class="text-xs text-zen-herb font-medium leading-relaxed max-w-sm mx-auto">
            You currently hold <span class="text-zen-sage font-bold">{formatAmountShort(global.netPosition)}</span> in liquid cash.
            Including all pending <span class="text-zen-earn font-bold">{formatAmount(global.receivables)}</span> receivables and 
            <span class="text-zen-spend font-bold">{formatAmount(global.payables)}</span> payables, your total wealth position is 
            <span class="text-zen-sage font-black">{formatAmountShort(global.balance)}</span>.
        </p>
    </div>
</div>
