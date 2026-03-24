<script lang="ts">
    import { purposes } from "$lib/stores/purposes";
    import { parties } from "$lib/stores/parties";
    import SelectionMenu from "$lib/components/SelectionMenu.svelte";
    import { fade, scale } from "svelte/transition";
    import Icon from "$lib/components/Icon.svelte";

    let { 
        onInput = (text: string, overrides?: { partyId?: string; purposeId?: string }) => {},
        mode = "standalone"
    } = $props();

    let inputValue = $state("");
    let isRecording = $state(false);
    let isProcessing = $state(false);
    let inputRef: HTMLInputElement;

    // Pre-tagged entity IDs from word selection
    let preTaggedPartyId = $state("");
    let preTaggedPurposeId = $state("");

    // Selection State
    let showSelectionMenu = $state(false);
    let selectionText = $state("");
    let selectionCoords = $state({ x: 0, y: 0 });

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
                    x: rect.left + window.scrollX + (rect.width / 2),
                    y: rect.top + window.scrollY - 10
                };
                showSelectionMenu = true;
                return;
            }
        }
        showSelectionMenu = false;
    }

    function tagAsPurpose() {
        const existing = $purposes.find(p => p.name.toLowerCase() === selectionText.toLowerCase());
        if (!existing) {
            const similar = purposes.findSimilar(selectionText, $purposes);
            if (similar.length > 0) {
                const names = similar.map(p => p.name).join(", ");
                if (!confirm(`Similar purposes already exist: ${names}. Do you still want to add '${selectionText}'?`)) {
                    return;
                }
            }
            purposes.addPurpose({ name: selectionText, emoji: "🏷️", accountType: "expense" });
            // Will be set after store updates
            setTimeout(() => {
                const created = $purposes.find(p => p.name === selectionText);
                if (created) preTaggedPurposeId = created.id;
            }, 50);
        } else {
            preTaggedPurposeId = existing.id;
        }
        showSelectionMenu = false;
    }

    function tagAsParty() {
        const existing = $parties.find(p => p.name.toLowerCase() === selectionText.toLowerCase());
        if (!existing) {
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

        const overrides = {
            partyId: preTaggedPartyId || undefined,
            purposeId: preTaggedPurposeId || undefined
        };

        isProcessing = true;
        inputValue = "";
        preTaggedPartyId = "";
        preTaggedPurposeId = "";
        inputRef.blur();

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
    onClose={() => showSelectionMenu = false} 
/>

<div class="relative w-full mx-auto {mode === 'standalone' ? 'max-w-2xl px-4 pb-8 pt-4' : ''}">
    <div
        class="relative flex items-center transition-all duration-500 overflow-hidden 
        {mode === 'standalone' ? 'bg-zen-surface/40 backdrop-blur-3xl rounded-full border border-zen-herb/10 shadow-zen-heavy' : 'bg-transparent rounded-lg'}
        {isProcessing ? (mode === 'standalone' ? 'ring-2 ring-zen-sage/30' : 'ring-1 ring-zen-sage/20') : ''}"
    >
        <!-- Input Field -->
        <input
            bind:this={inputRef}
            bind:value={inputValue}
            onkeydown={handleKeydown}
            onmouseup={handleMouseUp}
            type="text"
            placeholder={isRecording
                ? "Listening..."
                : "Dinner at Mario's $45..."}
            class="flex-1 h-16 bg-transparent text-zen-sage text-lg font-body font-semibold placeholder:text-zen-herb/40 focus:outline-none {mode === 'standalone' ? 'px-8' : 'px-4'}"
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
                    <Icon name="check" class_="h-6 w-6 text-white" />
                {:else}
                    <Icon name="mic" class_="h-6 w-6 transition-colors duration-300 {isRecording ? 'text-white' : 'text-zen-sage'}" />
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
