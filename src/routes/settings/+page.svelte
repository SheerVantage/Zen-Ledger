<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import { get } from "svelte/store";
    import { purposes } from "$lib/stores/purposes";
    import { parties } from "$lib/stores/parties";
    import { transactions } from "$lib/stores/transactions";
    import { settings } from "$lib/stores/settings";
    import { recurring, type Schedule } from "$lib/stores/recurring";
    import { categories, type Category } from "$lib/stores/categories";

    const settingsItems = [
        {
            title: "Purposes",
            description: "Manage categories and account types",
            icon: "🏷️",
            href: "/purposes",
            color: "bg-zen-earn/10 text-zen-sage"
        },
        {
            title: "Parties",
            description: "Manage contacts and entities",
            icon: "👥",
            href: "/parties",
            color: "bg-zen-almond/20 text-zen-sage"
        }
    ];

    // Category editing state
    let editingCategoryId = $state("");
    let editCatName = $state("");
    let editCatEmoji = $state("");

    function startEditCategory(cat: Category) {
        editingCategoryId = cat.id;
        editCatName = cat.name;
        editCatEmoji = cat.emoji;
    }

    function saveCategoryEdit() {
        categories.updateCategory(editingCategoryId as any, { name: editCatName, emoji: editCatEmoji });
        editingCategoryId = "";
    }

    let editName = $state($settings.profile.name);
    let editBudget = $state($settings.profile.dailyBudget);

    // Recurring Template Form State
    let newRTTitle = $state("");
    let newRTPurposeId = $state("");
    let newRTPartyId = $state("");
    let newRTAmount = $state("");
    let newRTIsVariable = $state(false);
    let newRTSchedule = $state<Schedule>("monthly");

    function addRecurringTemplate() {
        if (!newRTTitle || !newRTPurposeId) return;
        recurring.addTemplate({
            title: newRTTitle,
            purposeId: newRTPurposeId,
            partyId: newRTPartyId,
            amount: newRTAmount ? Number(newRTAmount) : undefined,
            isVariable: newRTIsVariable,
            schedule: newRTSchedule
        });
        newRTTitle = "";
        newRTPurposeId = "";
        newRTPartyId = "";
        newRTAmount = "";
        newRTIsVariable = false;
        newRTSchedule = "monthly";
    }

    function saveProfile() {
        settings.updateProfile({ 
            name: editName, 
            dailyBudget: Number(editBudget) 
        });
        alert("Profile updated!");
    }

    function recalculateTotals() {
        settings.recalculate(get(transactions), get(purposes));
        alert("Financial summaries recalculated!");
    }

    function exportData() {
        const data = {
            purposes: get(purposes),
            parties: get(parties),
            transactions: get(transactions),
            settings: get(settings),
            recurring: get(recurring),
            categories: get(categories),
            exportDate: new Date().toISOString(),
            version: "1.4.0"
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `zen-ledger-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    let fileInput: HTMLInputElement;

    function handleImport(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                
                if (!data.purposes || !data.parties || !data.transactions) {
                    alert("Invalid backup file. Missing required data.");
                    return;
                }

                if (confirm("Are you sure you want to import this data? This will overwrite all your current data.")) {
                    purposes.importData(data.purposes);
                    parties.importData(data.parties);
                    transactions.importData(data.transactions);
                    if (data.recurring) recurring.importData(data.recurring);
                    if (data.categories) categories.importData(data.categories);
                    if (data.settings) {
                        settings.updateProfile(data.settings.profile);
                    }
                    settings.recalculate(get(transactions), get(purposes));
                    alert("Data imported successfully!");
                }
            } catch (err) {
                alert("Error parsing backup file.");
                console.error(err);
            }
        };
        reader.readAsText(file);
    }
    function resetApplication() {
        if (confirm("Are you sure you want to reset everything? This will permanently delete all transactions, purposes, and parties.")) {
            localStorage.clear();
            window.location.reload();
        }
    }
</script>

<svelte:head>
    <title>Settings | Zen Ledger</title>
</svelte:head>

<div class="min-h-screen bg-zen-oat/30 pb-24 pt-8">
    <main class="px-8 space-y-6">
        <!-- Main Settings -->
        <div class="space-y-4">
            {#each settingsItems as item, i}
                <div in:fly={{ y: 20, delay: 100 * i, duration: 500 }}>
                    <a 
                        href={item.href}
                        class="flex items-center gap-4 p-4 bg-zen-panel rounded-2xl shadow-sm border border-zen-herb/5 hover:shadow-zen-soft hover:scale-[1.01] transition-all group"
                    >
                        <div class="h-12 w-12 flex-shrink-0 rounded-xl {item.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            {item.icon}
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="text-zen-sage font-heading font-bold text-lg">{item.title}</h3>
                            <p class="text-zen-herb opacity-60 text-xs truncate">{item.description}</p>
                        </div>
                        <span class="text-zen-herb opacity-30 group-hover:translate-x-1 transition-transform">→</span>
                    </a>
                </div>
            {/each}
        </div>

        <!-- Profile Settings -->
        <div class="space-y-4 pt-4" in:fly={{ y: 20, delay: 200, duration: 500 }}>
            <h4 class="text-zen-herb text-[10px] uppercase font-bold tracking-widest px-2 opacity-50">Profile Settings</h4>
            <div class="bg-zen-panel rounded-2xl p-4 shadow-sm border border-zen-herb/5 space-y-4">
                <div class="space-y-1">
                    <label for="profile-name" class="text-[9px] font-bold uppercase text-zen-herb/60 tracking-widest px-1">Display Name</label>
                    <input 
                        id="profile-name"
                        type="text" 
                        bind:value={editName}
                        class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-xl px-4 py-2 text-sm text-zen-sage focus:outline-none focus:ring-2 focus:ring-zen-sage/20 transition-all font-body font-semibold"
                    />
                </div>
                <div class="space-y-1">
                    <label for="profile-budget" class="text-[9px] font-bold uppercase text-zen-herb/60 tracking-widest px-1">Daily Budget ({$settings.profile.currency})</label>
                    <input 
                        id="profile-budget"
                        type="number" 
                        bind:value={editBudget}
                        class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-xl px-4 py-2 text-sm text-zen-sage focus:outline-none focus:ring-2 focus:ring-zen-sage/20 transition-all font-body font-semibold"
                    />
                </div>
                <button 
                    onclick={saveProfile}
                    class="w-full py-2 bg-zen-sage text-zen-on-primary rounded-xl text-xs font-bold shadow-zen-soft hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    Save Changes
                </button>
            </div>
        </div>

        <!-- Wealth Summary -->
        <div class="space-y-4 pt-4" in:fly={{ y: 20, delay: 250, duration: 500 }}>
            <h4 class="text-zen-herb text-[10px] uppercase font-bold tracking-widest px-2 opacity-50">Wealth Audit</h4>
            <div class="bg-zen-panel rounded-2xl p-4 shadow-sm border border-zen-herb/5 space-y-4">
                <div class="flex items-center justify-between px-1">
                    <div class="flex flex-col">
                        <span class="text-[10px] uppercase font-bold text-zen-herb/60">Last Audit</span>
                        <span class="text-[10px] font-medium text-zen-sage">{new Date($settings.lastRecalculated).toLocaleString()}</span>
                    </div>
                </div>
                <button 
                    onclick={recalculateTotals}
                    class="w-full flex items-center justify-center gap-2 py-3 bg-zen-almond/20 text-zen-sage border border-zen-sage/10 rounded-xl text-xs font-bold hover:bg-zen-almond/30 transition-all"
                >
                    <span>🔄</span>
                    Recalculate All Summaries
                </button>
                <p class="text-[10px] text-zen-herb/40 italic px-1 text-center leading-relaxed">
                    Recalculates global and party-wise balances from your entire transaction history.
                </p>
            </div>
        </div>

        <!-- Categories Management -->
        <div class="space-y-4 pt-4" in:fly={{ y: 20, delay: 260, duration: 500 }}>
            <h4 class="text-zen-herb text-[10px] uppercase font-bold tracking-widest px-2 opacity-50">Account Categories</h4>
            <div class="bg-zen-panel rounded-2xl p-4 shadow-sm border border-zen-herb/5 space-y-2">
                {#each $categories as cat}
                    <div class="flex items-center justify-between p-2 rounded-xl hover:bg-zen-oat/20 transition-all group">
                        {#if editingCategoryId === cat.id}
                            <div class="flex gap-2 flex-1">
                                <input bind:value={editCatEmoji} class="w-10 text-center bg-zen-oat/30 border border-zen-herb/10 rounded-lg p-1 text-lg" />
                                <input bind:value={editCatName} class="flex-1 bg-zen-oat/30 border border-zen-herb/10 rounded-lg px-3 py-1 text-sm text-zen-sage" />
                                <button onclick={saveCategoryEdit} class="px-3 bg-zen-sage text-zen-on-primary text-[10px] font-bold rounded-lg">Save</button>
                                <button onclick={() => editingCategoryId = ""} class="px-3 border border-zen-herb/20 text-zen-herb text-[10px] font-bold rounded-lg">✕</button>
                            </div>
                        {:else}
                            <div class="flex items-center gap-3">
                                <span class="text-xl">{cat.emoji}</span>
                                <div>
                                    <p class="text-sm font-bold text-zen-sage">{cat.name}</p>
                                    <p class="text-[9px] text-zen-herb/50 uppercase tracking-wider">{cat.direction}</p>
                                </div>
                            </div>
                            <button 
                                onclick={() => startEditCategory(cat)} 
                                class="text-[10px] text-zen-herb opacity-0 group-hover:opacity-60 hover:opacity-100 transition-all px-2 py-1 rounded-lg hover:bg-zen-oat/30"
                            >
                                Edit
                            </button>
                        {/if}
                    </div>
                {/each}
                <button onclick={categories.resetDefaults} class="w-full mt-2 text-[9px] uppercase font-bold text-zen-herb/40 hover:text-zen-herb/70 transition-colors tracking-widest py-1">
                    Reset to Defaults
                </button>
            </div>
        </div>

        <!-- Recurring Transactions Management -->
        <div class="space-y-4 pt-4" in:fly={{ y: 20, delay: 280, duration: 500 }}>
            <h4 class="text-zen-herb text-[10px] uppercase font-bold tracking-widest px-2 opacity-50">Recurring Transactions</h4>
            
            <div class="bg-zen-panel rounded-2xl p-6 shadow-sm border border-zen-herb/5 space-y-6">
                <!-- Add New Template Form -->
                <div class="space-y-4">
                    <h5 class="text-[10px] font-bold uppercase text-zen-sage tracking-[0.2em] border-b border-zen-herb/5 pb-2">Add New Template</h5>
                    
                    <div class="grid grid-cols-1 gap-4">
                        <div class="space-y-1">
                            <label for="rt-title" class="text-[9px] font-bold uppercase text-zen-herb/60 tracking-widest px-1">Template Title</label>
                            <input id="rt-title" type="text" bind:value={newRTTitle} placeholder="e.g. House Rent" class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-xl px-4 py-2 text-sm text-zen-sage" />
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <label for="rt-purpose" class="text-[9px] font-bold uppercase text-zen-herb/60 tracking-widest px-1">Purpose</label>
                                <select id="rt-purpose" bind:value={newRTPurposeId} class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-xl px-4 py-2 text-sm text-zen-sage">
                                    <option value="">Select Purpose</option>
                                    {#each $purposes as p}
                                        <option value={p.id}>{p.emoji} {p.name}</option>
                                    {/each}
                                </select>
                            </div>
                            <div class="space-y-1">
                                <label for="rt-party" class="text-[9px] font-bold uppercase text-zen-herb/60 tracking-widest px-1">Party (Optional)</label>
                                <select id="rt-party" bind:value={newRTPartyId} class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-xl px-4 py-2 text-sm text-zen-sage">
                                    <option value="">Self / Unknown</option>
                                    {#each $parties as p}
                                        <option value={p.id}>{p.emoji} {p.name}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <label for="rt-amount" class="text-[9px] font-bold uppercase text-zen-herb/60 tracking-widest px-1">Default Amount</label>
                                <input id="rt-amount" type="number" bind:value={newRTAmount} placeholder="0.00" class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-xl px-4 py-2 text-sm text-zen-sage" />
                            </div>
                            <div class="space-y-1">
                                <label for="rt-schedule" class="text-[9px] font-bold uppercase text-zen-herb/60 tracking-widest px-1">Schedule</label>
                                <select id="rt-schedule" bind:value={newRTSchedule} class="w-full bg-zen-oat/30 border border-zen-herb/10 rounded-xl px-4 py-2 text-sm text-zen-sage">
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="occasional">Occasional</option>
                                </select>
                            </div>
                        </div>

                        <div class="flex items-center gap-3 px-1 pt-1">
                            <input id="rt-is-variable" type="checkbox" bind:checked={newRTIsVariable} class="w-4 h-4 rounded border-zen-herb/20 text-zen-sage focus:ring-zen-sage/20" />
                            <label for="rt-is-variable" class="text-xs font-bold text-zen-sage">Variable Amount (Allow edit on log)</label>
                        </div>

                        <button 
                            onclick={addRecurringTemplate}
                            disabled={!newRTTitle || !newRTPurposeId}
                            class="w-full py-3 bg-zen-sage text-zen-on-primary rounded-xl text-xs font-bold shadow-zen-soft hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            Add Template
                        </button>
                    </div>
                </div>

                <!-- Existing Templates List -->
                <div class="space-y-4 pt-4 border-t border-zen-herb/5">
                    <h5 class="text-[10px] font-bold uppercase text-zen-sage tracking-[0.2em]">Manage Templates</h5>
                    
                    <div class="space-y-3">
                        {#each $recurring as rt (rt.id)}
                            <div class="flex items-center justify-between p-3 bg-zen-oat/20 rounded-xl border border-zen-herb/5 group">
                                <div class="flex items-center gap-3">
                                    <div class="h-8 w-8 rounded-lg bg-zen-almond/30 flex items-center justify-center text-lg">
                                        {$purposes.find(p => p.id === rt.purposeId)?.emoji || '📝'}
                                    </div>
                                    <div>
                                        <p class="text-sm font-bold text-zen-sage">{rt.title}</p>
                                        <p class="text-[9px] text-zen-herb uppercase font-bold tracking-wider opacity-60">
                                            {rt.schedule} • {rt.isVariable ? 'Variable' : `$${rt.amount || 0}`}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onclick={() => recurring.deleteTemplate(rt.id)}
                                    class="p-2 text-zen-herb opacity-0 group-hover:opacity-60 hover:opacity-100 hover:text-zen-spend transition-all"
                                    aria-label="Delete template"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        {:else}
                            <p class="text-[10px] text-zen-herb/40 italic text-center py-4">No recurring templates setup yet.</p>
                        {/each}
                    </div>
                </div>
            </div>
        </div>

        <!-- Data Management -->
        <div class="space-y-4 pt-4" in:fly={{ y: 20, delay: 300, duration: 500 }}>
            <h4 class="text-zen-herb text-[10px] uppercase font-bold tracking-widest px-2 opacity-50">Data Management</h4>
            
            <button 
                onclick={exportData}
                class="w-full flex items-center gap-4 p-4 bg-zen-panel rounded-2xl shadow-sm border border-zen-herb/5 hover:shadow-zen-soft hover:scale-[1.01] transition-all group text-left"
            >
                <div class="h-12 w-12 flex-shrink-0 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📤
                </div>
                <div class="flex-1">
                    <h3 class="text-zen-sage font-heading font-bold text-lg">Export Data</h3>
                    <p class="text-zen-herb opacity-60 text-xs text-pretty">Save your transactions, purposes, and parties to a JSON file</p>
                </div>
            </button>

            <button 
                onclick={() => fileInput.click()}
                class="w-full flex items-center gap-4 p-4 bg-zen-panel rounded-2xl shadow-sm border border-zen-herb/5 hover:shadow-zen-soft hover:scale-[1.01] transition-all group text-left"
            >
                <div class="h-12 w-12 flex-shrink-0 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📥
                </div>
                <div class="flex-1">
                    <h3 class="text-zen-sage font-heading font-bold text-lg">Import Data</h3>
                    <p class="text-zen-herb opacity-60 text-xs text-pretty">Restore your data from a previously exported JSON backup</p>
                </div>
            </button>
            
            <button 
                onclick={resetApplication}
                class="w-full flex items-center gap-4 p-4 bg-zen-panel rounded-2xl shadow-sm border border-zen-spend/5 hover:bg-zen-spend/5 hover:scale-[1.01] transition-all group text-left"
            >
                <div class="h-12 w-12 flex-shrink-0 rounded-xl bg-zen-spend/10 text-zen-spend flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🗑️
                </div>
                <div class="flex-1">
                    <h3 class="text-zen-spend font-heading font-bold text-lg">Reset Application</h3>
                    <p class="text-zen-herb opacity-60 text-xs text-pretty">Permanently delete ALL local data (irreversible)</p>
                </div>
            </button>

            <input 
                type="file" 
                accept=".json" 
                class="hidden" 
                bind:this={fileInput} 
                onchange={handleImport}
            />
        </div>

        <!-- App Info -->
        <div class="pt-8 border-t border-zen-herb/10 mt-8" in:fade={{ delay: 500 }}>
            <h4 class="text-zen-herb text-[10px] uppercase font-bold tracking-widest mb-4 px-2 opacity-50">App Information</h4>
            <div class="bg-zen-panel/50 rounded-2xl p-4 border border-zen-herb/5 text-xs text-zen-herb space-y-2">
                <div class="flex justify-between">
                    <span>Version</span>
                    <span class="font-bold">2.1.0</span>
                </div>
                <div class="flex justify-between">
                    <span>Build</span>
                    <span class="font-bold">Gemini-Ag-2026</span>
                </div>
            </div>
        </div>
    </main>
</div>
