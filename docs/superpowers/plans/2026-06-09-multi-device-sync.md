# Implementation Plan: Multi-Device Sync with Supabase

**Date:** 2026-06-09  
**Feature:** Multi-device data synchronization  
**Status:** Planning  

---

## Context

**User need:** Access Zen Ledger from both mobile and laptop with data kept in sync.

**Current state:** Data stored in localStorage (browser-only, no sync).

**Target state:** 
- Local storage: IndexedDB (via Dexie.js) for better performance and offline support
- Cloud storage: Supabase (PostgreSQL) for sync and backup
- Auth: Email magic link + Google OAuth
- Sync: Manual trigger (user clicks sync button)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
├─────────────────────────────────────────────────────────────┤
│  SvelteKit App                                              │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  Svelte Stores   │◄──►│  Dexie.js       │                │
│  │  (reactive UI)   │    │  (IndexedDB)    │                │
│  └─────────────────┘    └────────┬────────┘                │
│                                  │                          │
│  ┌───────────────────────────────▼────────────────────┐    │
│  │              Sync Engine                           │    │
│  │  - Queue changes when offline                      │    │
│  │  - Push/pull on manual trigger                     │    │
│  │  - Conflict resolution: last-write-wins            │    │
│  └───────────────────────────────┬────────────────────┘    │
└──────────────────────────────────┼──────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  Auth            │    │  Database        │                │
│  │  - Magic link    │    │  - transactions  │                │
│  │  - Google OAuth  │    │  - purposes      │                │
│  └─────────────────┘    │  - parties       │                │
│                         │  - settings      │                │
│                         └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: IndexedDB Migration (Dexie.js)

### 1.1 Install Dependencies

```bash
npm install dexie
```

### 1.2 Create Database Schema

**File:** `src/lib/db/database.ts`

```typescript
import Dexie, { type Table } from 'dexie';
import type { Transaction } from '$lib/stores/transactions';
import type { Purpose } from '$lib/stores/purposes';
import type { Party } from '$lib/stores/parties';
import type { SettingsState } from '$lib/stores/settings';

export interface SyncMetadata {
  id: string;
  table: string;
  recordId: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: string;
  synced: boolean;
  userId?: string;
}

export class ZenLedgerDB extends Dexie {
  transactions!: Table<Transaction>;
  purposes!: Table<Purpose>;
  parties!: Table<Party>;
  settings!: Table<SettingsState>;
  syncQueue!: Table<SyncMetadata>;

  constructor() {
    super('zen-ledger-db');
    this.version(1).stores({
      transactions: 'id, purposeId, date, partyId, linkedTo, createdAt',
      purposes: 'id, name, accountType',
      parties: 'id, name',
      settings: 'id',
      syncQueue: '++id, table, recordId, timestamp, synced'
    });
  }
}

export const db = new ZenLedgerDB();
```

### 1.3 Create Sync Queue Utilities

**File:** `src/lib/db/sync-queue.ts`

```typescript
import { db, type SyncMetadata } from './database';

export async function addToSyncQueue(
  table: string,
  recordId: string,
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    table,
    recordId,
    operation,
    timestamp: new Date().toISOString(),
    synced: false
  });
}

export async function getPendingSyncItems(): Promise<SyncMetadata[]> {
  return db.syncQueue.where('synced').equals(0).toArray();
}

export async function markAsSynced(ids: string[]): Promise<void> {
  await db.syncQueue.where('id').anyOf(ids).modify({ synced: true });
}

export async function clearSyncedItems(): Promise<void> {
  await db.syncQueue.where('synced').equals(1).delete();
}
```

### 1.4 Create Data Access Layer

**File:** `src/lib/db/transactions.ts`

```typescript
import { db } from './database';
import type { Transaction } from '$lib/stores/transactions';
import { addToSyncQueue } from './sync-queue';

export async function getAllTransactions(): Promise<Transaction[]> {
  return db.transactions.toArray();
}

export async function addTransaction(t: Transaction): Promise<void> {
  await db.transactions.add(t);
  await addToSyncQueue('transactions', t.id, 'create');
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
  await db.transactions.update(id, updates);
  await addToSyncQueue('transactions', id, 'update');
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id);
  await addToSyncQueue('transactions', id, 'delete');
}
```

### 1.5 Migrate localStorage Data

**File:** `src/lib/db/migrate.ts`

