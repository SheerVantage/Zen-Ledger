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
