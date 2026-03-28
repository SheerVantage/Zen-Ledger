<script lang="ts">
    import {
        transactions,
        deleteTransaction,
        updateTransaction,
        settleTransaction,
        type Transaction,
    } from "$lib/stores/transactions";
    import { purposes, type Purpose, type AccountType } from "$lib/stores/purposes";
    import { parties, type Party } from "$lib/stores/parties";
    import { categories } from "$lib/stores/categories";
    import { slide, fade } from "svelte/transition";
    import Icon from "$lib/components/Icon.svelte";
    import { formatAmount } from "$lib/utils/formatters";

    let { item } = $props();

    let isExpanded = $state(false);
    let isEditing = $state(false);

    // Editing state (local clone of item props)
    let editNarration = $state(item.narration);
    let editAmount = $state(item.amount.toString());
    let editPurposeId = $state(item.purposeId);
    let editDate = $state(item.date);
    let editPartyId = $state(item.partyId || "");

    // Sync editing state with prop changes when not actively editing
    $effect(() => {
        if (!isEditing) {
            editNarration = item.narration;
            editAmount = item.amount.toString();
            editPurposeId = item.purposeId;
            editDate = item.date;
            editPartyId = item.partyId || "";
        }
    });

    // Selection Tagging State
    let showSelectionMenu = $state(false);
    let selectionText = $state("");
    let selectionCoords = $state({ x: 0, y: 0 });

    function handleMouseUp(e: MouseEvent) {
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        
        if (text && text.length > 0 && item.narration.includes(text)) {
            const range = selection?.getRangeAt(0);
            const rect = range?.getBoundingClientRect();
            
            if (rect) {
                selectionText = text;
                selectionCoords = {
                    x: rect.left + window.scrollX + (rect.width / 2),
                    y: rect.top + window.scrollY - 10
                };
                showSelectionMenu = true;
            }
        } else {
            showSelectionMenu = false;
        }
    }

    function handleTextareaMouseUp(e: MouseEvent) {
        const textarea = e.target as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        if (start !== end) {
            const text = textarea.value.substring(start, end).trim();
            if (text.length > 0) {
                // Approximate position for textarea selection is harder, 
                // but we can use the cursor position or the textarea itself
                const rect = textarea.getBoundingClientRect();
                selectionText = text;
                selectionCoords = {
                    x: rect.left + window.scrollX + (rect.width / 2),
                    y: rect.top + window.scrollY - 10
                };
                showSelectionMenu = true;
                return;
            }
        }
        showSelectionMenu = false;
    }
    import SelectionMenu from "$lib/components/SelectionMenu.svelte";

    function tagAsPurpose() {
        const existing = $purposes.find(p => p.name.toLowerCase() === selectionText.toLowerCase());
        if (existing) {
            if (isEditing) {
                editPurposeId = existing.id;
            } else {
                updateTransaction(item.id, { purposeId: existing.id });
            }
        } else {
            // Similarity check
            const similar = purposes.findSimilar(selectionText, $purposes);
            if (similar.length > 0) {
                const names = similar.map(p => p.name).join(", ");
                if (!confirm(`Similar purposes already exist: ${names}. Do you still want to add '${selectionText}'?`)) {
                    return;
                }
            }
            // New flow: Prefill the "Add Purpose" UI
            if (!isEditing) isExpanded = true;
            isAddingPurpose = true;
            newPurposeName = selectionText;
        }
        showSelectionMenu = false;
        window.getSelection()?.removeAllRanges();
    }

    function tagAsParty() {
        const existing = $parties.find(p => p.name.toLowerCase() === selectionText.toLowerCase());
        if (existing) {
            if (isEditing) {
                editPartyId = existing.id;
            } else {
                updateTransaction(item.id, { partyId: existing.id });
            }
        } else {
            // Similarity check
            const similar = parties.findSimilar(selectionText, $parties);
            if (similar.length > 0) {
                const names = similar.map(p => p.name).join(", ");
                if (!confirm(`Similar parties already exist: ${names}. Do you still want to add '${selectionText}'?`)) {
                    return;
                }
            }
            parties.addParty({ name: selectionText, emoji: "👤" });
            setTimeout(() => {
                const created = $parties.find(p => p.name === selectionText);
                if (created) {
                    if (isEditing) {
                        editPartyId = created.id;
                    } else {
                        updateTransaction(item.id, { partyId: created.id });
                    }
                }
            }, 100);
        }
        showSelectionMenu = false;
        window.getSelection()?.removeAllRanges();
    }

    // Purpose management
    let isAddingPurpose = $state(false);
    let newPurposeName = $state("");
    let newPurposeType = $state("expense");

    // Svelte 5: Derived properties for better reactivity
    const currentPurpose = $derived(
        $purposes.find((p) => p.id === item.purposeId) || { name: 'Unknown', emoji: '❓', accountType: 'expense' }
    );
    const currentParty = $derived(
        $parties.find((p) => p.id === item.partyId)
    );
    const isExpense = $derived(item.amount < 0);
    const formattedAmount = $derived(formatAmount(item.amount));

    const settlements = $derived(
        $transactions.filter(t => t.linkedTo === item.id)
    );
    
    const outstandingAmount = $derived.by(() => {
        if (currentPurpose?.accountType !== 'receivable' && currentPurpose?.accountType !== 'payable') return 0;
        const settled = settlements.reduce((sum, s) => sum + Math.abs(s.amount), 0);
        return Math.max(0, Math.abs(item.amount) - settled);
    });

    const isFullySettled = $derived(item.status === 'completed' && (currentPurpose?.accountType === 'receivable' || currentPurpose?.accountType === 'payable'));
    
    const isProspect = $derived(currentPurpose?.accountType === 'prospect');

    function formatHumanDate(dateStr: string) {
        if (!dateStr) return "";
        const today = new Date().toISOString().split("T")[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().split("T")[0];

        if (dateStr === today) return "Today";
        if (dateStr === yesterday) return "Yesterday";

        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    }

    const humanDate = $derived(formatHumanDate(item.date));

    function startEdit() {
        editNarration = item.narration;
        editAmount = item.amount.toString();
        editPurposeId = item.purposeId;
        editDate = item.date;
        isEditing = true;
    }

    function saveEdit() {
        updateTransaction(item.id, {
            narration: editNarration,
            amount: Number(editAmount),
            purposeId: editPurposeId,
            date: editDate,
            partyId: editPartyId,
        });
        isEditing = false;
    }

    function handlePurposeChange(e: Event) {
        const value = (e.target as HTMLSelectElement).value;
        if (value === "new") {
            isAddingPurpose = true;
        } else {
            editPurposeId = value;
        }
    }

    function addNewPurpose() {
        if (newPurposeName) {
            purposes.addPurpose({
                name: newPurposeName,
                emoji: "🏷️",
                accountType: newPurposeType as any,
            });
            isAddingPurpose = false;
            newPurposeName = "";
        }
    }
</script>

{#if showSelectionMenu}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class="fixed z-[100] bg-zen-sage text-white rounded-lg shadow-xl py-1 px-1 flex gap-1 transform -translate-x-1/2 -translate-y-full"
        style="left: {selectionCoords.x}px; top: {selectionCoords.y}px;"
        transition:fade={{ duration: 150 }}
        onclick={(e) => e.stopPropagation()}
    >
        <button 
            onclick={tagAsPurpose}
            class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 rounded-md transition-colors"
        >
            Tag Purpose
        </button>
        <div class="w-px bg-white/20 my-1"></div>
        <button 
            onclick={tagAsParty}
            class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 rounded-md transition-colors"
        >
            Tag Party
        </button>
    </div>
{/if}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="w-full bg-zen-surface backdrop-blur-sm rounded-zen shadow-sm border border-zen-herb/5 mb-3 transition-all duration-300 hover:shadow-zen-soft group overflow-hidden"
    class:shadow-zen-soft={isExpanded}
    onclick={() => {
        if (!isEditing) isExpanded = !isExpanded;
    }}
>
    <div class="p-4 space-y-2">
        <!-- Row 1: Narration (Full Width) -->
        <div class="w-full">
            <h4 
                class="text-zen-sage font-body font-normal text-sm {isExpanded ? 'whitespace-normal' : 'line-clamp-2'} opacity-90 cursor-text"
                onmouseup={handleMouseUp}
                role="heading"
                aria-level="4"
            >
                {item.narration}
            </h4>
        </div>

        <!-- Row 2: Emoji, Purpose, Party, Date, and Amount -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 min-w-0">
                <div class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center {isExpense ? 'bg-zen-spend/10 text-zen-spend' : 'bg-emerald-500/10 text-emerald-500'}">
                    <Icon 
                        name={isExpense ? 'arrow-up-right' : 'arrow-down-left'} 
                        size="18" 
                    />
                </div>
                <div class="flex flex-col min-w-0">
                    <p class="text-zen-sage font-body font-bold text-[10px] truncate uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                        {currentPurpose?.emoji} {currentPurpose?.name} • {humanDate}
                    </p>
                    {#if currentParty}
                        <p class="text-[9px] font-bold text-zen-herb opacity-60 uppercase tracking-tighter truncate group-hover:opacity-80 transition-opacity">
                            {currentParty.emoji} {currentParty.name}
                        </p>
                    {/if}
                </div>
            </div>

            <div class="text-right flex-shrink-0">
                <p
                    class="font-heading font-black text-base {currentPurpose?.accountType === 'expense' || currentPurpose?.accountType === 'repaid' ? 'text-zen-spend' : 
                            currentPurpose?.accountType === 'earning' || currentPurpose?.accountType === 'recovered' ? 'text-emerald-500' :
                            currentPurpose?.accountType === 'payable' ? 'text-pink-400' :
                            currentPurpose?.accountType === 'receivable' ? 'text-blue-400' : 
                            currentPurpose?.accountType === 'prospect' ? 'text-zen-herb opacity-70 italic' : 'text-zen-sage'}"
                >
                    {item.amount === 0 && isProspect ? 'Plan' : formattedAmount}
                </p>
                {#if (currentPurpose?.accountType === 'receivable' || currentPurpose?.accountType === 'payable') && item.status !== 'completed'}
                    <p class="text-[9px] font-bold text-zen-spend opacity-80 uppercase tracking-tighter">
                        {formatAmount(outstandingAmount)} Due
                    </p>
                {/if}
                {#if item.status && item.status !== 'completed'}
                    <span class="inline-block px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest {item.status === 'partial' ? 'bg-amber-500/10 text-amber-500' : 'bg-zen-herb/10 text-zen-herb opacity-60'}">
                        {item.status}
                    </span>
                {/if}
                {#if item.isPassthrough}
                    <span class="inline-block px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest bg-pink-500/10 text-pink-500 border border-pink-500/20 ml-1">
                        Passthrough
                    </span>
                {/if}
            </div>
        </div>
        
        {#if item.account}
            <div class="mt-2 px-1 flex items-center gap-1.5 opacity-40">
                <span class="text-[8px] font-black uppercase tracking-tighter text-zen-herb">Account</span>
                <span class="text-[8px] font-bold text-zen-sage px-1.5 py-0.5 bg-zen-herb/5 rounded-md">{item.account}</span>
                {#if item.toAccount}
                    <span class="text-[8px] opacity-40">→</span>
                    <span class="text-[8px] font-bold text-zen-sage px-1.5 py-0.5 bg-zen-herb/5 rounded-md">{item.toAccount}</span>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Expansion Area -->
    {#if isExpanded}
        <div
            transition:slide={{ duration: 400 }}
            class="px-4 pb-4 border-t border-zen-herb/5 mt-1"
        >
            {#if isEditing}
                <div class="pt-4 space-y-4">
                    <div class="space-y-1">
                        <label
                            for="edit-narration-{item.id}"
                            class="text-zen-herb text-xs font-bold uppercase tracking-wider"
                            >Narration</label
                        >
                        <textarea
                            id="edit-narration-{item.id}"
                            bind:value={editNarration}
                            onmouseup={handleTextareaMouseUp}
                            rows="2"
                            class="w-full bg-zen-oat/50 border border-zen-herb/20 rounded-lg px-3 py-2 text-zen-sage font-body focus:outline-none focus:ring-2 focus:ring-zen-sage/30 resize-none"
                        ></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label
                                for="edit-amount-{item.id}"
                                class="text-zen-herb text-xs font-bold uppercase tracking-wider"
                                >Amount</label
                            >
                            <input
                                id="edit-amount-{item.id}"
                                type="number"
                                step="0.01"
                                bind:value={editAmount}
                                class="w-full bg-zen-oat/50 border border-zen-herb/20 rounded-lg px-3 py-2 text-zen-sage font-body focus:outline-none focus:ring-2 focus:ring-zen-sage/30"
                            />
                        </div>
                        <div class="space-y-1">
                            <label
                                for="edit-date-{item.id}"
                                class="text-zen-herb text-xs font-bold uppercase tracking-wider"
                                >Date</label
                            >
                            <input
                                id="edit-date-{item.id}"
                                type="date"
                                bind:value={editDate}
                                class="w-full bg-zen-oat/50 border border-zen-herb/20 rounded-lg px-3 py-2 text-zen-sage font-body focus:outline-none focus:ring-2 focus:ring-zen-sage/30"
                            />
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label
                                for="edit-purpose-{item.id}"
                                class="text-zen-herb text-xs font-bold uppercase tracking-wider"
                                >Purpose</label
                            >
                                {#if isAddingPurpose}
                                    <div class="space-y-2">
                                        <input
                                            type="text"
                                            bind:value={newPurposeName}
                                            placeholder="Name..."
                                            class="w-full bg-zen-oat/50 border border-zen-herb/20 rounded-lg px-3 py-1 text-sm text-zen-sage"
                                        />
                                        <select
                                            bind:value={newPurposeType}
                                            class="w-full bg-zen-oat/50 border border-zen-herb/20 rounded-lg px-3 py-1 text-xs text-zen-sage"
                                        >
                                            {#each $categories as cat}
                                                <option value={cat.id}>{cat.emoji} {cat.name}</option>
                                            {/each}
                                        </select>
                                        <div class="flex gap-1">
                                            <button
                                                onclick={() =>
                                                    (isAddingPurpose = false)}
                                                class="flex-1 text-[10px] py-1 border border-zen-herb/20 rounded"
                                                >Cancel</button
                                            >
                                            <button
                                                onclick={addNewPurpose}
                                                class="flex-1 text-[10px] py-1 bg-zen-sage text-white rounded"
                                                >Add</button
                                            >
                                        </div>
                                    </div>
                                {:else}
                                    <select
                                        id="edit-purpose-{item.id}"
                                        value={editPurposeId}
                                        onchange={handlePurposeChange}
                                        class="w-full bg-zen-oat/50 border border-zen-herb/20 rounded-lg px-3 py-2 text-zen-sage font-body focus:outline-none focus:ring-2 focus:ring-zen-sage/30"
                                    >
                                        {#each $purposes as p}
                                            <option value={p.id}>{p.name}</option>
                                        {/each}
                                        <option value="new">+ Add New...</option>
                                    </select>
                                {/if}
                        </div>
                        <div class="space-y-1">
                            <label
                                for="edit-party-{item.id}"
                                class="text-zen-herb text-xs font-bold uppercase tracking-wider"
                                >Party</label
                            >
                            <select
                                id="edit-party-{item.id}"
                                bind:value={editPartyId}
                                class="w-full bg-zen-oat/50 border border-zen-herb/20 rounded-lg px-3 py-2 text-zen-sage font-body focus:outline-none focus:ring-2 focus:ring-zen-sage/30"
                            >
                                <option value="">None</option>
                                {#each $parties as p}
                                    <option value={p.id}>{p.name}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                </div>

                <div class="mt-6 flex space-x-3">
                    <button
                        onclick={(e) => {
                            e.stopPropagation();
                            isEditing = false;
                        }}
                        class="flex-1 h-10 border border-zen-herb/20 text-zen-herb font-body font-bold rounded-full transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onclick={(e) => {
                            e.stopPropagation();
                            saveEdit();
                        }}
                        class="flex-1 h-10 bg-zen-sage text-white font-body font-bold rounded-full transition-all active:scale-95 shadow-zen-soft"
                    >
                        Save
                    </button>
                </div>
            {:else}
                <div class="pt-4 grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <span
                            class="text-zen-herb text-xs font-bold uppercase tracking-wider"
                            >Type</span
                        >
                        <p class="text-zen-sage font-body font-semibold capitalize">
                            {currentPurpose?.accountType}
                        </p>
                    </div>
                    <div class="space-y-1">
                        <span
                            class="text-zen-herb text-xs font-bold uppercase tracking-wider"
                            >Purpose</span
                        >
                        <p class="text-zen-sage font-body font-semibold">
                            {currentPurpose?.name}
                        </p>
                    </div>
                </div>

                <!-- Audit Timestamps -->
                <div class="pt-4 mt-4 border-t border-zen-herb/5 grid grid-cols-2 gap-4">
                    <div class="space-y-0.5">
                        <span class="text-[8px] uppercase font-bold text-zen-herb opacity-40 tracking-widest">Created</span>
                        <p class="text-[9px] text-zen-sage opacity-60 font-medium">
                            {new Date(item.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <div class="space-y-0.5">
                        <span class="text-[8px] uppercase font-bold text-zen-herb opacity-40 tracking-widest">Modified</span>
                        <p class="text-[9px] text-zen-sage opacity-60 font-medium">
                            {new Date(item.updatedAt).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div class="mt-6 space-y-2">
                    {#if (currentPurpose?.accountType === 'receivable' || currentPurpose?.accountType === 'payable') && item.status !== 'completed'}
                        <button
                            onclick={(e) => {
                                e.stopPropagation();
                                settleTransaction(item.id);
                                isExpanded = false;
                            }}
                            class="w-full h-10 bg-emerald-500/10 text-emerald-600 font-body font-bold rounded-full transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span>↩</span> Settle / Recover
                        </button>
                    {/if}
                    {#if isProspect && item.status !== 'completed'}
                        <button
                            onclick={(e) => {
                                e.stopPropagation();
                                // Logic to promote prospect would go here, 
                                // for now we just change category and status
                                updateTransaction(item.id, { 
                                    status: 'completed',
                                    // In a real flow, this might open the editor to pick a real category
                                });
                                isExpanded = false;
                            }}
                            class="w-full h-10 bg-zen-sage text-white font-body font-bold rounded-full transition-all active:scale-95 flex items-center justify-center gap-2 shadow-zen-soft"
                        >
                            <span>🚀</span> Confirm & Promote
                        </button>
                    {/if}
                    {#if item.reverseOf}
                        <p class="text-[9px] text-center text-zen-herb opacity-50 italic">Settlement entry for #{item.reverseOf}</p>
                    {/if}
                    <div class="flex space-x-3">
                        <button
                            onclick={(e) => {
                                e.stopPropagation();
                                startEdit();
                            }}
                            class="flex-1 h-10 bg-zen-almond/20 text-zen-sage font-body font-bold rounded-full transition-all active:scale-95"
                        >
                            Edit
                        </button>
                        <button
                            onclick={(e) => {
                                e.stopPropagation();
                                deleteTransaction(item.id);
                            }}
                            class="flex-1 h-10 bg-zen-spend/10 text-zen-spend font-body font-bold rounded-full transition-all active:scale-95"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>
