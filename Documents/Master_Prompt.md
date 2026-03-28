> **Objective:** Refactor and enhance the existing SvelteKit finance app. Transition the core engine from IndexedDB to SQLite-Wasm (using OPFS VFS) while maintaining a "Modern Design" aesthetic and preparing for future multi-device synchronization.
>
> **Core Constraints & Skills:**
> - **Icons:** **DO NOT** use `lucide-svelte`. Use the existing `$lib/components/Icon.svelte` component, fetching SVG data from `$lib/assets/icons.json`. Add new icons to `icons.json` as needed.
> - **Database:** Implement SQLite-Wasm using the **OPFS VFS**. Data must be persistent on disk.
> - **Skills:** Follow `.agents/skills/sqlite-wasm`, `modern-design`, and `view-transitions`.
> - **Design:** Use the `slate-50/50` and `emerald` color palette. Ensure all buttons use the "push" micro-interaction (`scale-95`) and cards use the "hover-lift" effect.
>
> **Phase 1: The Data Engine (SQLite-Wasm + Persistence)**
> 1. Initialize SQLite-Wasm with a Web Worker in `src/lib/db/worker.ts`.
> 2. Create a Svelte 5 `$state` store in `src/lib/db/vault.ts` that communicates with this worker.
> 3. Implement a migration: On first load, detect data in the old IndexedDB, move it into the new SQLite `transactions` table, and verify success.
> 4. Ensure every table has a `sync_id` (UUID) and `updated_at` column.
>
> **Phase 2: Backup, Restore & Portability**
> 1. Implement "Manual Export": Fetch the SQLite `.db` file from OPFS and allow the user to download it.
> 2. Implement "Restore": Replace the current OPFS file with a user-uploaded `.db` file.
> 3. Create a `StorageSettings.svelte` component to house these actions.
>
> **Phase 3: Modern UI & Transitions**
> 1. Update the existing transaction list to use `view-transition-name` on `TransactionCard.svelte` and currency amounts.
> 2. Ensure navigation between the list and details is a smooth morphing transition.
> 3. Ensure the UI remains responsive and reflects SQLite data reactively.
>
> **Phase 4: Future-Proofing (The Sync Bridge)**
> 1. Abstract all database calls into a `VaultService` (Interface/Abstract class).
> 2. Implement a "Local-Only" provider for now, but include placeholder methods for `pushToRemote()` and `pullFromRemote()` (e.g., for future Supabase or MySQL integration).
>
> **Verification:**
> - Confirm the app loads existing data via migration.
> - Verify smooth morphing transitions during navigation.
> - Verify that the `.db` backup can be downloaded and successfully re-imported.
