<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
    import { theme, isCaptureInputVisible, isEditingTransaction, toggleCaptureInput, closeCaptureInput, openCaptureInput } from "$lib/stores/ui";
    import { page } from "$app/stores";
    import { onNavigate } from "$app/navigation";
    import { onMount, tick } from "svelte";
    import { fade, slide } from "svelte/transition";
    import InputPill from "$lib/components/InputPill.svelte";
    import CaptureReviewSheet from "$lib/components/CaptureReviewSheet.svelte";
    import Toast from "$lib/components/Toast.svelte";
    import Icon from "$lib/components/Icon.svelte";
    import AuthModal from "$lib/components/AuthModal.svelte";
    import { migrateFromLocalStorage, migrateAccountToFundId, cleanupCategoriesData } from "$lib/db/migrate";
    import { signOut, user } from "$lib/stores/auth";
    import { authModalTrigger } from "$lib/stores/auth-modal";
    import { transactions } from "$lib/stores/transactions";
    import {
        submitCapture,
        commitParsedTransaction,
        type TransactionSubmitOverrides,
    } from "$lib/utils/submitTransaction";
    import type { ParsedTransactionDraft } from "$lib/utils/transactionParser";
    import type { ParseAssessment } from "$lib/utils/parseConfidence";

	let { children } = $props();

    // Navigation state
    const MENU_TRANSITION_MS = 280;
    let isMenuMounted = $state(false);
    let isMenuOpen = $state(false);
    let menuCloseTimer: ReturnType<typeof setTimeout> | undefined;

    // Capture review state
    let isReviewOpen = $state(false);
    let pendingInput = $state("");
    let pendingDraft = $state<ParsedTransactionDraft | null>(null);
    let pendingAssessment = $state<ParseAssessment | null>(null);
    let inputRestoreNonce = $state(0);
    let inputHasExtras = $state(false);
    let bottomChromeEl: HTMLElement | null = $state(null);

    function syncBottomChromeHeight() {
        if (typeof document === "undefined" || !bottomChromeEl) return;
        const height = bottomChromeEl.getBoundingClientRect().height;
        document.documentElement.style.setProperty("--bottom-chrome-height", `${height}px`);
    }

    onMount(() => {
        // Migrate localStorage data to IndexedDB on first load
        migrateFromLocalStorage();
        
        // Migrate old account field to fundId
        migrateAccountToFundId();
        
        // Clean up old categories data
        cleanupCategoriesData();
        
        if (!bottomChromeEl) return;

        const observer = new ResizeObserver(() => syncBottomChromeHeight());
        observer.observe(bottomChromeEl);
        syncBottomChromeHeight();

        return () => observer.disconnect();
    });

    $effect(() => {
        $isCaptureInputVisible;
        isReviewOpen;
        inputHasExtras;
        $isEditingTransaction;
        void tick().then(syncBottomChromeHeight);
    });

    function handleWindowKeydown(e: KeyboardEvent) {
        if (e.key !== "Escape") return;
        if (isReviewOpen) {
            handleReviewCancel();
            return;
        }
        if (isMenuMounted) {
            closeMenu();
            return;
        }
        if ($isCaptureInputVisible) {
            closeCaptureInput();
        }
    }

    function openMenu() {
        if (menuCloseTimer) {
            clearTimeout(menuCloseTimer);
            menuCloseTimer = undefined;
        }
        isMenuMounted = true;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                isMenuOpen = true;
            });
        });
    }

    function closeMenu() {
        if (!isMenuMounted) return;
        isMenuOpen = false;
        menuCloseTimer = setTimeout(() => {
            isMenuMounted = false;
            menuCloseTimer = undefined;
        }, MENU_TRANSITION_MS);
    }

    function toggleMenu() {
        if (isMenuMounted && isMenuOpen) closeMenu();
        else openMenu();
    }

    $effect(() => {
        if (typeof document === "undefined") return;
        document.body.style.overflow = isMenuMounted ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    });

    function toggleInput() {
        toggleCaptureInput();
    }

	// Global theme sync
	$effect(() => {
		if (typeof document !== "undefined") {
			document.documentElement.setAttribute("data-theme", $theme);
		}
	});

    /**
     * View Transitions Skill:
     * Intercepts SvelteKit navigation to trigger the native browser
     * View Transition API for seamless page morphing.
     */
    onNavigate((navigation) => {
        closeMenu();

        if (!document.startViewTransition) return;

        return new Promise((resolve) => {
            document.startViewTransition(async () => {
                resolve();
                await navigation.complete;
            });
        });
    });

    const pathname = $derived($page.url.pathname);

    const getPageTitle = $derived.by(() => {
        if (pathname === '/') return "Pulse";
        if (pathname.startsWith('/stream')) return "Stream";
        if (pathname.startsWith('/settings')) return "Settings";
        if (pathname.startsWith('/purposes')) return "Purposes";
        if (pathname.startsWith('/parties')) return "Parties";
        if (pathname.startsWith('/insight')) return "Insight";
        return "Zen Ledger";
    });

    function isNavActive(route: 'pulse' | 'stream' | 'insight' | 'settings') {
        switch (route) {
            case 'pulse':
                return pathname === '/';
            case 'stream':
                return pathname.startsWith('/stream');
            case 'insight':
                return pathname.startsWith('/insight');
            case 'settings':
                return (
                    pathname.startsWith('/settings') ||
                    pathname.startsWith('/parties') ||
                    pathname.startsWith('/purposes')
                );
        }
    }

    function clearReviewState() {
        isReviewOpen = false;
        pendingInput = "";
        pendingDraft = null;
        pendingAssessment = null;
    }

    async function handleNewInput(text: string, overrides?: TransactionSubmitOverrides) {
        const result = await submitCapture(text, overrides);
        if (result.status === "review") {
            pendingInput = result.originalText;
            pendingDraft = result.draft;
            pendingAssessment = result.assessment;
            isReviewOpen = true;
            closeCaptureInput();
            return;
        }
    }

    function handleInputFromFab(text: string, overrides?: TransactionSubmitOverrides) {
        handleNewInput(text, overrides);
        closeCaptureInput();
    }

    function handleReviewConfirm(overrides: TransactionSubmitOverrides) {
        if (!pendingDraft) return;
        commitParsedTransaction(pendingDraft, overrides);
        clearReviewState();
    }

    function handleReviewCancel() {
        isReviewOpen = false;
        pendingDraft = null;
        pendingAssessment = null;
        openCaptureInput();
        inputRestoreNonce++;
    }
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<svelte:window onkeydown={handleWindowKeydown} />