```typescript
import { browser } from '$app/environment';
import { db } from './database';

const STORAGE_KEYS = {
  transactions: 'zen_ledger_v1',
  purposes: 'zen_ledger_purposes_v1',
  parties: 'zen_ledger_parties_v1',
  settings: 'zen_ledger_settings_v1'
};

export async function migrateFromLocalStorage(): Promise<void> {
  if (!browser) return;
  
  // Check if migration already done
  const count = await db.transactions.count();
  if (count > 0) return;
  
  // Migrate transactions
  const txData = localStorage.getItem(STORAGE_KEYS.transactions);
  if (txData) {
    const transactions = JSON.parse(txData);
    await db.transactions.bulkAdd(transactions);
  }
  
  // Migrate purposes
  const purposesData = localStorage.getItem(STORAGE_KEYS.purposes);
  if (purposesData) {
    const purposes = JSON.parse(purposesData);
    await db.purposes.bulkAdd(purposes);
  }
  
  // Migrate parties
  const partiesData = localStorage.getItem(STORAGE_KEYS.parties);
  if (partiesData) {
    const parties = JSON.parse(partiesData);
    await db.parties.bulkAdd(parties);
  }
  
  // Migrate settings
  const settingsData = localStorage.getItem(STORAGE_KEYS.settings);
  if (settingsData) {
    const settings = JSON.parse(settingsData);
    await db.settings.add(settings);
  }
  
  console.log('Migration complete');
}
```

### 1.6 Update Stores to Use Dexie

**File:** `src/lib/stores/transactions.ts` (modified)

```typescript
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { liveQuery } from 'dexie';
import { db } from '$lib/db/database';
import { addTransaction as dbAdd, updateTransaction as dbUpdate, deleteTransaction as dbDelete } from '$lib/db/transactions';
import { purposes } from './purposes';
import { settings } from './settings';

// ... Transaction interface stays the same ...

// Use Dexie liveQuery for reactive data
export const transactions = liveQuery(() => db.transactions.toArray());

// Wrapper functions that update both Dexie and trigger sync
export async function addTransaction(t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
  const id = Math.random().toString(36).substring(2, 9);
  const timestamp = new Date().toISOString();
  
  const allPurposes = await db.purposes.toArray();
  const purpose = allPurposes.find(p => p.id === t.purposeId);
  const accountType = purpose?.accountType || 'expense';
  
  let defaultStatus: Transaction['status'] = 'completed';
  if (['receivable', 'payable', 'prospect'].includes(accountType)) {
    defaultStatus = 'pending';
  }
  
  const newTransaction: Transaction = {
    account: 'cash',
    status: defaultStatus,
    isPassthrough: false,
    ...t,
    id,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  await dbAdd(newTransaction);
  
  // Recalculate settings
  const allTransactions = await db.transactions.toArray();
  settings.recalculate(allTransactions, allPurposes);
  
  return id;
}

// ... other functions similarly updated ...
```

---

## Phase 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to https://supabase.com
2. Create new project
3. Note the project URL and anon key

### 2.2 Database Schema

**File:** `supabase/migrations/001_initial_schema.sql`

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Transactions table
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  narration text not null,
  amount numeric not null,
  purpose_id uuid not null,
  date date not null,
  party_id uuid,
  linked_to uuid,
  account text,
  to_account text,
  status text check (status in ('completed', 'pending', 'partial')),
  is_passthrough boolean default false,
  prospect_type text,
  confidence text check (confidence in ('high', 'medium', 'low')),
  expected_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Purposes table
create table public.purposes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null,
  account_type text not null,
  aliases text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Parties table
create table public.parties (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null,
  aliases text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Settings table
create table public.settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique,
  profile jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security
alter table public.transactions enable row level security;
alter table public.purposes enable row level security;
alter table public.parties enable row level security;
alter table public.settings enable row level security;

-- Policies
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Similar policies for purposes, parties, settings...

-- Indexes for sync
create index idx_transactions_updated_at on public.transactions(updated_at);
create index idx_purposes_updated_at on public.purposes(updated_at);
create index idx_parties_updated_at on public.parties(updated_at);
```

### 2.3 Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2.4 Create Supabase Client

**File:** `src/lib/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);
```

### 2.5 Environment Variables

**File:** `.env`

```bash
PUBLIC_SUPABASE_URL="your-project-url"
PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

