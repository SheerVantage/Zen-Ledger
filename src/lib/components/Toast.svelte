<script lang="ts">
    import { toastMessage, autoSettlementPrompt } from '$lib/stores/feedback';
    import { fade, fly } from 'svelte/transition';
</script>

<div
    class="fixed top-20 left-1/2 -translate-x-1/2 z-[120] pointer-events-none px-4 w-full max-w-sm"
    aria-live="polite"
    aria-atomic="true"
>
    {#if $toastMessage}
        <div
            transition:fly={{ y: -12, duration: 220 }}
            class="mx-auto flex items-center gap-2 bg-zen-sage text-zen-on-primary px-5 py-3 rounded-full shadow-zen-heavy font-body font-bold text-sm"
        >
            <span aria-hidden="true">✓</span>
            <span>{$toastMessage}</span>
        </div>
    {/if}

    {#if $autoSettlementPrompt}
        <div
            transition:fly={{ y: -12, duration: 220 }}
            class="mx-auto flex items-center gap-3 bg-zen-panel text-zen-sage px-4 py-3 rounded-zen shadow-zen-heavy border border-zen-herb/15"
        >
            <div class="flex-1 min-w-0">
                <p class="font-body font-bold text-xs leading-snug">
                    Auto-detected open receivable from <span class="text-zen-sage font-extrabold">{$autoSettlementPrompt.partyName}</span>.
                </p>
                <p class="text-[10px] text-zen-herb/60 mt-0.5">Settle now?</p>
            </div>
            <button
                type="button"
                onclick={() => {
                    $autoSettlementPrompt?.onSettle();
                    autoSettlementPrompt.set(null);
                }}
                class="pointer-events-auto flex-shrink-0 px-4 py-2 bg-zen-sage text-zen-on-primary font-body font-bold text-xs rounded-full shadow-zen-soft transition-all active:scale-95"
            >
                Settle
            </button>
        </div>
    {/if}
</div>