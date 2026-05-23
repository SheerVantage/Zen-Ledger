<script lang="ts">
    import { onMount } from "svelte";
    import { tweened } from "svelte/motion";
    import { cubicOut } from "svelte/easing";

    let {
        progress = 0.6, // 0 to 1
        centerLabel = "Safe to spend",
        amount = "$120",
        compact = false,
    } = $props();

    const animatedProgress = tweened(0, {
        duration: 1200,
        easing: cubicOut,
    });

    onMount(() => {
        animatedProgress.set(progress);
    });

    $effect(() => {
        animatedProgress.set(progress);
    });

    // SVG parameters
    const size = $derived(compact ? 220 : 280);
    const strokeWidth = $derived(compact ? 20 : 24);
    const radius = $derived((size - strokeWidth) / 2);
    const circumference = $derived(2 * Math.PI * radius);

    let offset = $derived(circumference - $animatedProgress * circumference);
</script>

<div
    class="flex flex-col items-center justify-center {compact ? 'py-4' : 'py-12'}"
    role="img"
    aria-label="{centerLabel}: {amount}"
    aria-live="polite"
>
    <div
        class="relative flex items-center justify-center"
        style="width: {size}px; height: {size}px;"
    >
        <!-- SVG Ring -->
        <svg
            width={size}
            height={size}
            viewBox="0 0 {size} {size}"
            class="transform -rotate-90 drop-shadow-sm"
        >
            <!-- Background track -->
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="currentColor"
                stroke-width={strokeWidth}
                class="text-zen-herb/10"
            />

            <!-- Progress track with gradient -->
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="url(#ringGradient)"
                stroke-width={strokeWidth}
                stroke-dasharray={circumference}
                stroke-dashoffset={offset}
                stroke-linecap="round"
                class="transition-all duration-300"
            />

            <defs>
                <linearGradient
                    id="ringGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >
                    <stop offset="0%" stop-color="var(--color-zen-spend)" />
                    <stop offset="100%" stop-color="var(--color-zen-sage)" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
        </svg>

        <!-- Center Content -->
        <div
            class="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
        >
            <span class="zen-micro-label mb-2 opacity-90">
                {centerLabel}
            </span>
            <span
                class="text-zen-sage font-heading font-black tabular-nums tracking-tight drop-shadow-xl {compact ? 'text-5xl' : 'text-6xl'}"
            >
                {amount}
            </span>
        </div>
    </div>
</div>
