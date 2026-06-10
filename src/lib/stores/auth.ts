import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export const user = writable<User | null>(null);
export const isLoading = writable(true);
export const authError = writable<string | null>(null);

if (browser) {
  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    user.set(session?.user ?? null);
    isLoading.set(false);
  });

  // Listen for changes
  supabase.auth.onAuthStateChange((_event, session) => {
    user.set(session?.user ?? null);
    isLoading.set(false);
  });
}

export async function signInWithEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    authError.set(null);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      authError.set(error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    authError.set(message);
    return { success: false, error: message };
  }
}

export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    authError.set(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      authError.set(error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    authError.set(message);
    return { success: false, error: message };
  }
}

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    authError.set(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      authError.set(error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    authError.set(message);
    return { success: false, error: message };
  }
}

export function clearAuthError() {
  authError.set(null);
}
