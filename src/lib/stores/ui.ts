import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

const THEME_KEY = 'zen_theme';

function createThemeStore() {
    const initial = browser ? (localStorage.getItem(THEME_KEY) || 'zen') : 'zen';
    const { subscribe, set, update } = writable<string>(initial);

    return {
        subscribe,
        set: (theme: string) => {
            if (browser) localStorage.setItem(THEME_KEY, theme);
            set(theme);
        },
        toggle: () => {
            update(t => {
                const next = t === 'zen' ? 'dark' : 'zen';
                if (browser) localStorage.setItem(THEME_KEY, next);
                return next;
            });
        }
    };
}

export const theme = createThemeStore();

/** FAB capture input sheet visibility (single source of truth). */
export const isCaptureInputVisible = writable(false);

/** True while a TransactionCard is in inline edit mode. */
export const isEditingTransaction = writable(false);

export function toggleCaptureInput() {
    if (get(isEditingTransaction)) return;
    isCaptureInputVisible.update((v) => !v);
}

export function closeCaptureInput() {
    isCaptureInputVisible.set(false);
    blurCaptureInputElement();
}

export function openCaptureInput() {
    if (get(isEditingTransaction)) return;
    isCaptureInputVisible.set(true);
}

function blurCaptureInputElement() {
    if (!browser) return;
    const capture = document.querySelector<HTMLElement>('[data-capture-input]');
    capture?.blur();
}

/** Close capture chrome and mark inline edit active so InputPill unmounts immediately. */
export function beginTransactionEdit() {
    isEditingTransaction.set(true);
    closeCaptureInput();
}

export function endTransactionEdit() {
    isEditingTransaction.set(false);
}
