import { writable } from 'svelte/store';

/** Trigger to open auth modal from anywhere. Increment to open. */
export const authModalTrigger = writable(0);
