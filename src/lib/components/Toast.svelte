<script lang="ts">
    import { toastMessage } from '$lib/stores/feedback';
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
</div>
