import { writable, get } from 'svelte/store';
import { supabase } from '$lib/supabase/client';
import { db } from '$lib/db/database';
import { getPendingSyncItems, markAsSynced } from '$lib/db/sync-queue';
import { user } from '$lib/stores/auth';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export const syncStatus = writable<SyncStatus>('idle');
export const lastSyncTime = writable<string | null>(null);
export const syncError = writable<string | null>(null);

// Load last sync time from localStorage
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('zen_last_sync');
  if (stored) {
    lastSyncTime.set(stored);
  }
}

// Convert camelCase local fields to snake_case for Supabase
function toSnakeCase(data: any): any {
  const map: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    switch (key) {
      case 'purposeId': map['purpose_id'] = value; break;
      case 'partyId': map['party_id'] = value; break;
      case 'fundId': map['fund_id'] = value; break;
      case 'fromFundId': map['from_fund_id'] = value; break;
      case 'toFundId': map['to_fund_id'] = value; break;
      case 'linkedTo': map['linked_to'] = value; break;
      case 'isPassthrough': map['is_passthrough'] = value; break;
      case 'prospectType': map['prospect_type'] = value; break;
      case 'expectedDate': map['expected_date'] = value; break;
      case 'createdAt': map['created_at'] = value; break;
      case 'updatedAt': map['updated_at'] = value; break;
      case 'accountType': map['account_type'] = value; break;
      default: map[key] = value;
    }
  }
  return map;
}

// Convert snake_case from Supabase to camelCase for local DB
function toCamelCase(data: any): any {
  const map: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    switch (key) {
      case 'purpose_id': map['purposeId'] = value; break;
      case 'party_id': map['partyId'] = value; break;
      case 'fund_id': map['fundId'] = value; break;
      case 'from_fund_id': map['fromFundId'] = value; break;
      case 'to_fund_id': map['toFundId'] = value; break;
      case 'linked_to': map['linkedTo'] = value; break;
      case 'is_passthrough': map['isPassthrough'] = value; break;
      case 'prospect_type': map['prospectType'] = value; break;
      case 'expected_date': map['expectedDate'] = value; break;
      case 'created_at': map['createdAt'] = value; break;
      case 'updated_at': map['updatedAt'] = value; break;
      case 'account_type': map['accountType'] = value; break;
      default: map[key] = value;
    }
  }
  return map;
}

async function getLocalData(table: string, recordId: string): Promise<any> {
  switch (table) {
    case 'transactions':
      return await db.transactions.get(recordId);
    case 'purposes':
      return await db.purposes.get(recordId);
    case 'parties':
      return await db.parties.get(recordId);
    case 'funds':
      return await db.funds.get(recordId);
    case 'settings':
      return await db.settings.get(recordId);
    default:
      return null;
  }
}

async function bulkPutLocalData(table: string, data: any[]): Promise<void> {
  switch (table) {
    case 'transactions':
      await db.transactions.bulkPut(data);
      break;
    case 'purposes':
      await db.purposes.bulkPut(data);
      break;
    case 'parties':
      await db.parties.bulkPut(data);
      break;
    case 'funds':
      await db.funds.bulkPut(data);
      break;
    case 'settings':
      for (const item of data) {
        await db.settings.put(item);
      }
      break;
  }
}

export async function syncData(): Promise<{ success: boolean; error?: string }> {
  const currentUser = get(user);
  if (!currentUser) {
    const error = 'Must be signed in to sync';
    syncError.set(error);
    return { success: false, error };
  }
  
  syncStatus.set('syncing');
  syncError.set(null);
  
  try {
    // 1. Get pending changes from local queue
    const pendingItems = await getPendingSyncItems();
    console.log(`[Sync] Found ${pendingItems.length} pending items`);
    
    // 2. Push local changes to Supabase — batch by table
    const grouped = new Map<string, typeof pendingItems>();
    for (const item of pendingItems) {
      const existing = grouped.get(item.table) || [];
      existing.push(item);
      grouped.set(item.table, existing);
    }

    for (const [table, items] of grouped) {
      const inserts: any[] = [];
      const updates: any[] = [];
      const deletes: string[] = [];

      for (const item of items) {
        const localData = await getLocalData(item.table, item.recordId);
        if (item.operation === 'delete') {
          deletes.push(item.recordId);
        } else if (item.operation === 'create' && localData) {
          inserts.push(toSnakeCase({ ...localData, user_id: currentUser.id }));
        } else if (item.operation === 'update' && localData) {
          updates.push(toSnakeCase({ ...localData, user_id: currentUser.id }));
        }
      }

      if (inserts.length > 0) {
        const { error } = await supabase.from(table).insert(inserts);
        if (error) {
          console.error(`Push insert error (${table}):`, error);
          syncError.set(`Failed to sync ${table}: ${error.message}`);
        }
      }
      if (updates.length > 0) {
        const { error } = await supabase.from(table).upsert(updates, { onConflict: 'id' });
        if (error) {
          console.error(`Push upsert error (${table}):`, error);
          syncError.set(`Failed to sync ${table}: ${error.message}`);
        }
      }
      if (deletes.length > 0) {
        const { error } = await supabase.from(table).delete().in('id', deletes).eq('user_id', currentUser.id);
        if (error) {
          console.error(`Push delete error (${table}):`, error);
          syncError.set(`Failed to sync ${table}: ${error.message}`);
        }
      }
      
      console.log(`[Sync] Pushed ${table}: ${inserts.length} inserts, ${updates.length} updates, ${deletes.length} deletes`);
    }
    
    // 3. Pull remote changes since last sync
    const lastSync = localStorage.getItem('zen_last_sync');
    const since = lastSync || new Date(0).toISOString();
    
    const tables = ['transactions', 'purposes', 'parties', 'funds', 'settings'];
    
    for (const table of tables) {
      let offset = 0;
      const pageSize = 500;
      let hasMore = true;

      while (hasMore) {
        const { data: remoteData, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', currentUser.id)
          .gt('updated_at', since)
          .range(offset, offset + pageSize - 1);
        
        if (error) {
          console.error(`Error pulling ${table}:`, error);
          break;
        }
        
        if (remoteData && remoteData.length > 0) {
          const cleanedData = remoteData.map(({ user_id, ...rest }) => toCamelCase(rest));
          await bulkPutLocalData(table, cleanedData);
          offset += pageSize;
          hasMore = remoteData.length === pageSize;
        } else {
          hasMore = false;
        }
      }
    }
    
    // 4. Mark local changes as synced
    if (pendingItems.length > 0) {
      await markAsSynced(pendingItems.map(i => i.id.toString()));
    }
    
    // 5. Update last sync time
    const now = new Date().toISOString();
    localStorage.setItem('zen_last_sync', now);
    lastSyncTime.set(now);
    
    syncStatus.set('success');
    
    // Reset status after 3 seconds
    setTimeout(() => {
      syncStatus.set('idle');
    }, 3000);
    
    return { success: true };
    
  } catch (error) {
    console.error('Sync error:', error);
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    syncStatus.set('error');
    syncError.set(message);
    
    // Reset status after 5 seconds
    setTimeout(() => {
      syncStatus.set('idle');
    }, 5000);
    
    return { success: false, error: message };
  }
}

export function clearSyncError() {
  syncError.set(null);
}
