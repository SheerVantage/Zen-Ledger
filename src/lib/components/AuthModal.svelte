<script lang="ts">
  import { signInWithEmail, signInWithGoogle, signOut, user, isLoading, authError, clearAuthError } from '$lib/stores/auth';
  import { authModalTrigger } from '$lib/stores/auth-modal';
  import Icon from '$lib/components/Icon.svelte';
  import { tick } from 'svelte';
  
  let email = $state('');
  let isSubmitting = $state(false);
  let message = $state('');
  let showModal = $state(false);
  let modalContent = $state<HTMLElement | null>(null);
  let previousFocus = $state<HTMLElement | null>(null);

  // Listen for external trigger
  $effect(() => {
    if ($authModalTrigger > 0) {
      showModal = true;
    }
  });
  
  function trapFocus(e: KeyboardEvent) {
    if (e.key !== 'Tab' || !modalContent) return;
    const focusable = modalContent.querySelectorAll<HTMLElement>(
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
  
  async function handleEmailSignIn() {
    if (!email) return;
    
    isSubmitting = true;
    message = '';
    clearAuthError();
    
    const result = await signInWithEmail(email);
    
    if (result.success) {
      message = 'Check your email for the login link!';
    } else {
      message = result.error || 'Failed to send magic link';
    }
    
    isSubmitting = false;
  }
  
  async function handleGoogleSignIn() {
    isSubmitting = true;
    message = '';
    clearAuthError();
    
    const result = await signInWithGoogle();
    
    if (!result.success) {
      message = result.error || 'Failed to sign in with Google';
      isSubmitting = false;
    }
  }
  
  async function handleSignOut() {
    await signOut();
    showModal = false;
  }
</script>

{#if $user}
  <button
    onclick={() => showModal = true}
    class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zen-herb/20 hover:bg-zen-panel transition-colors"
  >
    <span class="text-sm text-zen-sage truncate max-w-[100px]">{$user.email}</span>
  </button>
  
  {#if showModal}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-zen-oat/50" onclick={() => showModal = false} onkeydown={(e) => e.key === 'Escape' && (showModal = false)}>
      <div
        bind:this={modalContent}
        class="bg-zen-oat rounded-zen shadow-zen-soft p-6 max-w-sm w-full mx-4"
        onclick={(e) => e.stopPropagation()}
        onkeydown={trapFocus}
        role="dialog"
        tabindex="-1"
        aria-modal="true"
        aria-labelledby="auth-account-title"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 id="auth-account-title" class="text-lg font-heading font-bold text-zen-sage">Account</h3>
          <button onclick={() => showModal = false} class="h-11 w-11 flex items-center justify-center rounded-lg text-zen-herb hover:text-zen-sage hover:bg-zen-panel transition-colors" aria-label="Close">
            <Icon name="close" size="20" strokeWidth="2" />
          </button>
        </div>
        
        <div class="space-y-4">
          <div class="p-3 bg-zen-panel rounded-lg border border-zen-herb/10">
            <p class="text-sm text-zen-herb">Signed in as</p>
            <p class="text-zen-sage font-medium">{$user.email}</p>
          </div>
          
          <button
            onclick={handleSignOut}
            class="w-full px-4 py-2 text-zen-spend border border-zen-spend/30 rounded-lg hover:bg-zen-spend/10 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  {/if}
{:else}
  <button
    onclick={() => showModal = true}
    class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zen-herb/20 hover:bg-zen-panel transition-colors"
  >
    <svg class="w-4 h-4 text-zen-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
    <span class="text-sm text-zen-sage">Sign in</span>
  </button>
  
  {#if showModal}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-zen-oat/50" onclick={() => showModal = false} onkeydown={(e) => e.key === 'Escape' && (showModal = false)}>
      <div
        bind:this={modalContent}
        class="bg-zen-oat rounded-zen shadow-zen-soft p-6 max-w-sm w-full mx-4"
        onclick={(e) => e.stopPropagation()}
        onkeydown={trapFocus}
        role="dialog"
        tabindex="-1"
        aria-modal="true"
        aria-labelledby="auth-signin-title"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 id="auth-signin-title" class="text-lg font-heading font-bold text-zen-sage">Sign in to Sync</h3>
          <button onclick={() => showModal = false} class="h-11 w-11 flex items-center justify-center rounded-lg text-zen-herb hover:text-zen-sage hover:bg-zen-panel transition-colors" aria-label="Close">
            <Icon name="close" size="20" strokeWidth="2" />
          </button>
        </div>
        
        <form onsubmit={handleEmailSignIn} class="space-y-3 mb-4">
          <input
            type="email"
            bind:value={email}
            placeholder="Enter your email"
            required
            class="w-full px-4 py-2 rounded-lg border border-zen-herb/20 bg-zen-input text-zen-sage placeholder-zen-herb/50 focus:outline-none focus:ring-2 focus:ring-zen-sage/30"
          />
          <button
            type="submit"
            disabled={isSubmitting || !email}
            class="w-full px-4 py-2 bg-zen-sage text-white rounded-lg hover:bg-zen-sage/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>
        
        <div class="relative mb-4">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-zen-herb/20"></div>
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="px-2 bg-zen-oat text-zen-herb">or</span>
          </div>
        </div>
        
        <button
          onclick={handleGoogleSignIn}
          disabled={isSubmitting}
          class="w-full px-4 py-2 border border-zen-herb/20 rounded-lg flex items-center justify-center gap-2 hover:bg-zen-panel transition-colors disabled:opacity-50"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        
        {#if message}
          <p class="mt-4 text-sm text-zen-herb text-center">{message}</p>
        {/if}
        
        {#if $authError}
          <p class="mt-4 text-sm text-zen-spend text-center">{$authError}</p>
        {/if}
      </div>
    </div>
  {/if}
{/if}
