# Product

## Register

product

## Users

**Primary persona: The Calm Seeker**

Busy individuals who find traditional finance apps overwhelming. They want to track money without spreadsheet anxiety, judgmental red numbers, or rigid grids. Many use mobile-first, one-handed, in short bursts: after a purchase, during a commute, or at end of day.

**Context of use:** Quick capture while walking, brief evening review, weekly reflection. Privacy matters: data stays local in the browser (localStorage today; SQLite planned).

**Job to be done:** Turn a plain sentence like "Coffee $4" or "Received 15000 from Client AA against invoice" into structured financial clarity in under 10 seconds, then feel reassured about where they stand.

## Product Purpose

Zen Ledger is a personal finance app that replaces complex forms with conversational input. Natural language (text, eventually voice) parses into party, purpose, amount, date, account, and category. The app surfaces liquid cash, net worth, receivables, payables, planning horizon, and loans without spreadsheet trauma.

**Success looks like:** Logging a transaction feels effortless; reviewing history feels calm; ambiguous input gets resolved gently; summaries stay accurate without manual recalculation.

**Stack:** SvelteKit 2, Svelte 5, Tailwind CSS v4, local-first localStorage stores. Version 2.1.0.

**Living status:** See [Documents/STATUS.md](./Documents/STATUS.md) for implementation log, bugs fixed, and next steps.

## Brand Personality

**Three words:** Soft, Reassuring, Effortless.

**Voice:** Friendly sentences, not banking jargon. Never blame. Opportunities to adjust, not debt shaming. Conversational insights over dense charts.

**Emotional goal:** Lower heart rate. Financial clarity without anxiety.

**References (feel, not copy):** Headspace (calm mood), Amie (natural language input), weather apps (focused, readable data).

## Anti-references

- Generic fintech dashboards: navy and gold, hero metric templates, gradient accent numbers.
- SaaS landing-page clichés: identical icon + heading + text card grids, side-stripe alert borders.
- Spreadsheet trauma: rigid grids, jarring red for debt, dense tables as the default view.
- Crypto/neon dark mode: purple gradients, glassmorphism as decoration, neon accents.
- Swiss Grid rigid density (planned as alternate theme, not the default Zen experience).
- Modal-first workflows when inline or bottom-sheet alternatives exist.
- Lucide or external icon packages (project uses custom `Icon.svelte` + `icons.json` only).

## Design Principles

1. **Frictionless capture first.** The input pill is the product's heartbeat. Every screen should support or defer to quick entry, not compete with it.
2. **Calm over alarm.** Spending and debt use terracotta and sage, not punitive red. Empty and error states invite, they do not scold.
3. **Sentences over spreadsheets.** Summaries read as friendly narrative; metrics support the story, they do not replace it.
4. **Progressive disclosure.** Complex fields (account, transfer, prospect type) appear only when the parser detects them. Do not front-load forms.
5. **Local-first trust.** Export, import, and future `.db` backup must feel reliable. No dark patterns around data ownership.
6. **One-handed mobile.** Bottom-weighted input, thumb-reachable nav, sticky headers, generous tap targets (48px+).

## Accessibility & Inclusion

- Target **WCAG AA** for text contrast (dark theme tokens were tuned for this).
- Respect `prefers-reduced-motion` for view transitions and decorative animations.
- All interactive controls need visible focus and `aria-label` on icon-only buttons.
- Tabular numbers (`tabular-nums`) for currency alignment.
- Default currency **৳** (BDT); amounts must remain readable at large values (e.g. 473000).
- Voice input must degrade gracefully when mic permission is denied (planned).

---

## Information Architecture

| Route | Screen | Role |
|-------|--------|------|
| `/` | **Pulse** | Greeting, StatusRing hero, collapsible financial details, Quick Accruals, Recent (3) + link to Stream |
| `/stream` | **Stream** | Full chronological feed, search/filters, sticky date headers, expandable cards |
| `/insight` | **Insight** | Tap-through story cards + Wealth Ledger breakdown |
| `/settings` | **Settings** | Profile, categories, recurring templates, export/import, wealth audit |
| `/purposes` | **Purposes** | Purpose CRUD with aliases and account types |
| `/parties` | **Parties** | Party CRUD with aliases |

**App shell:** Fixed top bar (brand, page title, theme toggle, mobile drawer trigger), fixed bottom nav (Pulse, Stream, FAB, Insight, Settings), global capture sheet + capture review sheet.

