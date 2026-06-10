<script lang="ts">
    import {
        purposes,
        type Purpose,
        type AccountType,
    } from "$lib/stores/purposes";
    import { ACCOUNT_TYPES } from "$lib/account-types";
    import { fade, fly } from "svelte/transition";

    let newName = $state("");
    let newEmoji = $state("📦");
    let newType = $state<AccountType>("expense");
    let newAliases = $state("");

    let editingId = $state("");
    let editName = $state("");
    let editType = $state<AccountType>("expense");
    let editAliases = $state("");

    function addPurpose() {
        if (!newName) return;
        purposes.addPurpose({
            name: newName,
            emoji: newEmoji,
            accountType: newType,
            aliases: newAliases
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0),
        });
        newName = "";
        newEmoji = "📦";
        newAliases = "";
    }

    function startEdit(p: Purpose) {
        editingId = p.id;
        editName = p.name;
        editType = p.accountType;
        editAliases = (p.aliases || []).join(", ");
    }

    function saveEdit() {
        purposes.updatePurpose(editingId, {
            name: editName,
            accountType: editType,
            aliases: editAliases
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0),
        });
        editingId = "";
    }

    function deletePurpose(id: string) {
        if (
            confirm(
                "Are you sure? This will affect all transactions using this purpose.",
            )
        ) {
            purposes.deletePurpose(id);
        }
    }
</script>

<div class="min-h-screen bg-zen-surface pb-32 pt-8">
    <main class="px-8 space-y-8">
        <!-- Add New Section -->
        <section
            class="bg-zen-panel p-6 rounded-zen shadow-zen-soft border border-zen-herb/5"
        >
            <h2 class="text-lg font-bold text-zen-sage mb-4">
                Add New Purpose
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div class="space-y-1">
                    <label
                        for="new-emoji"
                        class="text-[10px] uppercase font-bold text-zen-herb opacity-60"
                        >Emoji</label
                    >
                    <input
                        id="new-emoji"
                        bind:value={newEmoji}
                        class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg p-2 text-center text-xl"
                    />
                </div>
                <div class="space-y-1 md:col-span-2">
                    <label
                        for="new-name"
                        class="text-[10px] uppercase font-bold text-zen-herb opacity-60"
                        >Name</label
                    >
                    <input
                        id="new-name"
                        bind:value={newName}
                        placeholder="e.g. Travel, Health..."
                        class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg p-2 text-zen-sage focus:outline-none focus:ring-2 focus:ring-zen-sage/20"
                    />
                </div>
                <div class="space-y-1">
                    <label
                        for="new-type"
                        class="text-[10px] uppercase font-bold text-zen-herb opacity-60"
                        >Account Type</label
                    >
                    <select
                        id="new-type"
                        bind:value={newType}
                        class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg p-2 text-zen-sage outline-none"
                    >
                        {#each ACCOUNT_TYPES as type}
                            <option value={type.id}>{type.emoji} {type.name}</option>
                        {/each}
                    </select>
                </div>
                <!-- Alias Input for New Purpose -->
                <div class="space-y-1 md:col-span-4">
                    <label
                        for="new-aliases"
                        class="text-[10px] uppercase font-bold text-zen-herb opacity-60"
                        >Aliases (comma separated)</label
                    >
                    <input
                        id="new-aliases"
                        bind:value={newAliases}
                        placeholder="e.g. starbucks, cafe, espresso..."
                        class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg p-2 text-sm text-zen-sage focus:outline-none focus:ring-2 focus:ring-zen-sage/20"
                    />
                </div>
            </div>
            <button
                onclick={addPurpose}
                class="mt-4 w-full bg-zen-sage text-zen-on-primary font-bold py-3 rounded-xl shadow-zen-soft hover:bg-zen-sage/90 transition-all active:scale-95"
            >
                Add Purpose
            </button>
        </section>

        <!-- List Section -->
        <section class="space-y-4">
            <h2 class="text-lg font-bold text-zen-sage">Existing Purposes</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each $purposes as p}
                    <div
                        class="bg-zen-panel p-4 rounded-2xl border border-zen-herb/5 shadow-sm transition-all hover:border-zen-herb/20"
                        in:fade
                    >
                        {#if editingId === p.id}
                            <div class="space-y-3">
                                <div class="grid grid-cols-1 gap-2">
                                    <input
                                        bind:value={editName}
                                        placeholder="Name"
                                        class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg p-2 text-sm"
                                    />
                                    <input
                                        bind:value={editAliases}
                                        placeholder="Aliases (comma separated)"
                                        class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-lg p-2 text-[10px]"
                                    />
                                </div>
                                <div class="flex gap-2">
                                    <select
                                        bind:value={editType}
                                        class="flex-1 bg-zen-oat/30 border border-zen-herb/10 rounded-lg p-2 text-xs"
                                    >
                                        <option value="expense">Expense</option>
                                        <option value="earning">Earning</option>
                                        <option value="receivable"
                                            >Receivable</option
                                        >
                                        <option value="payable">Payable</option>
                                        <option value="recovered"
                                            >Recovered</option
                                        >
                                        <option value="repaid">Repaid</option>
                                    </select>
                                    <button
                                        onclick={saveEdit}
                                        class="px-4 bg-zen-sage text-zen-on-primary text-xs font-bold rounded-lg"
                                        >Save</button
                                    >
                                    <button
                                        onclick={() => (editingId = "")}
                                        class="px-4 bg-zen-herb/10 text-zen-herb text-xs font-bold rounded-lg text-opacity-10"
                                        >Cancel</button
                                    >
                                </div>
                            </div>
                        {:else}
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <span class="text-3xl">{p.emoji}</span>
                                    <div>
                                        <h3 class="font-bold text-zen-sage">
                                            {p.name}
                                        </h3>
                                        {#if p.aliases && p.aliases.length > 0}
                                            <p
                                                class="text-[10px] text-zen-herb opacity-70 italic truncate max-w-[200px]"
                                            >
                                                {p.aliases.join(", ")}
                                            </p>
                                        {/if}
                                        <span
                                            class="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full {p.accountType ===
                                            'expense'
                                                ? 'bg-zen-spend/10 text-zen-spend'
                                                : p.accountType === 'earning'
                                                  ? 'bg-zen-earn/10 text-zen-earn'
                                                  : p.accountType === 'payable'
                                                    ? 'bg-zen-spend/10 text-zen-spend'
                                                    : 'bg-zen-almond/20 text-zen-herb'}"
                                        >
                                            {p.accountType}
                                        </span>
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <button
                                        onclick={() => startEdit(p)}
                                        class="p-2 text-zen-herb hover:text-zen-sage transition-colors"
                                        aria-label="Edit purpose"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        onclick={() => deletePurpose(p.id)}
                                        class="p-2 text-zen-herb hover:text-zen-spend transition-colors"
                                        aria-label="Delete purpose"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            class="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
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
