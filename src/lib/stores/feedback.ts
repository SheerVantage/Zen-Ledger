import { writable } from 'svelte/store';

export const toastMessage = writable<string | null>(null);
export const highlightedTransactionId = writable<string | null>(null);

let toastTimer: ReturnType<typeof setTimeout> | undefined;
let highlightTimer: ReturnType<typeof setTimeout> | undefined;

export function triggerHaptic(pattern: number | number[] = 12) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
    }
}

export function showCaptureSuccess(transactionId: string, message = 'Got it') {
    toastMessage.set(message);
    highlightedTransactionId.set(transactionId);
    triggerHaptic(12);

    if (toastTimer) clearTimeout(toastTimer);
    if (highlightTimer) clearTimeout(highlightTimer);

    toastTimer = setTimeout(() => toastMessage.set(null), 2400);
    highlightTimer = setTimeout(() => highlightedTransactionId.set(null), 3200);
}

/** Confirmation dialog state for destructive actions. */
export interface ConfirmState {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'default';
    onConfirm: () => void;
    onCancel?: () => void;
}

export const confirmDialog = writable<ConfirmState | null>(null);

export function requestConfirm({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel,
}: ConfirmState) {
    confirmDialog.set({ title, message, confirmLabel, cancelLabel, variant, onConfirm, onCancel });
}

/** Auto-settlement prompt — shown after saving an earning/recovered that matches an open receivable. */
export interface AutoSettlementPrompt {
    partyName: string;
    receivableId: string;
    receivableAmount: number;
    onSettle: () => void;
}

export const autoSettlementPrompt = writable<AutoSettlementPrompt | null>(null);

let autoSettlementTimer: ReturnType<typeof setTimeout> | undefined;

export function showAutoSettlementPrompt(prompt: AutoSettlementPrompt) {
    autoSettlementPrompt.set(prompt);
    if (autoSettlementTimer) clearTimeout(autoSettlementTimer);
    autoSettlementTimer = setTimeout(() => autoSettlementPrompt.set(null), 6000);
}
