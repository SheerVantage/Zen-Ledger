<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import { theme } from "$lib/stores/ui";
    import { page } from "$app/stores";
    import { onNavigate } from "$app/navigation";
    import { fade, fly, slide } from "svelte/transition";
    import InputPill from "$lib/components/InputPill.svelte";
    import ParserModal from "$lib/components/ParserModal.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import { addTransaction } from "$lib/stores/transactions";
    import { parseTransaction } from "$lib/utils/transactionParser";

	let { children } = $props();

    // Navigation state
    let isMenuOpen = $state(false);
    let isInputVisible = $state(false);

    // Bottom Bar State (Global)
    let isModalOpen = $state(false);
    let pendingInput = $state("");

	// Global theme sync
	$effect(() => {
		if (typeof document !== "undefined") {
			document.body.setAttribute("data-theme", $theme);
		}
	});

    /**
     * View Transitions Skill:
     * Intercepts SvelteKit navigation to trigger the native browser
     * View Transition API for seamless page morphing.
     */
    onNavigate((navigation) => {
        if (!document.startViewTransition) return;

        return new Promise((resolve) => {
            document.startViewTransition(async () => {
                resolve();
                await navigation.complete;
            });
        });
    });

    const getPageTitle = $derived.by(() => {
        const path = $page.url.pathname;
        if (path === '/') return "Pulse";
        if (path.includes('/stream')) return "Stream";
        if (path.includes('/settings')) return "Settings";
        if (path.includes('/purposes')) return "Purposes";
        if (path.includes('/parties')) return "Parties";
        if (path.includes('/insight')) return "Insight";
        return "Zen Ledger";
    });

    function handleNewInput(text: string) {
        if (text.toLowerCase().includes("apple")) {
            pendingInput = text;
            isModalOpen = true;
            return;
        }
        const parsed = parseTransaction(text);
        addTransaction(parsed);
    }

    function handleModalSelect(data: any) {
        addTransaction({
            narration: data.narration,
            amount: data.amount,
            purposeId: data.purposeId,
            date: data.date,
            partyId: data.partyId,
        });
        isModalOpen = false;
        pendingInput = "";
    }
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="noise-overlay text-zen-sage"></div>

<!-- Global Top App Bar -->
<header
    class="fixed top-0 left-0 right-0 z-50 bg-zen-surface/60 backdrop-blur-3xl border-b border-zen-herb/10 shadow-zen"
