<script lang="ts">
    import "../app.css";
    import { onNavigate } from "$app/navigation";

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

    let { children } = $props();
</script>

<div
    class="min-h-screen bg-slate-50/50 font-sans text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900 dark:bg-slate-950 dark:text-slate-100"
>
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header
            class="flex h-16 items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60"
        >
            <div class="flex items-center gap-2">
                <div
                    class="h-8 w-8 rounded-lg bg-emerald-600 shadow-lg shadow-emerald-500/20"
                ></div>
                <span class="text-lg font-bold tracking-tight">Vault</span>
            </div>

            <nav class="flex gap-6 text-sm font-medium text-slate-500">
                <a href="/" class="hover:text-emerald-600 transition-colors"
                    >Dashboard</a
                >
                <a
                    href="/transactions"
                    class="hover:text-emerald-600 transition-colors">History</a
                >
                <a
                    href="/settings"
                    class="hover:text-emerald-600 transition-colors">Settings</a
                >
            </nav>
        </header>

        <main class="py-8">
            {@render children()}
        </main>
    </div>
</div>

<style shadow>
    /* View Transition Animation Tweak:
	  Makes the "cross-fade" slightly faster and smoother.
	*/
    ::view-transition-old(root),
    ::view-transition-new(root) {
        animation-duration: 0.25s;
        animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
</style>
