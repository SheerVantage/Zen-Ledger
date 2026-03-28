<script lang="ts">
    import {
        purposes,
        type Purpose,
        type AccountType,
    } from "$lib/stores/purposes";
    import { categories } from "$lib/stores/categories";
    import { fade, scale } from "svelte/transition";

    let { isOpen = $bindable(false) } = $props();

    let editingId = $state("");
    let editName = $state("");
    let editType = $state<AccountType>("expense");
    let editAliases = $state("");

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
        if (confirm("Are you sure you want to delete this purpose?")) {
            purposes.deletePurpose(id);
        }
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zen-sage/20 backdrop-blur-md"
        transition:fade={{ duration: 300 }}
        onclick={() => (isOpen = false)}
    >
        <div
            class="bg-zen-surface w-full max-w-md rounded-zen shadow-zen-soft overflow-hidden"
            transition:scale={{ duration: 300, start: 0.95 }}
            onclick={(e) => e.stopPropagation()}
        >
            <div
                class="p-6 border-b border-zen-herb/10 flex justify-between items-center"
            >
                <h2 class="text-xl font-heading font-bold text-zen-sage">
                    Manage Purposes
                </h2>
                <button
                    onclick={() => (isOpen = false)}
                    class="text-zen-herb hover:text-zen-sage transition-colors"
                    aria-label="Close"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            <div
                class="max-h-[60vh] overflow-y-auto p-4 space-y-3 no-scrollbar"
            >
                {#each $purposes as p}
                    <div
                        class="bg-zen-oat/30 border border-zen-herb/5 rounded-xl p-3 transition-all hover:border-zen-herb/20"
                    >
                        {#if editingId === p.id}
                            <div class="space-y-3">
                                <div class="grid grid-cols-1 gap-2">
                                    <input
                                        type="text"
                                        bind:value={editName}
                                        placeholder="Name"
                                        class="w-full bg-zen-oat/30 border border-zen-herb/20 rounded-lg px-3 py-2 text-sm text-zen-sage focus:ring-2 focus:ring-zen-sage/20 outline-none"
                                    />
                                    <input
                                        type="text"
                                        bind:value={editAliases}
                                        placeholder="Aliases (comma separated)"
                                        class="w-full bg-zen-oat/30 border border-zen-herb/20 rounded-lg px-3 py-2 text-[11px] text-zen-sage focus:ring-2 focus:ring-zen-sage/20 outline-none"
                                    />
                                </div>
                                <div class="flex gap-2">
                                    <select
                                        bind:value={editType}
                                        class="flex-1 bg-zen-oat/30 border border-zen-herb/20 rounded-lg px-3 py-2 text-xs text-zen-sage outline-none"
                                    >
                                        {#each $categories as cat}
                                            <option value={cat.id}>{cat.emoji} {cat.name}</option>
                                        {/each}
                                    </select>
                                    <button
                                        onclick={saveEdit}
                                        class="px-4 bg-zen-sage text-white text-xs font-bold rounded-lg hover:bg-zen-sage/90 transition-colors"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onclick={() => (editingId = "")}
                                        class="px-4 border border-zen-herb/20 text-zen-herb text-xs font-bold rounded-lg hover:bg-zen-herb/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        {:else}
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <span class="text-2xl">{p.emoji}</span>
                                    <div>
                                        <p class="font-bold text-zen-sage">
                                            {p.name}
                                        </p>
                                        {#if p.aliases && p.aliases.length > 0}
                                            <p
                                                class="text-[9px] text-zen-herb opacity-70 italic truncate max-w-[150px]"
                                            >
                                                {p.aliases.join(", ")}
                                            </p>
                                        {/if}
                                        <p
                                            class="text-[10px] uppercase tracking-wider text-zen-herb font-bold opacity-60 mt-0.5"
                                        >
                                            {p.accountType}
                                        </p>
                                        <!-- Audit Timestamps -->
                                        <div
                                            class="mt-2 pt-2 border-t border-zen-herb/5 grid grid-cols-2 gap-4"
                                        >
                                            <div class="space-y-0.5">
                                                <span
                                                    class="text-[7px] uppercase font-bold text-zen-herb opacity-30 tracking-widest leading-none block"
                                                    >Created</span
                                                >
                                                <span
                                                    class="text-[8px] text-zen-sage opacity-50 font-medium leading-none block"
                                                >
                                                    {new Date(
                                                        p.createdAt,
                                                    ).toLocaleDateString(
                                                        undefined,
                                                        {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "2-digit",
                                                        },
                                                    )}
                                                </span>
                                            </div>
                                            <div class="space-y-0.5">
                                                <span
                                                    class="text-[7px] uppercase font-bold text-zen-herb opacity-30 tracking-widest leading-none block"
                                                    >Modified</span
                                                >
                                                <span
                                                    class="text-[8px] text-zen-sage opacity-50 font-medium leading-none block"
                                                >
                                                    {new Date(
                                                        p.updatedAt,
                                                    ).toLocaleDateString(
                                                        undefined,
                                                        {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "2-digit",
                                                        },
                                                    )}
                                                </span>
                                            </div>
                                        </div>
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
                                            class="h-4 w-4"
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
                                            class="h-4 w-4"
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

            <div class="p-6 bg-zen-oat/10 text-center">
                <p class="text-xs text-zen-herb italic">
                    All transactions using a purpose will be updated
                    automatically.
                </p>
            </div>
        </div>
    </div>
{/if}
