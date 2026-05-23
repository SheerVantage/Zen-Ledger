# Zen Ledger — Project Status

**Last updated:** 2026-05-22  
**Version:** 2.0.0  
**Test suite:** 19 Playwright tests passing (`npm test`)

This document is the living record of what is shipped, what broke during development, how it was fixed, and what to do next. For product voice and design tokens see [PRODUCT.md](../PRODUCT.md) and [DESIGN.md](../DESIGN.md).

---

## Current app snapshot

Zen Ledger is a **local-first** personal finance PWA (SvelteKit 2, Svelte 5, Tailwind v4). Data persists in **localStorage**. The primary interaction is conversational capture via a bottom **FAB → InputPill** sheet, with rule-based NLP parsing and a **smart review gate** for low-confidence input.

| Route | Screen | Status |
|-------|--------|--------|
| `/` | **Pulse** | Hero StatusRing + greeting, collapsible financial details, Quick Accruals, Recent (3 items) |
| `/stream` | **Stream** | Full feed, search/filters, sticky date headers, expandable cards |
| `/insight` | **Insight** | Static story cards + Wealth Ledger |
| `/settings` | **Settings** | Profile, categories, recurring, export/import, wealth audit |
| `/purposes`, `/parties` | **Manage** | CRUD with aliases |

**App shell:** Fixed top bar (brand, title, theme, mobile menu), fixed bottom nav (Pulse, Stream, FAB, Insight, Settings), global capture sheet and review sheet.

---

## Implemented in this phase (May 2026)

### Documentation & design system
- [x] Consolidated product/design docs; obsolete material moved to [`trashed/`](../trashed/)
- [x] [PRODUCT.md](../PRODUCT.md), [DESIGN.md](../DESIGN.md), [.impeccable/design.json](../.impeccable/design.json)
- [x] **Option A** design tokens in `layout.css`: `zen-body`, `zen-muted`, hairlines, `.zen-list-card`, micro-label utilities
- [x] Custom favicon (sage leaf on oat)

### Pulse (Home) distill
- [x] Hero: greeting + daily status + compact **StatusRing** (safe to spend)
- [x] **Financial details** expander (Liquid Cash, Net Worth, Planning, Loans) — not always visible
- [x] **Range Review** link moved to Insight (removed from Pulse hero clutter)
- [x] **Recent** section: last 3 transactions only + link to Stream
- [x] Quick Accruals row (recurring templates)

### Stream
- [x] Dedicated `/stream` page with full transaction list
- [x] Search, category chips, advanced filter panel (date, party, amount)
- [x] Sticky date headers with dynamic toolbar height (`--stream-toolbar-height`)
- [x] Flat list cards (hairline, no shadow) via `.zen-list-card`

### App shell & navigation
- [x] Bottom nav: active route pill + indicator, dynamic `--bottom-chrome-height`
- [x] Mobile **right slide drawer** (not dropdown): Parties, Purposes, Settings; burger right of theme toggle
- [x] View Transitions API on route change

### Capture feedback
- [x] **Toast** ("Got it") on successful save
- [x] **Card highlight pulse** on newly saved transaction (`highlightedTransactionId`)
- [x] **Haptic** feedback where supported (`navigator.vibrate`)

### Smart capture verification (replaces demo ParserModal flow)
- [x] `parseMeta` on parser output + `assessParseConfidence()` gates **R1–R8**
- [x] `submitCapture()` → fast path save OR review path
- [x] **`CaptureReviewSheet.svelte`**: full field review, flagged fields, inline party/purpose create
- [x] Layout wired: review sheet, "Back to edit" restores capture text
- [x] **`ParserModal`** retired from capture flow (moved to `trashed/code/components/`)
- [x] Spec: [docs/superpowers/specs/2026-05-22-capture-verification-design.md](../docs/superpowers/specs/2026-05-22-capture-verification-design.md)

### Capture input focus (correct target)
- [x] **`autoFocusOnMount`** on global InputPill — `[data-testid="capture-input"]` focuses when FAB opens
- [x] Typing works immediately without clicking the field
- [x] Refocus on "Back to edit" from review sheet
- [x] Shared capture visibility in `ui.ts`: `isCaptureInputVisible`, `isEditingTransaction`

### TransactionCard edit
- [x] Inline edit with narration textarea, amount, date, purpose, party
- [x] Edit mode closes capture sheet (`beginTransactionEdit` / `endTransactionEdit`)
- [x] Auto-focus narration textarea when editing (separate from capture input)

### Tests
- [x] Playwright: capture review gates, Stream interactions, NLP, home, InputPill focus (19 tests)

### Codebase cleanup (May 2026)
- [x] Obsolete code, docs, archives moved to [`trashed/`](../trashed/) — see [`trashed/README.md`](../trashed/README.md)
- [x] Removed deprecated `needsClarification()` from `submitTransaction.ts`
- [x] Dev route `/test/inputpill` removed from active tree
- [x] Root cleanup: `conductor/`, `.openclaude/`, stale Playwright artifacts → `trashed/`; kept `tests/`, `docs/`, `.agents/skills/`

---

## Not implemented (later phases)

### Capture & intelligence
- [ ] Real **Web Speech API** voice input (mic still simulates "Coffee at Starbucks $5")
- [ ] **Auto-settlement prompt** when income/expense matches open receivable/payable
- [ ] Full **prospect promotion** flow (stub button exists)
- [ ] **Passthrough pairs** (linked earning + expense)
- [ ] **Learning** from clarification choices (persist alias preferences)
- [ ] Server-side or LLM enrichment (optional, non-goal for v2)

### Pulse
- [ ] Planning horizon toggle with confidence breakdown UI
- [ ] Adaptive budget nudges / anomaly detection

