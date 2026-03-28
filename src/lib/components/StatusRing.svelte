<script lang="ts">
    import { onMount } from "svelte";
    import { tweened } from "svelte/motion";
    import { cubicOut } from "svelte/easing";

    let {
        progress = 0.6, // 0 to 1
        centerLabel = "Safe to spend",
        amount = "$120",
    } = $props();

    const animatedProgress = tweened(0, {
        duration: 1200,
        easing: cubicOut,
    });

    onMount(() => {
        animatedProgress.set(progress);
    });

    // SVG parameters
    const size = 280;
    const strokeWidth = 24;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let offset = $derived(circumference - $animatedProgress * circumference);
</script>

<div class="flex flex-col items-center justify-center py-12">
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
            <span
                class="text-zen-herb text-[10px] font-bold uppercase tracking-[0.2em] mb-2 opacity-80"
            >
                {centerLabel}
            </span>
            <span
                class="text-zen-sage text-6xl font-heading font-black tabular-nums tracking-tight drop-shadow-xl"
            >
                {amount}
            </span>
        </div>
    </div>
</div>
