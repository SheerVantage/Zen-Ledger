<script lang="ts">
    import { purposes } from "$lib/stores/purposes";
    import { parties } from "$lib/stores/parties";
    import { funds } from "$lib/stores/funds";
    import SelectionMenu from "$lib/components/SelectionMenu.svelte";
    import AutocompleteMenu from "$lib/components/AutocompleteMenu.svelte";
    import { fade, scale, slide } from "svelte/transition";
    import { tick } from "svelte";
    import Icon from "$lib/components/Icon.svelte";
    import type { TransactionSubmitOverrides } from "$lib/utils/submitTransaction";

    let {
        onInput = (
            text: string,
            overrides?: TransactionSubmitOverrides
        ) => {},
        onExtrasChange = (_open: boolean) => {},
        mode = "standalone",
        restoreText = "",
        restoreNonce = 0,
        autoFocusOnMount = false,
    } = $props();

    let inputValue = $state("");
    let isRecording = $state(false);
    let isProcessing = $state(false);
    let inputRef: HTMLInputElement | undefined;
    let showSelectionMenu = $state(false);
    let selectionText = $state("");
    let selectionCoords = $state({});

    // Pre-tagged entity IDs from word selection
    let preTaggedPartyId = $state("");
    let preTaggedPurposeId = $state("");

    // Autocomplete State
    let showAutocomplete = $state(false);
    let autocompleteTrigger = $state(""); // '@' or '#'
    let autocompleteSearch = $state("");
    let autocompleteCoords = $state({ x: 0, y: 0 });
    
    // Account & Extra Fields State
    let showExtras = $state(false);
    let selectedFund = $state("cash");
    let selectedToFund = $state("bank");
    let parsedCategoryType = $state<string | null>(null);
    let isPassthrough = $state(false);
    let confidence = $state<'high' | 'medium' | 'low'>('medium');
    let expectedDate = $state(new Date().toISOString().split('T')[0]);
    let prospectType = $state('pipeline');
    let isTransfer = $derived(parsedCategoryType === 'transfer');
    let isProspect = $derived(parsedCategoryType === 'prospect');

    $effect(() => {
        onExtrasChange(showExtras);
    });

    function focusCaptureInput(node?: HTMLInputElement | null) {
        const el = node ?? inputRef;
        if (!el) return;
        el.focus({ preventScroll: true });
        const len = el.value.length;
        el.setSelectionRange(len, len);
    }

    function mountCaptureInput(node: HTMLInputElement) {
        inputRef = node;
        if (autoFocusOnMount) {
            queueMicrotask(() => focusCaptureInput(node));
            requestAnimationFrame(() => focusCaptureInput(node));
        }
        return {
            destroy() {
                if (inputRef === node) inputRef = undefined;
            },
        };
    }

    $effect(() => {
        restoreNonce;
        if (!restoreText) return;
        inputValue = restoreText;
        showExtras = false;
        preTaggedPartyId = "";
        preTaggedPurposeId = "";
        void tick().then(() => focusCaptureInput());
    });
    
    const accountOptions = $derived($funds.map(f => ({ id: f.id, label: `${f.emoji} ${f.name}` })));

    const autocompleteOptions = $derived.by(() => {
        if (!showAutocomplete) return [];
        const search = autocompleteSearch.toLowerCase();
        if (autocompleteTrigger === "@") {
            return $parties
                .filter((p) => p.name.toLowerCase().includes(search))
                .map((p) => ({ id: p.id, name: p.name, emoji: p.emoji }));
        } else if (autocompleteTrigger === "#") {
            return $purposes
                .filter((p) => p.name.toLowerCase().includes(search))
                .map((p) => ({ id: p.id, name: p.name, emoji: p.emoji }));
        }
        return [];
    });

    function handleInputEvent(e: Event) {
        const target = e.target as HTMLInputElement;
        const value = target.value;
        const cursor = target.selectionStart || 0;

        // Find the word being typed
        const beforeCursor = value.substring(0, cursor);
        const lastWordMatch = beforeCursor.match(/[@#][^\s]*$/);

        if (lastWordMatch) {
            const match = lastWordMatch[0];
            autocompleteTrigger = match[0];
            autocompleteSearch = match.substring(1);

            const rect = target.getBoundingClientRect();
            // Estimate cursor position (imperfect but better than nothing)
            const charWidth = 10;
            autocompleteCoords = {
                x: rect.left + match.length * charWidth,
                y: rect.top - 10,
            };
            showAutocomplete = true;
        } else {
            showAutocomplete = false;
        }
    }

    function selectOption(option: { id: string; name: string; emoji: string }) {
        if (!inputRef) return;
        const cursor = inputRef.selectionStart || 0;
        const beforeCursor = inputValue.substring(0, cursor);
        const afterCursor = inputValue.substring(cursor);

        const lastTriggerIndex = beforeCursor.lastIndexOf(autocompleteTrigger);
        const newVal =
            beforeCursor.substring(0, lastTriggerIndex) +
            option.name +
            " " +
            afterCursor;

        inputValue = newVal;

        if (autocompleteTrigger === "@") {
            preTaggedPartyId = option.id;
        } else {
            preTaggedPurposeId = option.id;
        }

        showAutocomplete = false;
        focusCaptureInput();
    }

    function handleMouseUp(e: MouseEvent) {
        if (!inputRef) return;
        const start = inputRef.selectionStart;
        const end = inputRef.selectionEnd;

        if (start !== null && end !== null && start !== end) {
            const text = inputValue.substring(start, end).trim();
            if (text.length > 0) {
                const rect = inputRef.getBoundingClientRect();
                selectionText = text;
                selectionCoords = {
                    x: rect.left + window.scrollX + rect.width / 2,
                    y: rect.top + window.scrollY - 10,
                };
                showSelectionMenu = true;
                return;
            }
        }
        showSelectionMenu = false;
    }

    function tagAsPurpose() {
        const existing = $purposes.find(
            (p) => p.name.toLowerCase() === selectionText.toLowerCase(),
        );
        if (!existing) {
            const similar = purposes.findSimilar(selectionText, $purposes);
            if (similar.length > 0) {
                const names = similar.map((p) => p.name).join(", ");
                if (
                    !confirm(
                        `Similar purposes already exist: ${names}. Do you still want to add '${selectionText}'?`,
                    )
                ) {
                    return;
                }
            }
            purposes.addPurpose({
                name: selectionText,
                emoji: "🏷️",
                accountType: "expense",
            });
            // Will be set after store updates
            setTimeout(() => {
                const created = $purposes.find((p) => p.name === selectionText);
                if (created) preTaggedPurposeId = created.id;
            }, 50);
        } else {
            preTaggedPurposeId = existing.id;
        }
        showSelectionMenu = false;
    }

    function tagAsParty() {
        const existing = $parties.find(
            (p) => p.name.toLowerCase() === selectionText.toLowerCase(),
        );
        if (!existing) {
            const similar = parties.findSimilar(selectionText, $parties);
            if (similar.length > 0) {
                const names = similar.map((p) => p.name).join(", ");
                if (
                    !confirm(
                        `Similar parties already exist: ${names}. Do you still want to add '${selectionText}'?`,
                    )
                ) {
                    return;
                }
            }
            parties.addParty({ name: selectionText, emoji: "👤" });
            setTimeout(() => {
                const created = $parties.find((p) => p.name === selectionText);
                if (created) preTaggedPartyId = created.id;
            }, 50);
        } else {
            preTaggedPartyId = existing.id;
        }
        showSelectionMenu = false;
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && inputValue.trim()) {
            submitInput();
        }
    }

    async function submitInput() {
        const text = inputValue.trim();
        if (!text) return;

        // Perform pre-parsing to show extras if not already shown
        if (!showExtras) {
            const { parseTransaction } = await import("$lib/utils/transactionParser");
            const parsed = parseTransaction(text);
            parsedCategoryType = $purposes.find(p => p.id === parsed.purposeId)?.accountType || 'expense';
            selectedFund = parsed.fundId || 'cash';
            isPassthrough = parsed.isPassthrough || false;
            
            if (parsed.confidence) confidence = parsed.confidence;
            if (parsed.expectedDate) expectedDate = parsed.expectedDate;
            if (parsed.prospectType) prospectType = parsed.prospectType;

            // If it's a "direct" type, just submit. If it needs account verification, show extras.
            if (['receivable', 'payable', 'transfer', 'prospect'].includes(parsedCategoryType || '')) {
                showExtras = true;
                return; // Wait for user to confirm extras
            }
        }

        const overrides = {
            partyId: preTaggedPartyId || undefined,
            purposeId: preTaggedPurposeId || undefined,
            fundId: selectedFund,
            fromFundId: isTransfer ? selectedFund : undefined,
            toFundId: isTransfer ? selectedToFund : undefined,
            isPassthrough,
            confidence: isProspect ? confidence : undefined,
            expectedDate: isProspect ? expectedDate : undefined,
            prospectType: isProspect ? prospectType : undefined
        };

        isProcessing = true;
        inputValue = "";
        preTaggedPartyId = "";
        preTaggedPurposeId = "";
        showExtras = false;
        inputRef?.blur();

        setTimeout(() => {
            onInput(text, overrides);
            isProcessing = false;
        }, 800);
    }

    function toggleRecording() {
        isRecording = !isRecording;
        if (isRecording) {
            console.log("Recording started...");
        } else {
            isProcessing = true;
            setTimeout(() => {
                inputValue = "Coffee at Starbucks $5";
                isProcessing = false;
                submitInput();
            }, 1000);
        }
    }
</script>

<SelectionMenu
    show={showSelectionMenu}
    text={selectionText}
    coords={selectionCoords}
    onTagPurpose={tagAsPurpose}
    onTagParty={tagAsParty}
    onClose={() => (showSelectionMenu = false)}
/>

<div
    class="relative w-full mx-auto {mode === 'standalone'
        ? 'max-w-2xl px-4 pb-8 pt-4'
        : ''}"