### Stream
- [ ] Swipe-to-reveal Edit/Delete
- [ ] Infinite scroll / virtualization for large ledgers
- [ ] Skeleton loading and explicit end-of-list state

### Insight
- [ ] **Data-driven stories** (currently static templates)
- [ ] Empty state copy and weekly/yearly views
- [ ] Simple category bar charts

### Platform & persistence
- [ ] **SQLite-Wasm + OPFS** migration ([Master_Prompt.md](./Master_Prompt.md))
- [ ] `.db` export/restore
- [ ] **Swiss Grid** alternate theme (only Zen + Dark today)
- [ ] Custom account types beyond cash/bank/bKash/Nagad

### Polish backlog
- [ ] Impeccable CLI polish pass (CLI broken locally — manual polish applied)
- [ ] Tablet-specific layouts per screen specs
- [ ] Production deploy pipeline

---

## Bugs encountered & fixes

### 1. Capture review bypass
**Symptom:** Low-confidence input saved silently.  
**Cause:** `submitTransaction()` called `commitParsedTransaction()` even when `submitCapture()` returned `review`.  
**Fix:** Layout uses `submitCapture()` directly; `submitTransaction()` throws if review required.

### 2. Wrong focus target (edit vs capture)
**Symptom:** User expected to type after opening FAB; focus stayed on FAB button ("Close transaction input").  
**Cause:** Misaligned requirement — auto-focus was built for TransactionCard **edit textarea**, not **capture input**. User inspects `[data-testid="capture-input"]` in `#global-input-sheet`.  
**Fix:** `autoFocusOnMount={true}` on global InputPill; mount action + `autofocus`; tests assert capture input focused.

### 3. FAB / capture input retained focus during card edit
**Symptom:** Chrome Win10 — active element remained FAB or capture `<input>` with placeholder "Dinner at Mario's $45...".  
**Cause:** `preventDefault` on Edit pointerdown blocked focus transfer; capture sheet stayed mounted during slide-out.  
**Fix:** Removed preventDefault; `beginTransactionEdit()` sets `isEditingTransaction` and closes sheet synchronously via store; blur bottom-chrome focus.

### 4. Stream sticky header overlap
**Symptom:** "YESTERDAY" header overlapped filters / first card.  
**Fix:** Dynamic `--stream-toolbar-height`, date-group spacer, sticky header CSS.

### 5. Mobile menu UX
**Symptom:** Dropdown felt wrong; burger placement awkward.  
**Fix:** Right slide drawer, translucent backdrop, `isMenuMounted`/`isMenuOpen` animation pattern, burger right of theme toggle.

### 6. Bottom nav active state
**Symptom:** No clear active route.  
**Fix:** Active pill, indicator dot, settings includes parties/purposes routes.

### 7. Tests vs review gates
**Symptom:** Tests failed after smart gate (e.g. "Lunch 50" → review).  
**Fix:** Tests use purpose-matching strings ("Coffee 50"); added `capture-review.test.ts`.

### 8. ParserModal demo only
**Symptom:** Clarification only on keyword "apple", purpose-only.  
**Fix:** Replaced by `CaptureReviewSheet` + R1–R8 confidence gates (R8 keeps "apple" ambiguity until generalized).

---

## Recommended next steps

### Priority 1 — Ship confidence
1. **Manual QA checklist** on real device: FAB open → type → Enter; ambiguous `50`, `apple 20`; review confirm/cancel; Stream edit/save.
2. **Commit** capture verification + focus + doc updates as a logical unit when ready.

### Priority 2 — Insight & data story
1. Wire **Insight story cards** to real aggregates (top categories, week spend vs budget).
2. Empty states when `< N` transactions.

### Priority 3 — Stream depth
1. **Swipe actions** on mobile (Edit/Delete).
2. **Virtualized list** if performance degrades above ~500 rows.

### Priority 4 — Persistence
1. Spike **SQLite-Wasm + OPFS** behind a feature flag.
2. Migration path from localStorage with export fallback.

### Priority 5 — Voice
1. Replace mic simulation with **Web Speech API** + permission/error UX.

### Priority 6 — Settlement intelligence
1. Prompt when parsed income matches open receivable for same party.
2. Complete prospect → expense/income promotion flow.

---

## Key files (implementation map)

| Area | Files |
|------|--------|
| Capture flow | `InputPill.svelte`, `submitTransaction.ts`, `transactionParser.ts`, `parseConfidence.ts` |
| Review UI | `CaptureReviewSheet.svelte`, `+layout.svelte` |
| Feedback | `feedback.ts`, `Toast.svelte` |
| Shell / nav | `+layout.svelte`, `layout.css` |
| Stream | `stream/+page.svelte`, `TransactionCard.svelte` |
| Pulse | `+page.svelte`, `StatusRing.svelte` |
| UI state | `stores/ui.ts` (`isCaptureInputVisible`, `isEditingTransaction`) |
| Tests | `tests/*.test.ts`, `tests/helpers.ts` |

---

## Related documents

| Document | Purpose |
|----------|---------|
| [PRODUCT.md](../PRODUCT.md) | Persona, IA, features, copy tone |
| [DESIGN.md](../DESIGN.md) | Tokens, components, do's/don'ts |
| [requirements.md](./requirements.md) | Original requirements with status |
| [tasks.md](./tasks.md) | Implementation checklist |
| [plans.md](./plans.md) | Phased roadmap |
| [test-cases.md](./test-cases.md) | Manual QA scenarios |
| [2026-05-22-capture-verification-design.md](../docs/superpowers/specs/2026-05-22-capture-verification-design.md) | Capture review spec (implemented) |
