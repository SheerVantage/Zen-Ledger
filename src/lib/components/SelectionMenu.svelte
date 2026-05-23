<script lang="ts">
    import { fade } from "svelte/transition";

    let { 
        show = false, 
        text = "", 
        coords = { x: 0, y: 0 }, 
        onTagPurpose = () => {}, 
        onTagParty = () => {},
        onClose = () => {}
    } = $props();

</script>

{#if show}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class="fixed z-[100] bg-zen-sage text-zen-on-primary rounded-lg shadow-xl py-1 px-1 flex gap-1 transform -translate-x-1/2 -translate-y-full"
        style="left: {coords.x}px; top: {coords.y}px;"
        transition:fade={{ duration: 150 }}
        onclick={(e) => e.stopPropagation()}
    >
        <button 
            onclick={() => { onTagPurpose(); onClose(); }}
            class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 rounded-md transition-colors"
        >
            Tag Purpose
        </button>
        <div class="w-px bg-white/20 my-1"></div>
        <button 
            onclick={() => { onTagParty(); onClose(); }}
            class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 rounded-md transition-colors"
        >
            Tag Party
        </button>
    </div>
{/if}