**Input surfaces:**
- **Global FAB** in layout: toggles `#global-input-sheet` with `InputPill` (`data-testid="capture-input"`). Auto-focuses on open.
- **CaptureReviewSheet:** Bottom sheet when parser confidence is low; confirm or "Back to edit".
- **TransactionCard inline edit:** Expand card → Edit → narration textarea and fields (closes capture sheet while editing).

---

## Implemented Features (v2.1.0 — June 2026)

### Capture & parsing
- Natural language text input via `InputPill.svelte` with **auto-focus** when FAB sheet opens
- Rule-based parser with **`parseMeta`**: amount, relative date, party/purpose alias match, account, status, category hints
- **`assessParseConfidence()`** gates R1–R8; **`submitCapture()`** fast path vs review path
- **`CaptureReviewSheet`**: full field review, flagged fields, inline party/purpose create, "Back to edit" (fully implemented)
- `@` party and `#` purpose autocomplete; word-selection tagging on InputPill and TransactionCard
- Account selector, transfer from/to, prospect type and confidence when parser detects complex types
- Success **toast**, **card highlight pulse**, **haptic** on save
- ~~Demo `ParserModal` ("apple" keyword)~~ **retired** from capture flow

### Dashboard (Pulse)
- Greeting + daily status sentence
- **StatusRing** (compact): safe-to-spend vs daily budget
- **Financial details** expander: Liquid Cash, Net Worth, Planning, Loans
- Quick Accruals from recurring templates
- **Recent** (3 transactions) + "View all in Stream"
- Range review link → Insight

### Stream
- Dedicated page with search, category chips, advanced filters (date, party, amount)
- Date-grouped list with sticky headers and dynamic toolbar height
- `TransactionCard`: expand, inline edit, delete, settle, word-selection tagging
- Flat `.zen-list-card` styling (hairline borders)

### Insight
- Static story cards (tap left/right)
- `WealthLedger`: party-wise receivables, payables, cash at hand

### Settings & data
- Profile, categories, recurring + `AccrualModal`, JSON export/import, wealth audit
- Zen light + dark theme
- Settlement creates linked recovered/repaid transaction with `linkedTo`

### App shell
- Bottom nav active states, dynamic bottom chrome height
- Mobile right slide drawer (Parties, Purposes, Settings)
- View Transitions API on navigation
- 19 Playwright tests

---

## Planned / Later Phases

### Capture & intelligence
- [ ] Real voice input (Web Speech API; mic currently simulates)
- [ ] Auto-settlement prompt when earning/expense matches open receivable/payable
- [ ] Prospect promotion flow (confirm → real transaction)
- [ ] Passthrough pairs (linked earning + expense)
- [ ] Parser learning from user clarification choices
- [ ] Dynamic Insight narratives from real data

### Pulse
- [ ] Planning horizon toggle with confidence breakdown
- [ ] Adaptive budget nudges

### Stream
- [ ] Swipe-to-reveal Edit/Delete
- [ ] Infinite scroll / virtualization
- [ ] Skeleton loading and end-of-list state

### Insight
- [ ] Data-driven stories replacing static templates
- [ ] Empty state: "Gathering wisdom..."
- [ ] Weekly/yearly reflection views

### Platform
- [ ] SQLite-Wasm + OPFS persistence
- [ ] `.db` export/restore
- [ ] Swiss Grid alternate theme
- [ ] Custom account types in Settings

---

## Key User Flows

### Quick add (happy path)
1. User taps **+** FAB → capture input auto-focuses.
2. Enters "Coffee 5" → high confidence → saves immediately.
3. Toast "Got it", new card highlights on Pulse/Stream, input clears, sheet closes.

### Resolve ambiguity (review path)
1. User enters "50" or "apple 20" → review sheet opens, capture sheet closes.
2. User confirms or edits fields → Save transaction.
3. Or **Back to edit** → sheet reopens with original text refocused.

### Settle receivable/payable — loans given/taken, advances, accruals, deferred
1. User expands receivable or payable card in Stream → Settle.
2. Linked recovered/repaid transaction created; parent status updates.

### Edit existing transaction
1. User expands card → Edit (capture sheet closes if open).
2. Edit narration/amount/date/purpose/party → Save or Cancel.

---

## Copy & Tone Guidelines

- Headings: short, warm ("Recent", "Planning").
- Labels: uppercase micro-labels with wide tracking for metric categories.
- Errors: gentle questions, not "Invalid input".
- Empty states: italic, low opacity, inviting.
- Never use em dashes in UI copy.
- Currency: respect user setting; default ৳ with `formatAmountShort` for large numbers.
