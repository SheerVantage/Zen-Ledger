<script lang="ts">
    import InputPill from "$lib/components/InputPill.svelte";
    import { parties } from "$lib/stores/parties";
    import { purposes } from "$lib/stores/purposes";
    import { onMount } from "svelte";
    
    let logs = $state<string[]>([]);
    
    function handleInput(text: string, overrides?: any) {
        logs = [...logs, `Input: ${text} | Overrides: ${JSON.stringify(overrides)}`];
    }

    onMount(() => {
        // Ensure some data exists
        parties.addParty({ name: "Test Party", emoji: "👤" });
        purposes.addPurpose({ name: "Test Purpose", emoji: "🏷️", accountType: "expense" });
    });
</script>

<div class="p-8 space-y-8">
    <section>
        <h2 class="text-xl font-bold mb-4">Default Mode (Standalone)</h2>
        <div id="standalone-test">
            <InputPill onInput={handleInput} />
        </div>
    </section>

    <section>
        <h2 class="text-xl font-bold mb-4">Inline Mode</h2>
        <div id="inline-test">
            <!-- @ts-ignore - mode prop doesn't exist yet -->
            <InputPill mode="inline" onInput={handleInput} />
        </div>
    </section>

    <section>
        <h2 class="text-xl font-bold mb-4">Logs</h2>
        <ul id="test-logs">
            {#each logs as log}
                <li>{log}</li>
            {/each}
        </ul>
    </section>
</div>
