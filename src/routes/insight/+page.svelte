<script lang="ts">
	import { transactions } from "$lib/stores/transactions";
	import { fade, fly } from "svelte/transition";
	import { theme } from "$lib/stores/ui";
	import WealthLedger from "$lib/components/WealthLedger.svelte";

	const insights = [
		{
			title: "Dining out is down 12%",
			description:
				"Nice work! You've spent $45 less on restaurants this month compared to your average.",
			emoji: "🥗",
			color: "bg-zen-earn/20",
		},
		{
			title: "Subscriptions Check",
			description:
				"You've saved $450 this month, mostly by cutting back on subscriptions. Keep it up.",
			emoji: "📺",
			color: "bg-zen-almond/20",
		},
		{
			title: "Savings Momentum",
			description:
				"You're on track to save 15% of your income this month. That's your best streak yet!",
			emoji: "💰",
			color: "bg-zen-sage/10",
		},
	];

	let activeIndex = $state(0);
</script>

<div class="flex flex-col min-h-screen bg-zen-oat pt-8 px-6 pb-24 overflow-y-auto no-scrollbar">
	<!-- horizontal Swipe Cards (Stories) -->
	<section class="flex flex-col justify-center mb-12">
		<div class="relative w-full aspect-[4/5] max-h-[500px]">
			{#each insights as insight, i}
				{#if activeIndex === i}
					<div
						class="absolute inset-0 {insight.color} backdrop-blur-md rounded-zen shadow-zen-soft p-10 flex flex-col justify-between border border-zen-herb/10"
						in:fly={{ x: 300, duration: 600, opacity: 0 }}
						out:fly={{ x: -300, duration: 600, opacity: 0 }}
					>
						<div>
							<span class="text-6xl mb-6 block"
								>{insight.emoji}</span
							>
							<h2
								class="text-zen-sage text-3xl font-heading font-extrabold mb-4 leading-tight"
							>
								{insight.title}
							</h2>
						</div>

						<p
							class="text-zen-sage/80 font-body font-bold text-xl leading-relaxed"
						>
							{insight.description}
						</p>

						<!-- Progress dots -->
						<div class="flex space-x-2 mt-8">
							{#each insights as _, dotIndex}
								<div
									class="h-1.5 rounded-full transition-all duration-300 {activeIndex ===
									dotIndex
										? 'w-8 bg-zen-sage'
										: 'w-2 bg-zen-sage/20'}"
								></div>
							{/each}
						</div>
					</div>
				{/if}
			{/each}

			<!-- controls (Invisible buttons for tap) -->
			<button
				class="absolute inset-y-0 left-0 w-1/3 z-20 appearance-none bg-transparent border-none cursor-pointer"
				onclick={() => (activeIndex = Math.max(0, activeIndex - 1))}
				aria-label="Previous insight"
			></button>
			<button
				class="absolute inset-y-0 right-0 w-1/3 z-20 appearance-none bg-transparent border-none cursor-pointer"
				onclick={() =>
					(activeIndex = Math.min(
						insights.length - 1,
						activeIndex + 1,
					))}
				aria-label="Next insight"
			></button>
		</div>

		<p
			class="text-center mt-6 text-zen-herb font-body font-bold text-sm uppercase tracking-widest opacity-40"
		>
			Swipe for insights
		</p>
	</section>

	<!-- Wealth Ledger Section -->
	<section class="mt-8">
		<div class="flex items-center gap-3 mb-6">
			<h2 class="text-zen-sage font-heading font-black text-2xl">Wealth Ledger</h2>
			<div class="h-px flex-1 bg-zen-herb/10"></div>
		</div>
		
		<WealthLedger />
	</section>
</div>

<style>
/* No longer forcing hidden overflow to allow ledger access */
</style>
