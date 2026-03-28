---
name: duckdb-wasm
description: Sets up and manages an in-browser DuckDB instance using WASM. Use when the user needs high-performance SQL analysis or local-first transaction storage in SvelteKit.
---

# DuckDB-Wasm Skill

When implementing DuckDB-Wasm in this project, follow these technical constraints and patterns.

## Implementation Standards
- **Initialization**: Initialize the DuckDB instance within a Svelte store (`src/lib/stores/db.ts`) to ensure a singleton instance across the application.
- **Worker Configuration**: Always use the `@duckdb/duckdb-wasm` package. Ensure the Vite configuration correctly handles the `.wasm` and worker files.
- **Schema Management**: For personal finance, default to a `transactions` table with columns: `id (UUID)`, `date (DATE)`, `amount (DECIMAL)`, `category (VARCHAR)`, and `description (TEXT)`.

## How to use
1. Use `selectBundle` to pick the correct WASM bundle based on browser capabilities.
2. Provide a `db.query()` helper that returns plain JavaScript objects for easy use in Svelte `$state` or stores.
3. If persistence is requested, utilize the `OPFS` (Origin Private File System) browser API for storage.

## Constraints
- Do not perform heavy computations on the main thread; always leverage the DuckDB Worker.
- Do not use `*` in production queries; explicitly list columns to minimize WASM-to-JS overhead.