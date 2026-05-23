# Zen Ledger - Requirements

> Status sync: **2026-05-22** — see [STATUS.md](./STATUS.md) for detailed implementation log.

## 1. Product Goal

Create a minimalistic, low-maintenance personal finance mobile application that minimizes the burden of data entry through intelligent natural language processing (text and voice input).

## 2. Core Features

### 2.1 Natural Language Processing (NLP) Input

| Requirement | Status |
|-------------|--------|
| **Text Input**: Single prominent field (e.g. "Dinner at Mario's $45") | ✅ Global FAB + InputPill, auto-focus on open |
| **Parsing**: Party, date, purpose, amount, type, account, status | ✅ `transactionParser.ts` + `parseMeta` |
| **@ / # autocomplete** | ✅ |
| **Word-selection tagging** | ✅ InputPill + TransactionCard |
| **Smart clarification** (not demo-only) | ✅ `CaptureReviewSheet` + R1–R8 confidence gates |
| **Voice Input** with auto-transcription | ❌ UI mock only (simulated) |

### 2.2 Dashboard (The Daily Pulse)

| Requirement | Status |
|-------------|--------|
| Safe-to-spend visualization (`StatusRing`) | ✅ Compact hero |
| Greeting + daily status | ✅ |
| Liquid cash, net worth, planning, loans | ✅ Collapsible "Financial details" |
| Global FAB capture (not inline on Pulse) | ✅ |
| Recent transactions | ✅ Last 3 + link to Stream |
| Search/filter on home | ➡️ Moved to **Stream** page (Pulse simplified) |

### 2.3 Transaction Management (The Stream)

| Requirement | Status |
|-------------|--------|
| Chronological card feed | ✅ `/stream` |
| Sticky date headers | ✅ |
| Search and filter | ✅ Stream toolbar + advanced panel |
| Expandable cards, inline edit, delete | ✅ |
| Selection-to-action tagging | ✅ |
| Recovered / Repaid settlement | ✅ |
| Purpose & Party aliases | ✅ |
| Entity auditing (`createdAt`, `updatedAt`) | ✅ |
| Swipe actions | ❌ Click-to-expand today |
| Infinite scroll | ❌ |

### 2.4 Analysis (The Insight)

| Requirement | Status |
|-------------|--------|
| Narrative monthly summary (stories) | ⚠️ Static templates |
| Wealth ledger breakdown | ✅ |
| Data-driven insights | ❌ |

### 2.5 Clarification System

| Requirement | Status |
|-------------|--------|
| Bottom sheet for ambiguities | ✅ `CaptureReviewSheet` (replaces demo `ParserModal` flow) |
| Full field review + inline entity create | ✅ |
| Learning from user choices | ❌ |

## 3. Technology Stack

- **Framework**: SvelteKit 2, Svelte 5
- **Styling**: Tailwind CSS v4, design tokens in `layout.css`
- **Testing**: Playwright (19 tests)
- **Design**: Responsive-first, mobile-primary

## 4. Design Tenets

- **Minimalism**, **Intuitiveness**, **Calmness**, **Efficiency** — see [PRODUCT.md](../PRODUCT.md) and [DESIGN.md](../DESIGN.md)

## 5. User Journey Highlights

1. **Entry**: Open app → tap + → type (focused) → confirm if review needed → done.
2. **Review**: Stream for full history; Pulse for snapshot.

## 6. Performance & Data Storage

| Requirement | Status |
|-------------|--------|
| localStorage persistence | ✅ |
| Pre-calculated summaries | ✅ |
| Incremental recalculation | ✅ |
| Wealth audit | ✅ |
| Profile (name, budget, currency ৳) | ✅ |
| v2 transaction model (transfer, prospect, linkedTo, accounts, status) | ✅ |
| SQLite-Wasm + OPFS | ❌ Planned |

## 7. Non-Functional (May 2026)

| Requirement | Status |
|-------------|--------|
| Capture success feedback (toast, highlight) | ✅ |
| FAB input auto-focus | ✅ |
| Mobile drawer navigation | ✅ |
| WCAG AA target | ⚠️ Ongoing (a11y warnings in svelte-check) |
