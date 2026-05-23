<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import { purposes } from "$lib/stores/purposes";
    import { parties } from "$lib/stores/parties";
    import { addTransaction } from "$lib/stores/transactions";
    import type { RecurringTemplate } from "$lib/stores/recurring";

    let {
        isOpen = false,
        template = null,
        onClose = () => {},
    }: {
        isOpen?: boolean;
        template?: RecurringTemplate | null;
        onClose?: () => void;
    } = $props();

    let amount = $state(0);
    let extraDescription = $state("");
    
    // Sync internal state when template changes or is opened
    $effect(() => {
        if (isOpen && template) {
            amount = template.amount || 0;
            extraDescription = "";
        }
    });

    const purpose = $derived($purposes.find(p => p.id === template?.purposeId));
    const party = $derived($parties.find(p => p.id === template?.partyId));

    function handleLog() {
        if (!template || !purpose) return;

        const narration = extraDescription 
            ? `${template.title}: ${extraDescription}` 
            : template.title;

        // Ensure amount is signed correctly based on purpose type
        let finalAmount = Math.abs(amount);
        if (purpose.accountType === 'expense' || purpose.accountType === 'payable' || purpose.accountType === 'repaid') {
            finalAmount = -finalAmount;
        }

        addTransaction({
            date: new Date().toISOString().split('T')[0],
            amount: finalAmount,
            narration: narration,
            purposeId: template.purposeId,
            partyId: template.partyId
        });

        onClose();
    }
</script>

{#if isOpen && template}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-zen-oat/40 backdrop-blur-md z-[100]"
        transition:fade
        onclick={onClose}
    ></div>

    <div
        class="fixed bottom-0 left-0 right-0 bg-zen-surface/90 backdrop-blur-3xl rounded-t-[40px] shadow-zen-heavy z-[101] p-8 pb-12 overflow-hidden"
        transition:fly={{ y: 500, duration: 600 }}
    >
        <div class="w-12 h-1.5 bg-zen-herb/40 rounded-full mx-auto mb-8"></div>

        <div class="max-w-md mx-auto space-y-6">
            <div class="text-center space-y-2">
                <span class="text-4xl block mb-2">{purpose?.emoji || '📝'}</span>
                <h3 class="text-2xl font-heading font-black text-zen-sage tracking-tight">
                    Log {template.title}
                </h3>
                <p class="text-[10px] uppercase font-bold tracking-[0.2em] text-zen-herb opacity-50">
                    Recurring Accrual
                </p>
            </div>

            <!-- Details Card -->
            <div class="bg-zen-panel/50 rounded-2xl p-4 border border-zen-herb/5 space-y-3">
                <div class="flex items-center justify-between">
                    <span class="text-[9px] uppercase font-bold text-zen-herb/60 tracking-widest">Purpose</span>
                    <span class="text-xs font-bold text-zen-sage">{purpose?.name}</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-[9px] uppercase font-bold text-zen-herb/60 tracking-widest">Party</span>
                    <span class="text-xs font-bold text-zen-sage">{party?.name || 'Self'}</span>
                </div>
            </div>

            <!-- Inputs -->
            <div class="space-y-4">
                <div class="space-y-1">
                    <label for="accrual-amount" class="text-[9px] font-bold uppercase text-zen-herb/60 tracking-widest px-1">Amount</label>
                    <div class="relative">
                        <input 
                            id="accrual-amount"
                            type="number" 
                            bind:value={amount}
                            readonly={!template.isVariable}
                            class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-xl px-4 py-3 text-lg text-zen-sage font-black focus:outline-none focus:ring-2 focus:ring-zen-sage/20 transition-all {template.isVariable ? '' : 'opacity-60 cursor-not-allowed'}"
                        />
                    </div>
                </div>

                <div class="space-y-1">
                    <label for="accrual-desc" class="text-[9px] font-bold uppercase text-zen-herb/60 tracking-widest px-1">Additional Note (Optional)</label>
                    <input 
                        id="accrual-desc"
                        type="text" 
                        bind:value={extraDescription}
                        placeholder="e.g. Month of March"
                        class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-xl px-4 py-3 text-sm text-zen-sage font-bold focus:outline-none focus:ring-2 focus:ring-zen-sage/20 transition-all"
                    />
                </div>
            </div>

            <div class="pt-4 flex gap-4">
                <button 
                    onclick={onClose}
                    class="flex-1 py-4 bg-zen-oat/50 text-zen-herb rounded-2xl text-xs font-bold hover:bg-zen-oat transition-all"
                >
                    Cancel
                </button>
                <button 
                    onclick={handleLog}
                    class="flex-[2] py-4 bg-zen-sage text-zen-on-primary rounded-2xl text-xs font-bold shadow-zen-soft hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    Confirm & Log
                </button>
            </div>
        </div>
    </div>
{/if}
