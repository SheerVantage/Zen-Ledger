# Zen Ledger - Test Cases

> Automated coverage: **19 Playwright tests** in `tests/`. Manual cases below.  
> Status: **2026-05-22** — see [STATUS.md](./STATUS.md).

## 1. TC-1: NLP & Capture

| ID | Step | Input | Expected Outcome | Auto |
| :-- | :-- | :-- | :-- | :-- |
| 1.1 | Type expense | "Coffee 5" | Fast save, toast, -5 expense | ✅ `nlp.test.ts` |
| 1.2 | Type income | "Salary 2000" | Fast save, +2000 | ✅ |
| 1.3 | Missing context | "50" | Review sheet opens (R1/R3) | ✅ `capture-review.test.ts` |
| 1.4 | Ambiguity | "apple 20" | Review sheet (R8) | ✅ |
| 1.5 | Review confirm | "50" → Save | Transaction saved | ✅ |
| 1.6 | Back to edit | "50" → Back | Capture input restored + focused | ✅ |

## 2. TC-2: Pulse (Home)

| ID | Step | Condition | Expected Outcome | Auto |
| :-- | :-- | :-- | :-- | :-- |
| 2.1 | View Ring | Initial | "Safe to spend" visible | ✅ `home.test.ts` |
| 2.2 | Add expense | Coffee 50 | Toast, recent card updates | ✅ |
| 2.3 | Theme toggle | Click theme | `data-theme` zen ↔ dark | ✅ |

## 3. TC-3: Stream

| ID | Step | Action | Expected Outcome | Auto |
| :-- | :-- | :-- | :-- | :-- |
| 3.1 | Sticky headers | Scroll | Date headers visible | ✅ |
| 3.2 | Expand card | Click card | Edit / Delete visible | ✅ |
| 3.3 | Edit focus | Edit | Narration textarea focused | ✅ |
| 3.4 | FAB open during edit | Edit with sheet open | Capture sheet closes, textarea focused | ✅ |
| 3.5 | Delete | Delete + confirm | Card removed | ✅ |

## 4. TC-4: Capture input focus

| ID | Step | Action | Expected Outcome | Auto |
| :-- | :-- | :-- | :-- | :-- |
| 4.1 | Open FAB | Tap + | `#global-input-sheet` visible | ✅ |
| 4.2 | Auto-focus | After open | `[data-testid="capture-input"]` focused | ✅ `inputpill.test.ts` |
| 4.3 | Type without click | Keyboard | Text appears in capture input | ✅ |

## 5. TC-5: Insight (manual)

| ID | Step | Action | Expected Outcome |
| :-- | :-- | :-- | :-- |
| 5.1 | Swipe stories | Tap edges | Cards advance |
| 5.2 | Wealth ledger | Scroll | Party receivables/payables shown |
| 5.3 | Empty data | Fresh install | Graceful empty copy (partial) |

## 6. TC-6: Voice (not implemented)

| ID | Step | Action | Expected Outcome |
| :-- | :-- | :-- | :-- |
| 6.1 | Mic tap | Tap mic | Simulated "Coffee at Starbucks $5" only |

---

## Running tests

```sh
npm test              # all Playwright tests
npm run test:ui       # interactive UI
```
