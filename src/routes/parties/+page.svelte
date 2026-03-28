<script lang="ts">
    import { parties, type Party } from "$lib/stores/parties";
    import { transactions } from "$lib/stores/transactions";
    import { fade } from "svelte/transition";

    let newName = $state("");
    let newEmoji = $state("👤");
    let newAliases = $state("");

    let editingId = $state("");
    let editName = $state("");
    let editEmoji = $state("");
    let editAliases = $state("");

    function addParty() {
        if (!newName) return;
        parties.addParty({
            name: newName,
            emoji: newEmoji,
            aliases: newAliases.split(',').map(s => s.trim()).filter(s => s.length > 0)
        });
        newName = "";
        newEmoji = "👤";
        newAliases = "";
    }

    function startEdit(p: Party) {
        editingId = p.id;
        editName = p.name;
        editEmoji = p.emoji;
        editAliases = (p.aliases || []).join(', ');
    }

    function saveEdit() {
        parties.updateParty(editingId, {
            name: editName,
            emoji: editEmoji,
            aliases: editAliases.split(',').map(s => s.trim()).filter(s => s.length > 0)
        });
        editingId = "";
    }

    function deleteParty(id: string) {
        if (confirm("Are you sure?")) {
            parties.deleteParty(id);
        }
    }

    function getPartyBalance(partyId: string) {
        return $transactions
            .filter(t => t.partyId === partyId)
            .reduce((acc, t) => acc + t.amount, 0);
    }
</script>

<div class="min-h-screen bg-zen-surface pb-32 pt-8">
    <main class="px-8 space-y-8">
        <!-- Add New Section -->
        <section class="bg-zen-panel p-6 rounded-zen shadow-zen-soft border border-zen-herb/5">
            <h2 class="text-lg font-bold text-zen-sage mb-4">Add New Party</h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div class="space-y-1">
                    <label for="new-emoji-party" class="text-[10px] uppercase font-bold text-zen-herb opacity-60">Emoji</label>
                    <input id="new-emoji-party" bind:value={newEmoji} class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg p-2 text-center text-xl" />
                </div>
                <div class="space-y-1 md:col-span-3">
                    <label for="new-name-party" class="text-[10px] uppercase font-bold text-zen-herb opacity-60">Name</label>
                    <input id="new-name-party" bind:value={newName} placeholder="e.g. John, Amazon..." class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg p-2 text-zen-sage focus:outline-none focus:ring-2 focus:ring-zen-sage/20" />
                </div>
                <div class="space-y-1 md:col-span-4">
                    <label for="new-aliases-party" class="text-[10px] uppercase font-bold text-zen-herb opacity-60">Aliases (comma separated)</label>
                    <input id="new-aliases-party" bind:value={newAliases} placeholder="e.g. johnny, doe, shopping..." class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg p-2 text-sm text-zen-sage focus:outline-none focus:ring-2 focus:ring-zen-sage/20" />
                </div>
            </div>
            <button onclick={addParty} class="mt-4 w-full bg-zen-sage text-white font-bold py-3 rounded-xl shadow-zen-soft hover:bg-zen-sage/90 transition-all active:scale-95">
                Add Party
            </button>
        </section>

        <!-- List Section -->
        <section class="space-y-4">
            <h2 class="text-lg font-bold text-zen-sage">Existing Parties</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                {#each $parties as p}
                    <div class="bg-zen-panel p-6 rounded-2xl border border-zen-herb/5 shadow-sm transition-all hover:border-zen-herb/20" in:fade>
                        {#if editingId === p.id}
                            <div class="space-y-3">
                                <input bind:value={editEmoji} class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg p-2 text-center text-xl" />
                                <input bind:value={editName} placeholder="Name" class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg p-2 text-sm" />
                                <input bind:value={editAliases} placeholder="Aliases (comma separated)" class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg p-2 text-[10px]" />
                                <div class="flex gap-2">
                                    <button onclick={saveEdit} class="flex-1 bg-zen-sage text-white text-xs font-bold py-2 rounded-lg">Save</button>
                                    <button onclick={() => editingId = ""} class="flex-1 bg-zen-herb/10 text-zen-herb text-xs font-bold py-2 rounded-lg">Cancel</button>
                                </div>
                            </div>
                        {:else}
                            <div class="flex flex-col items-center text-center space-y-3">
                                <span class="text-4xl">{p.emoji}</span>
                                <div class="w-full">
                                    <h3 class="font-bold text-zen-sage">{p.name}</h3>
                                    {#if p.aliases && p.aliases.length > 0}
                                        <p class="text-[10px] text-zen-herb opacity-70 italic truncate mt-0.5">
                                            {p.aliases.join(", ")}
                                        </p>
                                    {/if}
                                    <p class="text-xs font-bold {getPartyBalance(p.id) < 0 ? 'text-zen-spend' : 'text-emerald-500'} mt-1">
                                        Net: ${Math.abs(getPartyBalance(p.id)).toFixed(0)}
                                    </p>
                                    <!-- Audit Timestamps -->
                                    <div class="mt-3 pt-3 border-t border-zen-herb/5 grid grid-cols-2 gap-4">
                                        <div class="space-y-0.5">
                                            <span class="text-[7px] uppercase font-bold text-zen-herb opacity-30 tracking-widest leading-none block">Created</span>
                                            <span class="text-[8px] text-zen-sage opacity-50 font-medium leading-none block">
                                                {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                                            </span>
                                        </div>
                                        <div class="space-y-0.5">
                                            <span class="text-[7px] uppercase font-bold text-zen-herb opacity-30 tracking-widest leading-none block">Modified</span>
                                            <span class="text-[8px] text-zen-sage opacity-50 font-medium leading-none block">
                                                {new Date(p.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex gap-2 w-full pt-2">
                                    <button onclick={() => startEdit(p)} class="flex-1 py-1.5 border border-zen-herb/20 rounded-lg text-xs font-bold text-zen-herb hover:text-zen-sage transition-colors">
                                        Edit
                                    </button>
                                    <button onclick={() => deleteParty(p.id)} class="flex-1 py-1.5 border border-zen-herb/20 rounded-lg text-xs font-bold text-zen-herb hover:text-zen-spend transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </section>
    </main>
</div>
