<script lang="ts">
    import { fade, fly } from "svelte/transition";

    interface Option {
        id: string;
        name: string;
        emoji: string;
    }

    let { 
        show = false, 
        options = [], 
        coords = { x: 0, y: 0 }, 
        onSelect = (option: Option) => {},
        onClose = () => {}
    }: {
        show?: boolean;
        options?: Option[];
        coords?: { x: number; y: number };
        onSelect?: (option: Option) => void;
        onClose?: () => void;
    } = $props();

    let selectedIndex = $state(0);

    function handleKeydown(e: KeyboardEvent) {
        if (!show) return;
        
        if (e.key === "ArrowDown") {
            selectedIndex = (selectedIndex + 1) % options.length;
            e.preventDefault();
        } else if (e.key === "ArrowUp") {
            selectedIndex = (selectedIndex - 1 + options.length) % options.length;
            e.preventDefault();
        } else if (e.key === "Enter") {
            if (options[selectedIndex]) {
                onSelect(options[selectedIndex]);
                e.preventDefault();
            }
        } else if (e.key === "Escape") {
            onClose();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if show && options.length > 0}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div 
        data-testid="autocomplete-menu"
        class="fixed z-[110] bg-white rounded-xl shadow-zen-heavy border border-zen-herb/10 overflow-hidden min-w-[200px] transform -translate-x-1/2"
        style="left: {coords.x}px; top: {coords.y}px;"
        transition:fly={{ y: 10, duration: 200 }}
        onclick={(e) => e.stopPropagation()}
    >
        <div class="max-h-60 overflow-y-auto no-scrollbar py-1">
            {#each options as option, i}
                <button
                    onclick={() => onSelect(option)}
                    onmouseenter={() => selectedIndex = i}
                    class="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors {selectedIndex === i ? 'bg-zen-sage text-white' : 'hover:bg-zen-almond/20 text-zen-sage'}"
                >
                    <span class="text-lg">{option.emoji}</span>
                    <span class="font-body font-bold text-sm">{option.name}</span>
                </button>
            {/each}
        </div>
    </div>
{/if}
