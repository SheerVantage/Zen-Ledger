---
name: sqlite-wasm
description: SQLite database with OPFS persistence for local-first storage.
---

# SQLite-Wasm + OPFS Skill

## Implementation Standards
- **Library**: Use `@sqlite.org/sqlite-wasm`.
- **Persistence**: Always use the `opfs` VFS (Virtual File System) to ensure data is stored on the device's disk, not just in memory or IndexedDB.
- **Connection**: Initialize in a Web Worker to prevent UI blocking. 
- **Threading**: Use the `Promiser` API provided by sqlite-wasm for asynchronous communication between the Svelte UI and the Worker.

## Sync Strategy
- Structure tables with `ulid` or `uuid` as primary keys (not autoincrementing integers) to prevent collisions when we later sync with Supabase/MySQL.
- Include a `last_modified` timestamp on every row for delta-syncing.