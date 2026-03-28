<script lang="ts">
    import { transactions } from "$lib/stores/transactions";
    import TransactionCard from "$lib/components/TransactionCard.svelte";
    import { theme } from "$lib/stores/ui";
    import { fade, fly } from "svelte/transition";

    // Group transactions by date
    let groupedTransactions = $derived.by(() => {
        const groups: Record<string, any[]> = {};
        $transactions.forEach((t) => {
            if (!groups[t.date]) groups[t.date] = [];
            groups[t.date].push(t);
        });
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    });

    function formatDateHeader(dateStr: string) {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (dateStr === today.toISOString().split("T")[0]) return "Today";
        if (dateStr === yesterday.toISOString().split("T")[0])
            return "Yesterday";

        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
        });
    }
</script>

<div class="flex flex-col min-h-screen bg-zen-oat">
    <!-- Content -->
    <div class="px-4 space-y-8 mt-4">
        {#each groupedTransactions as [date, items], i}
            <section in:fly={{ y: 20, delay: i * 100, duration: 500 }}>
                <h3
                    class="sticky top-0 z-10 py-2 bg-zen-oat/80 backdrop-blur-md text-zen-herb font-heading font-bold text-xs uppercase tracking-widest mb-3"
                >
                    {formatDateHeader(date)}
                </h3>
                <div class="space-y-3">
                    {#each items as item}
                        <TransactionCard {item} />
                    {/each}
                </div>
            </section>
        {/each}
    </div>
</div>