>
    <div
        class="relative flex items-center transition-all duration-500 overflow-hidden
        {mode === 'standalone'
            ? 'bg-zen-surface/40 backdrop-blur-3xl rounded-full border border-zen-herb/10 shadow-zen-heavy'
            : 'bg-transparent rounded-lg'}
        {isProcessing
            ? mode === 'standalone'
                ? 'ring-2 ring-zen-sage/30'
                : 'ring-1 ring-zen-sage/20'
            : ''}"
    >
        <AutocompleteMenu
            show={showAutocomplete}
            options={autocompleteOptions}
            coords={autocompleteCoords}
            onSelect={selectOption}
            onClose={() => (showAutocomplete = false)}
        />
        <!-- Input Field -->
        <!-- svelte-ignore a11y_autofocus -->
        <input
            bind:this={inputRef}
            use:mountCaptureInput
            bind:value={inputValue}
            data-capture-input
            data-testid="capture-input"
            autofocus={autoFocusOnMount}
            onkeydown={handleKeydown}
            onmouseup={handleMouseUp}
            oninput={handleInputEvent}
            type="text"
            placeholder={isRecording
                ? "Listening..."
                : "Dinner at Mario's $45..."}
            class="flex-1 h-16 bg-transparent text-zen-sage text-lg font-body font-semibold placeholder:text-zen-herb/40 focus:outline-none {mode ===
            'standalone'
                ? 'px-8'
                : 'px-4'}"
            disabled={isProcessing || isRecording}
        />

        <!-- Action Button (Mic/Send) -->
        {#if mode === "standalone"}
            <button
                data-testid="input-pill-action"
                onclick={inputValue.trim() ? submitInput : toggleRecording}
                class="h-12 w-12 mr-2 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 group"
                class:bg-zen-almond={!isRecording && !inputValue.trim()}
                class:bg-zen-sage={isRecording || inputValue.trim()}
            >
                {#if isProcessing}
                    <div class="flex space-x-1">
                        <div
                            class="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"
                        ></div>
                        <div
                            class="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"
                        ></div>
                        <div
                            class="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                        ></div>
                    </div>
                {:else if inputValue.trim()}
                    <Icon name="check" class_="h-6 w-6 text-zen-on-primary" />
                {:else}
                    <Icon
                        name={isRecording ? 'stop' : 'zap'}
                        class_="h-5 w-5 transition-colors duration-300 {isRecording
                            ? 'text-zen-on-primary'
                            : 'text-zen-sage opacity-80'}"
                    />
                {/if}
            </button>
        {/if}

        <!-- Wave Animation for Processing/Recording -->
        {#if isProcessing || isRecording}
            <div
                transition:fade
                class="absolute inset-0 pointer-events-none bg-zen-almond/10 animate-pulse"
            ></div>
        {/if}
    </div>

    {#if showExtras}
        <div 
            transition:slide
            class="mt-4 p-4 bg-zen-surface/40 backdrop-blur-xl rounded-3xl border border-zen-herb/10 shadow-zen-soft space-y-4"
        >
            <div class="flex flex-wrap items-center gap-3">
                <span class="text-[10px] uppercase font-bold text-zen-herb opacity-60 tracking-widest px-1">
                    {isTransfer ? 'From' : 'Fund'}
                </span>
                <div class="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {#each accountOptions as opt}
                        <button 
                            onclick={() => selectedFund = opt.id}
                            class="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all
                            {selectedFund === opt.id 
                                ? 'bg-zen-sage text-zen-on-primary shadow-sm' 
                                : 'bg-zen-oat/40 text-zen-herb hover:bg-zen-almond/20'}"
                        >
                            {opt.label}
                        </button>
                    {/each}
                </div>
            </div>

            {#if isTransfer}
                <div class="flex flex-wrap items-center gap-3" transition:fade>
                    <span class="text-[10px] uppercase font-bold text-zen-herb opacity-60 tracking-widest px-1">To</span>
                    <div class="flex gap-1.5">
                        {#each accountOptions as opt}
                            <button 
                                onclick={() => selectedToFund = opt.id}
                                class="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all
                                {selectedToFund === opt.id 
                                    ? 'bg-zen-sage text-zen-on-primary shadow-sm' 
                                    : 'bg-zen-oat/40 text-zen-herb hover:bg-zen-almond/20'}"
                            >
                                {opt.label}
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}

            <div class="flex items-center gap-3 pt-2">
                <span class="text-[10px] uppercase font-bold text-zen-herb opacity-60 tracking-widest px-1">Passthrough</span>
                <button 
                    onclick={() => isPassthrough = !isPassthrough}
                    aria-label="Toggle passthrough status"
                    class="h-6 w-11 rounded-full p-1 transition-colors {isPassthrough ? 'bg-zen-sage' : 'bg-zen-herb/20'}"
                >
                    <div class="h-4 w-4 rounded-full bg-white transition-transform {isPassthrough ? 'translate-x-5' : 'translate-x-0'}"></div>
                </button>
            </div>

            {#if isProspect}
                <div class="space-y-3 pt-2 border-t border-zen-herb/5" transition:fade>
                    <div class="flex flex-col gap-2">
                        <span class="text-[9px] uppercase font-bold text-zen-herb opacity-60 tracking-widest px-1">Confidence</span>
                        <div class="flex gap-1.5">
                            {#each ['low', 'medium', 'high'] as conf}
                                <button 
                                    onclick={() => confidence = conf as any}
                                    class="px-3 py-1 rounded-lg text-[9px] font-bold uppercase transition-all
                                    {confidence === conf 
                                        ? 'bg-zen-sage text-zen-on-primary' 
                                        : 'bg-zen-oat/40 text-zen-herb hover:bg-zen-almond/20'}"
                                >
                                    {conf}
                                </button>
                            {/each}
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-2">
                        <span class="text-[9px] uppercase font-bold text-zen-herb opacity-60 tracking-widest px-1">Expected Date</span>
                        <input 
                            type="date" 
                            bind:value={expectedDate}
                            class="bg-zen-oat/20 border-none rounded-xl px-3 py-1.5 text-xs text-zen-sage font-bold focus:ring-1 focus:ring-zen-sage"
                        />
                    </div>
                </div>
            {/if}

            <div class="flex justify-end gap-2 pt-4 border-t border-zen-herb/10">
                <button 
                    onclick={() => showExtras = false}
                    class="px-5 py-2 text-[10px] font-bold uppercase text-zen-herb/50 hover:text-zen-herb transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onclick={submitInput}
                    class="px-8 py-2 bg-zen-sage text-zen-on-primary text-[10px] font-bold uppercase rounded-full shadow-zen-soft hover:shadow-zen-bold active:scale-95 transition-all"
                >
                    Add Transaction
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .animate-bounce {
        animation: bounce 0.6s infinite alternate;
    }
    @keyframes bounce {
        from {
            transform: translateY(0);
        }
        to {
            transform: translateY(-4px);
        }
    }
</style>
