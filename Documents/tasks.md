# Zen Ledger - Implementation Tasks

> Last synced: **2026-05-22** (v2.0.0) — see [STATUS.md](./STATUS.md)

## 1. Project Initialization
- [x] SvelteKit (Svelte 5 + Vite), Tailwind v4, design tokens
- [x] Folder structure, noise overlay, custom favicon

## 2. Core Components
- [x] `InputPill.svelte` — autocomplete, extras, **autoFocusOnMount**, `data-testid="capture-input"`
- [x] `StatusRing.svelte`, `TransactionCard.svelte`, `Icon.svelte`
- [x] `CaptureReviewSheet.svelte` — smart gate review UI
- [x] `Toast.svelte`, `WealthLedger.svelte`, `AccrualModal.svelte`
- [x] `SelectionMenu`, `AutocompleteMenu`
- [x] ~~`PurposeManager`~~, ~~`ParserModal`~~ — moved to `trashed/code/components/`
- [x] Navigation: bottom bar + mobile right drawer

## 3. Data & State
- [x] Stores: transactions, purposes, parties, categories, settings, recurring, ui, feedback
- [x] localStorage persistence
- [x] `ui.ts`: theme, `isCaptureInputVisible`, `isEditingTransaction`, capture open/close helpers

## 4. Pulse (Home)
- [x] Distilled layout: hero ring, details expander, recent (3), accruals
- [x] Greeting + daily status
- [x] Removed inline InputPill; global FAB only
- [ ] Processing animation polish (partial)

## 5. Stream
- [x] `/stream` page, sticky headers, filters, search
- [x] Dynamic toolbar height, flat list cards
- [x] Expand, edit, delete, settle
- [ ] Swipe-to-reveal actions
- [ ] Infinite scroll / virtualization

## 6. Intelligence & Clarification
- [x] `transactionParser.ts` + `parseMeta`
- [x] `parseConfidence.ts` (R1–R8)
- [x] `submitCapture()` / `commitParsedTransaction()`
- [x] Layout integration + review sheet
- [x] Playwright: `capture-review.test.ts`
- [ ] Voice (Web Speech API)

## 7. Insight
- [x] Story cards UI, WealthLedger
- [ ] Dynamic narratives, empty states

## 8. Settings & Management
- [x] Purposes, parties, settings, export/import, recurring, settlement
- [x] Zen + dark theme

## 9. v2 Transaction Model
- [x] transfer, prospect, accounts, status, linkedTo, passthrough fields
- [x] Summary engine (planning, loans, net position)
- [ ] Prospect promotion (stub)
- [ ] Auto-settlement prompt
- [ ] Passthrough pairs

## 10. Polishing & Shell (May 2026)
- [x] View Transitions API
- [x] Bottom nav active states, dynamic chrome height
- [x] Capture feedback: toast, highlight, haptic
- [x] Capture input auto-focus on FAB open
- [x] Mobile drawer (right slide)
- [x] Option A design tokens (hairlines, list cards, micro-labels)
- [x] 19 Playwright tests passing
- [ ] Impeccable automated polish (CLI unavailable)
- [ ] Tablet layouts, production deploy

## 11. Future: SQLite
- [ ] SQLite-Wasm + OPFS, migration, `.db` export
