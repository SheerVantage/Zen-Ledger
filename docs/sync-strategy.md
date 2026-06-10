# Sync Strategy

## Overview

Local-first architecture with manual sync to Supabase (PostgreSQL).

## Current Implementation

### Flow
1. **Push** — Send local changes (create/update/delete) to Supabase
2. **Pull** — Fetch remote changes since last sync
3. **Mark synced** — Clear local queue

### Trigger
- Manual only — user clicks "Sync" button
- Requires authentication (email magic link or Google OAuth)

### Tables Synced
| Table | Description |
|-------|-------------|
| `transactions` | All transactions with fund tracking |
| `purposes` | Purpose categories with account types |
| `parties` | People/entities tagged in transactions |
| `funds` | User-defined funds (cash, bank, bkash, etc.) |
| `settings` | Profile, recurring templates |

### Not Synced
- Theme preference (localStorage only)
- UI state (menu open, expanded cards)
- Capture input text

### Column Mapping
Local IndexedDB uses camelCase, Supabase uses snake_case:
- `fundId` → `fund_id`
- `purposeId` → `purpose_id`
- `partyId` → `party_id`
- `fromFundId` → `from_fund_id`
- `toFundId` → `to_fund_id`
- `linkedTo` → `linked_to`
- `isPassthrough` → `is_passthrough`
- `prospectType` → `prospect_type`
- `expectedDate` → `expected_date`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `accountType` → `account_type`

### Sync Queue
- IndexedDB table `syncQueue` tracks pending changes
- Each entry: `{ id, table, recordId, operation, timestamp, synced }`
- Boolean `synced` field (false = pending, true = synced)

## Future Enhancements

### Edge Function Batching
**Current:** Individual INSERT/UPDATE/DELETE per item (N requests)
**Proposed:** Single edge function call with all data (1 request)

**Benefits:**
- Fewer HTTP requests (1 vs N)
- Single transaction boundary on server
- Server-side validation possible
- More efficient network usage

**Tradeoffs:**
- More complex server-side code
- Need to deploy/maintain edge function
- Harder to debug
- Edge function limits (50s timeout, payload size)

**Implementation:**
```typescript
// Supabase Edge Function
// Receives: { transactions: [...], funds: [...], purposes: [...], parties: [...], settings: [...] }
// Does: bulk upsert in single transaction
// Returns: { success: boolean, synced: number }
```

**When to implement:**
- Slow network environments
- Frequent sync usage
- Large data volumes (>100 records per sync)

### Auto-Sync
- Sync on app open
- Sync after N minutes of inactivity
- Background sync when network available

### Conflict Resolution
- Last-write-wins (current)
- Field-level merge
- User prompt for conflicts
- Version vector tracking

### Offline Queue Persistence
- Currently queue persists in IndexedDB
- Consider encrypting sensitive queue data
- Queue cleanup after successful sync

### Sync Status UI
- Show pending items count
- Show last sync time more prominently
- Sync progress indicator for large datasets
