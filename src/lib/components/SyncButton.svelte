<script lang="ts">
  import { syncData, syncStatus, lastSyncTime, syncError } from '$lib/sync/engine';
  import { user } from '$lib/stores/auth';
  
  let isSyncing = $state(false);
  let showTooltip = $state(false);
  
  async function handleSync() {
    if (!$user || isSyncing) return;
    
    isSyncing = true;
    await syncData();
    isSyncing = false;
  }
  
  function formatLastSync(time: string | null): string {
    if (!time) return 'Never';
    const date = new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  }
</script>

<div class="relative">
  <button
    onclick={handleSync}
    disabled={isSyncing || !$user}
    onmouseenter={() => showTooltip = true}
    onmouseleave={() => showTooltip = false}
    class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zen-herb/20 hover:bg-zen-panel transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    title={!$user ? 'Sign in to sync' : 'Sync data'}
  >
    {#if isSyncing || $syncStatus === 'syncing'}
      <svg class="animate-spin h-4 w-4 text-zen-sage" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm text-zen-sage">Syncing...</span>
    {:else if $syncStatus === 'success'}
      <svg class="h-4 w-4 text-zen-earn" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span class="text-sm text-zen-earn">Done</span>
    {:else if $syncStatus === 'error'}
      <svg class="h-4 w-4 text-zen-spend" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
      <span class="text-sm text-zen-spend">Error</span>
    {:else}
      <svg class="h-4 w-4 text-zen-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span class="text-sm text-zen-sage">Sync</span>
    {/if}
  </button>
  
  {#if showTooltip}
    <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-zen-sage text-white text-xs rounded-lg whitespace-nowrap z-50">
      {#if !$user}
        Sign in to sync across devices
      {:else}
        Last sync: {formatLastSync($lastSyncTime)}
      {/if}
      {#if $syncError}
        <div class="text-zen-spend mt-1">{$syncError}</div>
      {/if}
      <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zen-sage rotate-45"></div>
    </div>
  {/if}
</div>
