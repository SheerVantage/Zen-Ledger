<script lang="ts">
    import { fade, fly } from "svelte/transition";

    let {
        isOpen = false,
        originalText = "Apple $14.99",
        options = [
            { id: "tech", label: "Tech?", sub: "Apple Inc", emoji: "💻" },
            {
                id: "groceries",
                label: "Groceries?",
                sub: "Apple Store",
                emoji: "🍎",
            },
        ],
        onSelect = (id: string) => {},
        onClose = () => {},
    }: {
        isOpen?: boolean;
        originalText?: string;
        options?: Array<{
            id: string;
            label: string;
            sub: string;
            emoji: string;
        }>;
        onSelect?: (id: string) => void;
        onClose?: () => void;
    } = $props();
</script>

{#if isOpen}
    <!-- Backdrop -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-zen-oat/40 backdrop-blur-md z-[100]"
        transition:fade
        onclick={onClose}
    ></div>

    <!-- Bottom Sheet -->
    <div
        class="fixed bottom-0 left-0 right-0 bg-zen-surface/80 backdrop-blur-3xl rounded-t-[40px] shadow-zen-heavy z-[101] p-8 pb-12"
        transition:fly={{ y: 500, duration: 600 }}
    >
        <div class="w-12 h-1.5 bg-zen-herb/40 rounded-full mx-auto mb-8"></div>

        <div class="mb-8 text-center text-zen-sage">
            <p
                class="text-sm font-body font-bold uppercase tracking-widest text-zen-herb mb-2"
            >
                Original Input
            </p>
            <p class="text-2xl font-heading font-extrabold italic">
                "{originalText}"
            </p>
            <h3 class="mt-4 text-xl font-body font-semibold">Is this for...</h3>
        </div>

        <div class="space-y-4 max-w-md mx-auto">
            {#each options as option}
                <button
                    onclick={() => {
                        onSelect(option.id);
                        onClose();
                    }}
                    class="w-full flex items-center p-4 bg-zen-oat/40 hover:bg-zen-almond/20 rounded-zen border border-zen-herb/10 transition-all active:scale-[0.98] group text-left"
                >
                    <div
                        class="h-12 w-12 rounded-full bg-zen-almond/30 flex items-center justify-center text-2xl mr-4 group-hover:scale-110 transition-transform"
                    >
                        {option.emoji}
                    </div>
                    <div class="flex-1">
                        <p class="text-zen-sage font-heading font-bold text-lg">
                            {option.label}
                        </p>
                        <p class="text-zen-herb font-body font-medium text-sm">
                            {option.sub}
                        </p>
                    </div>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 text-zen-herb opacity-0 group-hover:opacity-100 transition-opacity"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            {/each}

            <button
                onclick={onClose}
                class="w-full py-4 text-zen-herb font-body font-bold text-sm uppercase tracking-widest hover:text-zen-sage transition-colors"
            >
                Something else...
            </button>
        </div>
    </div>
{/if}
