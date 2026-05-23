# Zen Ledger - Implementation Plans

> Updated: **2026-05-22** — see [STATUS.md](./STATUS.md) for current phase completion.

## 1. Architectural Strategy

SPA via SvelteKit, mobile-first, local-first localStorage (SQLite planned).

### Routes (current)
| Route | Purpose |
|-------|---------|
| `/` | Pulse — hero, details, recent |
| `/stream` | Full feed + filters |
| `/insight` | Stories + Wealth Ledger |
| `/settings` | Profile, data, recurring |
| `/purposes`, `/parties` | Entity CRUD |

### Key components
- **InputPill** — capture NLP input (global sheet)
- **CaptureReviewSheet** — low-confidence review
- **TransactionCard** — stream list item
- **StatusRing** — safe-to-spend hero
- **Toast** — capture feedback

### Stores
- Data: `transactions`, `purposes`, `parties`, `categories`, `settings`, `recurring`
- UI: `ui.ts` (theme, capture visibility, edit mode)
- Feedback: `feedback.ts` (toast, highlight)

### NLP pipeline
```
InputPill → submitCapture()
  → parseTransaction() + parseMeta
  → assessParseConfidence()
  → [fast] commit + toast + highlight
  → [review] CaptureReviewSheet → commit or Back to edit
```

---

## 2. Phase Roadmap

### Phase 1: Foundation ✅
SvelteKit, Tailwind, tokens, layout, navigation, stores, parser baseline.

### Phase 2: Core UX ✅
InputPill, StatusRing, Pulse metrics, Stream cards, settlement, themes, export/import.

### Phase 3: Stream & shell polish ✅ (May 2026)
- Dedicated Stream page with search/filters
- Pulse distill (hero + recent)
- Bottom nav polish, mobile drawer
- Design Option A tokens, list card flattening
- Capture feedback (toast, highlight, haptic)

### Phase 4: Smart capture ✅ (May 2026)
- `parseConfidence.ts`, `CaptureReviewSheet`
- Retire ParserModal demo path
- Capture input auto-focus
- Playwright coverage (19 tests)

### Phase 5: Insight & intelligence 🔜 **Next**
- Data-driven story cards
- Auto-settlement prompts
- Prospect promotion
- Voice (Web Speech API)

### Phase 6: Scale & persistence 🔜
- SQLite-Wasm + OPFS
- Stream virtualization
- Swipe actions
- Swiss Grid theme

### Phase 7: Production 🔜
- Deploy pipeline, performance audit, tablet layouts

---

## 3. Suggested improvements (backlog)

### Proactive budgeting
Moving-average spend nudges ("more coffee than usual this week").

### Contextual input
Time-of-day placeholder hints; learn common patterns.

### Visual pacing
Already using 400–600ms sheet transitions; extend haptic usage.

### Multi-theme
Zen + Dark shipped; Swiss Grid as optional Focus Mode.

---

## 4. What to do next (recommended order)

1. **Insight data wiring** — replace static stories with real aggregates.
2. **Settlement intelligence** — prompt when parsed payment matches open receivable/payable.
3. **Stream swipe actions** — mobile Edit/Delete without expand-first.
4. **SQLite spike** — OPFS persistence behind flag.
5. **Voice** — Web Speech API with permission UX.

Full rationale and bug history: [STATUS.md](./STATUS.md).