---

## Phase 3: Authentication

### 3.1 Auth Store

**File:** `src/lib/stores/auth.ts`

```typescript
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export const user = writable<User | null>(null);
export const isLoading = writable(true);

if (browser) {
  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    user.set(session?.user ?? null);
    isLoading.set(false);
  });

  // Listen for changes
  supabase.auth.onAuthStateChange((_event, session) => {
    user.set(session?.user ?? null);
  });
}

export async function signInWithEmail(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
```

### 3.2 Auth UI Component

**File:** `src/lib/components/AuthModal.svelte`

```svelte
<script lang="ts">
  import { signInWithEmail, signInWithGoogle, signOut, user } from '$lib/stores/auth';
  
  let email = $state('');
  let isSubmitting = $state(false);
  let message = $state('');
  
  async function handleEmailSignIn() {
    isSubmitting = true;
    message = '';
    try {
      await signInWithEmail(email);
      message = 'Check your email for the login link!';
    } catch (e) {
      message = 'Error: ' + e.message;
    } finally {
      isSubmitting = false;
    }
  }
</script>

{#if $user}
  <div class="flex items-center gap-3">
    <span class="text-sm text-zen-sage">{$user.email}</span>
    <button onclick={signOut} class="text-sm text-zen-herb hover:text-zen-sage">
      Sign out
    </button>
  </div>
{:else}
  <div class="space-y-4">
    <form onsubmit={handleEmailSignIn} class="space-y-3">
      <input
        type="email"
        bind:value={email}
        placeholder="Enter your email"
        class="w-full px-4 py-2 rounded-lg border border-zen-herb/20 bg-zen-input"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        class="w-full px-4 py-2 bg-zen-sage text-white rounded-lg"
      >
        {isSubmitting ? 'Sending...' : 'Send Magic Link'}
      </button>
    </form>
    
    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-zen-herb/20"></div>
      </div>
      <div class="relative flex justify-center text-xs">
        <span class="px-2 bg-zen-oat text-zen-herb">or</span>
      </div>
    </div>
    
    <button
      onclick={signInWithGoogle}
      class="w-full px-4 py-2 border border-zen-herb/20 rounded-lg flex items-center justify-center gap-2"
    >
      <img src="/google.svg" alt="" class="w-5 h-5" />
      Continue with Google
    </button>
    
    {#if message}
      <p class="text-sm text-zen-herb">{message}</p>
    {/if}
  </div>
{/if}
```

---

## Phase 4: Manual Sync

### 4.1 Sync Engine

**File:** `src/lib/sync/engine.ts`

```typescript
import { supabase } from '$lib/supabase/client';
import { db } from '$lib/db/database';
import { getPendingSyncItems, markAsSynced } from '$lib/db/sync-queue';
import { user } from '$lib/stores/auth';
import { get } from 'svelte/store';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export const syncStatus = writable<SyncStatus>('idle');
export const lastSyncTime = writable<string | null>(null);

export async function syncData(): Promise<void> {
  const currentUser = get(user);
  if (!currentUser) {
    throw new Error('Must be signed in to sync');
  }
  
  syncStatus.set('syncing');
  
  try {
    // 1. Get pending changes from local queue
    const pendingItems = await getPendingSyncItems();
    
    // 2. Push local changes to Supabase
    for (const item of pendingItems) {
      const localData = await db[item.table as keyof typeof db].get(item.recordId);
      
      if (item.operation === 'delete') {
        await supabase
          .from(item.table)
          .delete()
          .eq('id', item.recordId)
          .eq('user_id', currentUser.id);
      } else if (item.operation === 'create') {
        await supabase
          .from(item.table)
          .insert({ ...localData, user_id: currentUser.id });
      } else if (item.operation === 'update') {
        await supabase
          .from(item.table)
          .update(localData)
          .eq('id', item.recordId)
          .eq('user_id', currentUser.id);
      }
    }
    
    // 3. Pull remote changes since last sync
    const lastSync = localStorage.getItem('zen_last_sync');
    const since = lastSync || new Date(0).toISOString();
    
    const tables = ['transactions', 'purposes', 'parties', 'settings'];
    
    for (const table of tables) {
      const { data: remoteData, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', currentUser.id)
        .gt('updated_at', since);
      
      if (error) throw error;
      
      // Merge remote data into local DB
      if (remoteData) {
        await db[table as keyof typeof db].bulkPut(remoteData);
      }
    }
    
    // 4. Mark local changes as synced
    await markAsSynced(pendingItems.map(i => i.id.toString()));
    
    // 5. Update last sync time
    const now = new Date().toISOString();
    localStorage.setItem('zen_last_sync', now);
    lastSyncTime.set(now);
    
    syncStatus.set('success');
    
  } catch (error) {
    console.error('Sync error:', error);
    syncStatus.set('error');
    throw error;
  }
}
```

