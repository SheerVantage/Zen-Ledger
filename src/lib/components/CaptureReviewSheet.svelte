<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { get } from 'svelte/store';
    import { purposes, type AccountType } from '$lib/stores/purposes';
    import { parties } from '$lib/stores/parties';
    import { funds } from '$lib/stores/funds';
    import { ACCOUNT_TYPES } from '$lib/account-types';
    import type { ParsedTransactionDraft } from '$lib/utils/transactionParser';
    import type { ParseAssessment, ReviewField } from '$lib/utils/parseConfidence';
    import type { TransactionSubmitOverrides } from '$lib/utils/submitTransaction';

    let {
        isOpen = false,
        draft,
        assessment,
        onConfirm = (_values: TransactionSubmitOverrides) => {},
        onCancel = () => {},
    }: {
        isOpen?: boolean;
        draft: ParsedTransactionDraft;
        assessment: ParseAssessment;
        onConfirm?: (values: TransactionSubmitOverrides) => void;
        onCancel?: () => void;
    } = $props();

    let amount = $state(0);
    let date = $state('');
    let purposeId = $state('');
    let partyId = $state('');
    let fundId = $state('cash');
    let fromFundId = $state('cash');
    let toFundId = $state('bank');
    let status = $state<'completed' | 'pending' | 'partial'>('completed');
    let amountError = $state('');
    let sheetEl = $state<HTMLElement | null>(null);

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            onCancel();
            return;
        }
        if (e.key !== 'Tab' || !sheetEl) return;
        const focusable = sheetEl.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    let isAddingPurpose = $state(false);
    let isAddingParty = $state(false);
    let newPurposeName = $state('');
    let newPurposeType = $state<AccountType>('expense');
    let newPartyName = $state('');

    $effect(() => {
        if (!isOpen) return;
        amount = draft.amount;
        date = draft.date;
        purposeId = draft.purposeId;
        partyId = draft.partyId || '';
        fundId = draft.fundId || 'cash';
        fromFundId = draft.fromFundId || 'cash';
        toFundId = draft.toFundId || 'bank';
        status = draft.status || 'completed';
        amountError = '';
        isAddingPurpose = false;
        isAddingParty = false;
        newPurposeName = draft.parseMeta.hashMention || '';
        newPartyName = draft.parseMeta.atMention || '';
        newPurposeType = 'expense';
    });

    const selectedPurpose = $derived($purposes.find((p) => p.id === purposeId));
    const showStatus = $derived(
        selectedPurpose &&
            ['receivable', 'payable', 'prospect', 'transfer'].includes(selectedPurpose.accountType),
    );

    function fieldClass(field: ReviewField): string {
        return assessment.flaggedFields.includes(field)
            ? 'review-field review-field--flagged'
            : 'review-field';
    }

    function handlePurposeChange(e: Event) {
        const value = (e.target as HTMLSelectElement).value;
        if (value === 'new') {
            isAddingPurpose = true;
            return;
        }
        purposeId = value;
    }

    function handlePartyChange(e: Event) {
        const value = (e.target as HTMLSelectElement).value;
        if (value === 'new') {
            isAddingParty = true;
            return;
        }
        partyId = value;
    }

    function addPurposeInline() {
        const name = newPurposeName.trim();
        if (!name) return;
        purposes.addPurpose({
            name,
            emoji: '🏷️',
            accountType: newPurposeType,
            aliases: [name.toLowerCase()],
        });
        const created = get(purposes).find((p) => p.name === name);
        if (created) purposeId = created.id;
        isAddingPurpose = false;
    }

    function addPartyInline() {
        const name = newPartyName.trim();
        if (!name) return;
        parties.addParty({
            name,
            emoji: '👤',
            aliases: [name.toLowerCase()],
        });
        const created = get(parties).find((p) => p.name === name);
        if (created) partyId = created.id;
        isAddingParty = false;
    }

    function handleSave() {
        if (amount === 0 || Number.isNaN(amount)) {
            amountError = 'Enter a valid amount';
            return;
        }

        onConfirm({
            narration: draft.narration,
            amount,
            date,
            purposeId,
            partyId: partyId || undefined,
            fundId,
            fromFundId,
            toFundId,
            status,
            isPassthrough: draft.isPassthrough,
            confidence: draft.confidence,
            expectedDate: draft.expectedDate,
            prospectType: draft.prospectType as TransactionSubmitOverrides['prospectType'],
            showToast: true,
        });
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 bg-zen-oat/50 z-[100]"
        transition:fade={{ duration: 200 }}
        onclick={onCancel}
        onkeydown={(e) => e.key === 'Escape' && onCancel()}
        aria-hidden="true"
    ></div>

    <div
        bind:this={sheetEl}
        role="dialog"
        tabindex="-1"
        aria-modal="true"
        aria-labelledby="capture-review-title"
        class="fixed bottom-0 left-0 right-0 bg-zen-panel border-t border-zen-hairline rounded-t-[2.5rem] shadow-zen-heavy z-[101] p-6 pb-sheet max-w-lg mx-auto max-h-[85dvh] overflow-y-auto"
        transition:fly={{ y: 420, duration: 320, easing: cubicOut }}
        onkeydown={handleKeydown}
    >
        <div class="w-12 h-1.5 bg-zen-herb/40 rounded-full mx-auto mb-5"></div>

        <p class="zen-micro-label mb-2">Review before saving</p>
        <p id="capture-review-title" class="text-zen-sage font-heading font-bold text-lg leading-snug mb-1">
            "{draft.narration}"
        </p>

        {#if assessment.reasons.length > 0}
            <ul class="mb-5 space-y-1">
                {#each assessment.reasons as reason}
                    <li class="text-xs text-zen-spend font-semibold">• {reason.message}</li>
                {/each}
            </ul>
        {/if}

        <div class="space-y-4">
            <div class={fieldClass('amount')}>
                <label for="review-amount" class="zen-field-label">Amount</label>
                <input
                    id="review-amount"
                    type="number"
                    step="0.01"
                    bind:value={amount}
                    class="review-input"
                />
                {#if amountError}
                    <p class="text-xs text-zen-spend mt-1">{amountError}</p>
                {/if}
            </div>

            <div class={fieldClass('date')}>
                <label for="review-date" class="zen-field-label">Date</label>
                <input id="review-date" type="date" bind:value={date} class="review-input" />
            </div>

            <div class={fieldClass('purpose')}>
                <label for="review-purpose" class="zen-field-label">Purpose</label>
                {#if isAddingPurpose}
                    <div class="space-y-2">
                        <input
                            type="text"
                            bind:value={newPurposeName}
                            placeholder="Purpose name"
                            class="review-input"
                        />
                        <select bind:value={newPurposeType} class="review-input">
                            {#each ACCOUNT_TYPES as type}
                                <option value={type.id}>{type.emoji} {type.name}</option>
                            {/each}
                        </select>
                        <div class="flex gap-2">
                            <button type="button" class="review-secondary-btn flex-1" onclick={() => (isAddingPurpose = false)}>
                                Cancel
                            </button>
                            <button type="button" class="review-primary-btn flex-1" onclick={addPurposeInline}>
                                Add
                            </button>
                        </div>
                    </div>
                {:else}
                    <select id="review-purpose" value={purposeId} onchange={handlePurposeChange} class="review-input">
                        {#each $purposes as purpose}
                            <option value={purpose.id}>{purpose.emoji} {purpose.name}</option>
                        {/each}
                        <option value="new">+ Add new purpose…</option>
                    </select>
                {/if}
            </div>

            <div class={fieldClass('party')}>
                <label for="review-party" class="zen-field-label">Party</label>
                {#if isAddingParty}
                    <div class="space-y-2">
                        <input
                            type="text"
                            bind:value={newPartyName}
                            placeholder="Party name"
                            class="review-input"
                        />
                        <div class="flex gap-2">
                            <button type="button" class="review-secondary-btn flex-1" onclick={() => (isAddingParty = false)}>
                                Cancel
                            </button>
                            <button type="button" class="review-primary-btn flex-1" onclick={addPartyInline}>
                                Add
                            </button>
                        </div>
                    </div>
                {:else}
                    <select id="review-party" value={partyId} onchange={handlePartyChange} class="review-input">
                        <option value="">None</option>
                        {#each $parties as party}
                            <option value={party.id}>{party.emoji} {party.name}</option>
                        {/each}
                        <option value="new">+ Add new party…</option>
                    </select>
                {/if}
            </div>

            <div class={fieldClass('account')}>
                <span class="zen-field-label">Fund</span>
                {#if selectedPurpose?.accountType === 'transfer'}
                    <div class="space-y-2 mt-1">
                        <div class="flex flex-wrap gap-2">
                            {#each $funds as fund}
                                <button
                                    type="button"
                                    class="review-chip {fromFundId === fund.id ? 'review-chip--active' : ''}"
                                    onclick={() => (fromFundId = fund.id)}
                                >
                                    {fund.emoji} {fund.name}
                                </button>
                            {/each}
                        </div>
                        <p class="text-[9px] text-zen-herb uppercase tracking-wider text-center">→ to →</p>
                        <div class="flex flex-wrap gap-2">
                            {#each $funds as fund}
                                <button
                                    type="button"
                                    class="review-chip {toFundId === fund.id ? 'review-chip--active' : ''}"
                                    onclick={() => (toFundId = fund.id)}
                                >
                                    {fund.emoji} {fund.name}
                                </button>
                            {/each}
                        </div>
                    </div>
                {:else}
                    <div class="flex flex-wrap gap-2 mt-1">
                        {#each $funds as fund}
                            <button
                                type="button"
                                class="review-chip {fundId === fund.id ? 'review-chip--active' : ''}"
                                onclick={() => (fundId = fund.id)}
                            >
                                {fund.emoji} {fund.name}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            {#if showStatus}
                <div class={fieldClass('status')}>
                    <span class="zen-field-label">Status</span>
                    <div class="flex flex-wrap gap-2 mt-1">
                        {#each ['completed', 'pending', 'partial'] as option}
                            <button
                                type="button"
                                class="review-chip {status === option ? 'review-chip--active' : ''}"
                                onclick={() => (status = option as typeof status)}
                            >
                                {option}
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>

        <div class="mt-6 space-y-3">
            <button type="button" class="review-primary-btn w-full" onclick={handleSave}>
                Save transaction
            </button>
            <button type="button" class="review-secondary-btn w-full" onclick={onCancel}>
                Back to edit
            </button>
        </div>
    </div>
{/if}

<style>
    .review-field {
        padding: 0.75rem;
        border-radius: 0.875rem;
        border: 1px solid var(--color-zen-hairline);
        background-color: color-mix(in srgb, var(--color-zen-panel) 96%, transparent);
    }

    .review-field--flagged {
        border-color: color-mix(in srgb, var(--color-zen-spend) 35%, var(--color-zen-hairline));
    }

    .review-input {
        width: 100%;
        margin-top: 0.25rem;
        padding: 0.5rem 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid var(--color-zen-hairline);
        background-color: var(--color-zen-input);
        color: var(--color-zen-sage);
        font-size: 0.875rem;
    }

    .review-chip {
        padding: 0.375rem 0.875rem;
        border-radius: 9999px;
        border: 1px solid var(--color-zen-hairline);
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: capitalize;
        color: var(--color-zen-herb);
        transition: background-color 0.2s cubic-bezier(0.33, 1, 0.68, 1);
    }

    .review-chip--active {
        background-color: var(--color-zen-sage);
        border-color: var(--color-zen-sage);
        color: var(--color-zen-on-primary);
    }

    .review-primary-btn {
        padding: 0.875rem 1.25rem;
        border-radius: 9999px;
        background-color: var(--color-zen-sage);
        color: var(--color-zen-on-primary);
        font-size: 0.875rem;
        font-weight: 700;
        transition: transform 0.15s cubic-bezier(0.33, 1, 0.68, 1);
    }

    .review-primary-btn:active {
        transform: scale(0.97);
    }

    .review-secondary-btn {
        padding: 0.75rem 1.25rem;
        border-radius: 9999px;
        border: 1px solid var(--color-zen-hairline);
        color: var(--color-zen-herb);
        font-size: 0.8125rem;
        font-weight: 700;
    }
</style>