>
    <!-- ... (rest of header content) ... -->
    <div class="h-16 flex items-center justify-between px-6 max-w-7xl mx-auto">
        <!-- Brand & Hamburger -->
        <div class="flex items-center gap-4">
            <button
                onclick={() => isMenuOpen = !isMenuOpen}
                class="lg:hidden p-2 -ml-2 text-zen-herb hover:text-zen-sage transition-colors"
                aria-label="Menu"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            
            <a href="/" class="flex items-center gap-2 group">
                <div class="h-8 w-8 bg-zen-sage rounded-xl flex items-center justify-center text-lg shadow-lg shadow-zen-sage/20 group-hover:scale-110 transition-transform">
                    🌿
                </div>
                <div class="hidden sm:block">
                    <span class="text-sm font-bold tracking-tight text-zen-sage uppercase">Zen Ledger</span>
                </div>
            </a>
        </div>

        <!-- Dynamic Page Title -->
        <div class="absolute left-1/2 -translate-x-1/2">
            <h1 class="text-lg font-heading font-bold text-zen-sage tracking-tight">
                {getPageTitle}
            </h1>
        </div>

        <!-- Utility Actions -->
        <div class="flex items-center gap-2">
            <button
                onclick={() => theme.toggle()}
                class="h-10 w-10 bg-zen-almond/20 rounded-xl flex items-center justify-center text-zen-sage transition-all active:scale-95 shadow-sm hover:bg-zen-almond/40"
                aria-label="Toggle Theme"
            >
                {#if $theme === "zen"}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    </svg>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                {/if}
            </button>
        </div>
    </div>

    <!-- Mobile Menu Slideout -->
    {#if isMenuOpen}
        <div 
            transition:slide
            class="lg:hidden border-t border-zen-herb/10 bg-zen-surface/90 backdrop-blur-3xl p-4 space-y-2 shadow-zen-heavy"
        >
            <a href="/" onclick={() => isMenuOpen = false} class="block px-4 py-3 rounded-xl hover:bg-zen-sage/10 text-zen-sage font-bold">Pulse Dashboard</a>
            <a href="/stream" onclick={() => isMenuOpen = false} class="block px-4 py-3 rounded-xl hover:bg-zen-sage/10 text-zen-sage font-bold">Transaction Stream</a>
            <a href="/settings" onclick={() => isMenuOpen = false} class="block px-4 py-3 rounded-xl hover:bg-zen-sage/10 text-zen-sage font-bold">Settings</a>
        </div>
    {/if}
</header>

<main class="min-h-screen relative overflow-x-hidden pt-16 pb-40">
    <div class="max-w-7xl mx-auto">
        {#key $page.url.pathname}
            <div in:fade={{ duration: 300, delay: 150 }} out:fade={{ duration: 150 }} class="flex-1">
                {@render children()}
            </div>
        {/key}
    </div>
</main>

<!-- Persistent Global Bottom Area -->
<section
    class="fixed bottom-0 left-0 right-0 z-50 shadow-zen-heavy"
>
    <!-- Toggleable Input Pill -->
    {#if isInputVisible}
        <div transition:slide={{ duration: 300, axis: 'y' }} class="relative bg-zen-surface/90 backdrop-blur-3xl pt-6 pb-2 border-t border-zen-herb/10">
            <InputPill onInput={(text: string) => { handleNewInput(text); isInputVisible = false; }} />
        </div>
    {/if}

    <div class="relative bg-zen-surface/70 backdrop-blur-3xl">
        <!-- Background Gradient for readability -->
        <div class="absolute inset-0 bg-gradient-to-t from-zen-surface to-transparent pointer-events-none -top-12 h-12"></div>
        
        <nav
            class="border-t border-zen-herb/10 h-20 flex items-center justify-around px-2 mb-safe relative"
        >
            <!-- Pulse -->
            <a
                href="/"
                class="flex-1 flex flex-col items-center {String($page.url.pathname) === '/' ? 'text-zen-sage font-bold' : 'text-zen-herb opacity-40'} transition-all active:scale-90"
                aria-label="Pulse Dashboard"
            >
                <Icon name="home" size="24" />
                <span class="text-[9px] uppercase tracking-tighter mt-1">Pulse</span>
            </a>
            
            <!-- Stream -->
            <a
                href="/stream"
                class="flex-1 flex flex-col items-center {String($page.url.pathname).includes('/stream') ? 'text-zen-sage font-bold' : 'text-zen-herb opacity-40'} transition-all active:scale-90"
                aria-label="Transaction Stream"
            >
                <Icon name="list" size="24" />
                <span class="text-[9px] uppercase tracking-tighter mt-1">Stream</span>
            </a>

            <!-- Protruding FAB -->
            <div class="flex-none -top-8 relative px-4">
                <button
                    onclick={() => isInputVisible = !isInputVisible}
                    class="h-16 w-16 bg-zen-sage text-white rounded-full flex items-center justify-center shadow-zen-heavy hover:scale-105 active:scale-95 transition-all border-4 border-zen-surface group"
                    aria-label="Add Transaction"
                >
                    <Icon name="plus" size="32" class_="{isInputVisible ? 'rotate-45' : ''} transition-transform" strokeWidth="2.5" />
                </button>
            </div>

            <!-- Insight -->
            <a
                href="/insight"
                class="flex-1 flex flex-col items-center {String($page.url.pathname).includes('/insight') ? 'text-zen-sage font-bold' : 'text-zen-herb opacity-40'} transition-all active:scale-90"
                aria-label="Monthly Insights"
            >
                <Icon name="clock" size="24" />
                <span class="text-[9px] uppercase tracking-tighter mt-1">Insight</span>
            </a>

            <!-- Settings -->
            <a
                href="/settings"
                class="flex-1 flex flex-col items-center {String($page.url.pathname).includes('/settings') || String($page.url.pathname).includes('/purposes') || String($page.url.pathname).includes('/parties') ? 'text-zen-sage font-bold' : 'text-zen-herb opacity-40'} transition-all active:scale-90"
                aria-label="Settings"
            >
                <Icon name="settings" size="24" />
                <span class="text-[9px] uppercase tracking-tighter mt-1">Settings</span>
            </a>
        </nav>
    </div>
</section>

<ParserModal
    isOpen={isModalOpen}
    originalText={pendingInput}
    onClose={() => (isModalOpen = false)}
    onSelect={handleModalSelect}
/>