### 4.2 Sync Button Component

**File:** `src/lib/components/SyncButton.svelte`

```svelte
<script lang="ts">
  import { syncData, syncStatus, lastSyncTime } from '$lib/sync/engine';
  import { user } from '$lib/stores/auth';
  
  let isSyncing = $state(false);
  
  async function handleSync() {
    if (!$user) {
      // Show auth modal
      return;
    }
    
    isSyncing = true;
    try {
      await syncData();
    } catch (e) {
      console.error(e);
    } finally {
      isSyncing = false;
    }
  }
</script>

<button
  onclick={handleSync}
  disabled={isSyncing || !$user}
  class="flex items-center gap-2 px-4 py-2 rounded-lg border border-zen-herb/20 hover:bg-zen-panel transition-colors"
>
  {#if isSyncing}
    <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span class="text-sm">Syncing...</span>
  {:else}
    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
    <span class="text-sm">Sync</span>
  {/if}
  
  {#if $lastSyncTime}
    <span class="text-xs text-zen-herb/60">
      Last: {new Date($lastSyncTime).toLocaleTimeString()}
    </span>
  {/if}
</button>
```

---

## Phase 5: Integration

### 5.1 Update Layout

**File:** `src/routes/+layout.svelte` (modified)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { migrateFromLocalStorage } from '$lib/db/migrate';
  import AuthModal from '$lib/components/AuthModal.svelte';
  import SyncButton from '$lib/components/SyncButton.svelte';
  
  onMount(async () => {
    await migrateFromLocalStorage();
  });
</script>

<header class="flex items-center justify-between p-4">
  <h1 class="text-xl font-bold">Zen Ledger</h1>
  <div class="flex items-center gap-4">
    <SyncButton />
    <AuthModal />
  </div>
</header>

<slot />
```

---

## Implementation Order

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1.1 | Install Dexie.js | 5 min |
| 1.2 | Create database schema | 30 min |
| 1.3 | Create sync queue utilities | 30 min |
| 1.4 | Create data access layer | 1 hour |
| 1.5 | Migrate localStorage data | 30 min |
| 1.6 | Update stores to use Dexie | 2 hours |
| 2.1 | Create Supabase project | 15 min |
| 2.2 | Write SQL migrations | 1 hour |
| 2.3 | Install Supabase client | 5 min |
| 2.4 | Create Supabase client | 15 min |
| 3.1 | Create auth store | 45 min |
| 3.2 | Create auth UI | 1 hour |
| 4.1 | Create sync engine | 1.5 hours |
| 4.2 | Create sync button | 30 min |
| 5.1 | Integrate everything | 1 hour |
| **Total** | | **~11 hours** |

---

## Success Criteria

- [ ] App loads with IndexedDB data (migrated from localStorage)
- [ ] All CRUD operations work with IndexedDB
- [ ] User can sign in with email magic link
- [ ] User can sign in with Google OAuth
- [ ] User can click sync button to push/pull data
- [ ] Data persists across devices after sync
- [ ] Offline changes sync when back online
- [ ] No data loss during migration
- [ ] TypeScript compiles with 0 errors
- [ ] All existing functionality preserved

---

## Known Risks

1. **Data migration**: Large localStorage datasets may take time to migrate
2. **Conflict resolution**: Last-write-wins may lose data if same record edited on both devices simultaneously
3. **Offline support**: Manual sync requires user to click button when back online
4. **Supabase costs**: Free tier has limits (50,000 monthly active users, 500MB database)

---

## Future Enhancements (Out of Scope)

1. **Auto-sync**: Background sync every 30 seconds when online
2. **Conflict UI**: Show conflicts and let user choose which version to keep
3. **Export/Import**: Backup data to file
4. **Multi-user**: Share data with family members
5. **PWA**: Add service worker for offline support