<div class="noise-overlay text-zen-sage"></div>
<Toast />

<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-zen-sage focus:text-zen-on-primary focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold">
    Skip to content
</a>

<!-- Global Top App Bar -->
<header
    class="fixed top-0 left-0 right-0 z-50 bg-zen-panel/95 border-b border-zen-herb/10 shadow-zen"
>
    <!-- ... (rest of header content) ... -->
    <div class="h-16 flex items-center justify-between px-6 max-w-7xl mx-auto">
        <!-- Brand -->
        <div class="flex items-center gap-4 min-w-0">
            <a href="/" class="flex items-center gap-2 group shrink-0">
                <div class="h-8 w-8 bg-zen-sage rounded-xl flex items-center justify-center text-lg shadow-lg shadow-zen-sage/20 group-hover:scale-110 transition-transform">
                    🌿
                </div>
                <div class="hidden sm:block">
                    <span class="text-sm font-bold tracking-tight text-zen-sage uppercase">Zen Ledger</span>
                </div>
            </a>
        </div>

        <!-- Dynamic Page Title -->
        <div class="absolute left-1/2 -translate-x-1/2 pointer-events-none px-20">
            <h1 class="text-lg font-heading font-bold text-zen-sage tracking-tight truncate text-center">
                {getPageTitle}
            </h1>
        </div>

        <!-- Utility Actions -->
        <div class="flex items-center gap-1 shrink-0">
            {#if !$user && $transactions.length > 0}
                <button
                    onclick={() => authModalTrigger.update(n => n + 1)}
                    class="h-10 px-3 bg-zen-sage/10 text-zen-sage rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-zen-sage/20 transition-all flex items-center gap-1.5"
                >
                    <Icon name="cloud" size={14} />
                    <span class="hidden sm:inline">Sync</span>
                </button>
            {/if}
            <AuthModal />
            <button
                type="button"
                onclick={toggleMenu}
                class="lg:hidden h-12 w-12 rounded-xl flex items-center justify-center text-zen-herb hover:text-zen-sage hover:bg-zen-almond/20 transition-all active:scale-95"
                aria-label={isMenuMounted ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-drawer"
            >
                {#if isMenuMounted}
                    <Icon name="close" size="22" strokeWidth="2" />
                {:else}
                    <Icon name="menu" size="22" strokeWidth="2" />
                {/if}
            </button>
        </div>
    </div>
</header>

<!-- Mobile drawer: overflow routes not in bottom bar -->
{#if isMenuMounted}
    <div class="mobile-drawer-root lg:hidden" class:open={isMenuOpen}>
        <div
            class="mobile-drawer-backdrop"
            onclick={closeMenu}
            onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && closeMenu()}
            role="button"
            tabindex="-1"
            aria-hidden="true"
        ></div>
        <div
            id="mobile-drawer"
            class="mobile-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="More navigation"
        >
        <div class="mobile-drawer-header">
            <p class="mobile-drawer-title">More</p>
            <button
                type="button"
                onclick={closeMenu}
                class="mobile-drawer-close"
                aria-label="Close menu"
            >
                <Icon name="close" size="20" strokeWidth="2" />
            </button>
        </div>

        <nav class="mobile-drawer-nav">
            <p class="mobile-drawer-section">Manage</p>
            <a
                href="/parties"
                onclick={closeMenu}
                class="mobile-drawer-link"
                aria-current={pathname.startsWith('/parties') ? 'page' : undefined}
            >
                <Icon name="users" size="20" strokeWidth={pathname.startsWith('/parties') ? '2.5' : '2'} />
                <span>Parties</span>
            </a>
            <a
                href="/purposes"
                onclick={closeMenu}
                class="mobile-drawer-link"
                aria-current={pathname.startsWith('/purposes') ? 'page' : undefined}
            >
                <Icon name="zap" size="20" strokeWidth={pathname.startsWith('/purposes') ? '2.5' : '2'} />
                <span>Purposes</span>
            </a>

            <p class="mobile-drawer-section">App</p>
            <a
                href="/settings"
                onclick={closeMenu}
                class="mobile-drawer-link"
                aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
            >
                <Icon name="settings" size="20" strokeWidth={pathname.startsWith('/settings') ? '2.5' : '2'} />
                <span>Settings</span>
            </a>

            {#if $user}
                <p class="mobile-drawer-section">Account</p>
                <button
                    onclick={() => { signOut(); closeMenu(); }}
                    class="mobile-drawer-link w-full text-left"
                >
                    <Icon name="logout" size="20" strokeWidth="2" />
                    <span>Sign out</span>
                </button>
            {/if}
        </nav>

        <p class="mobile-drawer-footnote">
            Pulse, Stream, and Insight live in the bottom bar.
        </p>
        </div>
    </div>
{/if}

<main id="main-content" class="min-h-screen relative overflow-x-hidden pt-16 bottom-chrome-pad">
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
    bind:this={bottomChromeEl}
    class="fixed bottom-0 left-0 right-0 z-50 shadow-zen-heavy pb-safe"
>
    <!-- Toggleable Input Pill -->
    {#if $isCaptureInputVisible && !isReviewOpen && !$isEditingTransaction}
        <div
            id="global-input-sheet"
            transition:slide={{ duration: 300, axis: 'y' }}
            class="relative bg-zen-panel pt-6 pb-2 border-t border-zen-herb/10"
        >
            <InputPill
                autoFocusOnMount={true}
                onInput={handleInputFromFab}
                onExtrasChange={(open: boolean) => (inputHasExtras = open)}
                restoreText={pendingInput}
                restoreNonce={inputRestoreNonce}
            />
        </div>
    {/if}

    <div class="relative bg-zen-panel border-t border-zen-herb/10">
        <nav
            class="h-20 flex items-center justify-around px-2 relative"
        >
            <!-- Pulse -->
            <a
                href="/"
                class="bottom-nav-tab flex-1 active:scale-90"
                aria-label="Pulse Dashboard"
                aria-current={isNavActive('pulse') ? 'page' : undefined}
            >
                <span class="bottom-nav-tab__indicator" aria-hidden="true"></span>
                <Icon name="home" size="24" strokeWidth={isNavActive('pulse') ? '2.5' : '2'} />
                <span class="bottom-nav-tab__label text-[10px] uppercase tracking-tight mt-1">Pulse</span>
            </a>
            
            <!-- Stream -->
            <a
                href="/stream"
                class="bottom-nav-tab flex-1 active:scale-90"
                aria-label="Transaction Stream"
                aria-current={isNavActive('stream') ? 'page' : undefined}
            >
                <span class="bottom-nav-tab__indicator" aria-hidden="true"></span>
                <Icon name="list" size="24" strokeWidth={isNavActive('stream') ? '2.5' : '2'} />
                <span class="bottom-nav-tab__label text-[10px] uppercase tracking-tight mt-1">Stream</span>
            </a>

            <!-- Protruding FAB -->
            <div class="flex-none -top-8 relative px-4">
                <button
                    type="button"
                    onclick={toggleInput}
                    class="h-16 w-16 bg-zen-sage text-zen-on-primary rounded-full flex items-center justify-center shadow-zen-heavy hover:scale-105 active:scale-95 transition-all border-4 border-zen-panel"
                    aria-expanded={$isCaptureInputVisible}
                    aria-controls="global-input-sheet"
                    aria-label={$isCaptureInputVisible ? "Close transaction input" : "Add transaction"}
                >
                    <Icon name="plus" size="32" class_="{$isCaptureInputVisible ? 'rotate-45' : ''} transition-transform" strokeWidth="2.5" />
                </button>
            </div>

            <!-- Insight -->
            <a
                href="/insight"
                class="bottom-nav-tab flex-1 active:scale-90"
                aria-label="Monthly Insights"
                aria-current={isNavActive('insight') ? 'page' : undefined}
            >
                <span class="bottom-nav-tab__indicator" aria-hidden="true"></span>
                <Icon name="clock" size="24" strokeWidth={isNavActive('insight') ? '2.5' : '2'} />
                <span class="bottom-nav-tab__label text-[10px] uppercase tracking-tight mt-1">Insight</span>
            </a>

            <!-- Settings -->
            <a
                href="/settings"
                class="bottom-nav-tab flex-1 active:scale-90"
                aria-label="Settings"
                aria-current={isNavActive('settings') ? 'page' : undefined}
            >
                <span class="bottom-nav-tab__indicator" aria-hidden="true"></span>
                <Icon name="settings" size="24" strokeWidth={isNavActive('settings') ? '2.5' : '2'} />
                <span class="bottom-nav-tab__label text-[10px] uppercase tracking-tight mt-1">Settings</span>
            </a>
        </nav>
    </div>
</section>

{#if pendingDraft && pendingAssessment}
    <CaptureReviewSheet
        isOpen={isReviewOpen}
        draft={pendingDraft}
        assessment={pendingAssessment}
        onConfirm={handleReviewConfirm}
        onCancel={handleReviewCancel}
    />
{/if}
