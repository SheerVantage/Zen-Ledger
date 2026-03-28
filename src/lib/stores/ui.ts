import { writable } from 'svelte/store';
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
