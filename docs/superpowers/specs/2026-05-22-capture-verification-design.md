# Capture Verification & Edit Focus — Design Spec

**Date:** 2026-05-22  
**Status:** **Implemented** (May 2026)  
**Scope:** Smart-gate capture review (Option A) + TransactionCard edit + capture input auto-focus

---

## Problem

1. **Silent misparsing:** `parseTransaction()` always saves immediately. Missing amount, unknown party, and purpose fallback (Coffee id `1`) happen without user awareness.
2. **Demo-only clarification:** `ParserModal` triggers only on the keyword `"apple"` and only disambiguates purpose — not a full field review.
3. **Edit friction:** Opening edit mode on `TransactionCard` does not focus any input; mobile users must tap again before typing.

## Goals

- High-confidence captures stay one-step (FAB → saved → toast).
- Low-confidence captures open a **review sheet** showing parsed key-values; user confirms or fixes before save.
- User can **create new Party or Purpose** inline when parser found a name but no match.
- Edit mode focuses the narration field immediately on open.

## Non-goals (this iteration)

- Always-on confirmation for every capture (Option B).
- Replacing TransactionCard edit UI with the review sheet (Option C).
- ML / LLM parsing.
- Voice input changes.

---

## Recommended approach

**Approach 2: Dedicated `CaptureReviewSheet` + `assessParseConfidence()`**

| Approach | Summary | Verdict |
|----------|---------|---------|
| 1. Extend `ParserModal` | Reuse bottom sheet; add all fields | Reject — wrong shape, becomes a god-component |
| **2. New `CaptureReviewSheet`** | Parser returns result + review reasons; sheet shows structured fields | **Adopt** |
| 3. Field-only micro-prompts | Ask only for missing single field | Reject — too fragmented, hard to see full picture |

Progressive disclosure inside the sheet: show all core fields; **highlight fields that triggered review** with a soft terracotta dot or `zen-micro-label` hint.

---

## Architecture

### New modules

```
transactionParser.ts
  parseTransaction(input) → ParsedTransactionDraft (existing shape + parseMeta)

parseConfidence.ts (new)
  assessParseConfidence(input, draft) → { needsReview: boolean; reasons: ReviewReason[]; flags: FieldFlag[] }

CaptureReviewSheet.svelte (new)
  Props: draft, reasons, onConfirm(overrides), onCancel

submitTransaction.ts
  submitTransaction(text, overrides?)
    → draft = parseTransaction(text)
    → if assessParseConfidence(...).needsReview → return { status: 'review', draft, ... }
    → else addTransaction + showCaptureSuccess
```

Layout integration (`+layout.svelte`):

- Replace `needsClarification('apple')` demo gate with `submitTransaction` review status.
- When `status === 'review'`, open `CaptureReviewSheet` with pending draft; on confirm call `commitTransaction(draft, overrides)`.

### Data flow

```
User types in InputPill → Enter
  → submitTransaction(text)
      → parseTransaction
      → assessParseConfidence
      → [fast path] addTransaction → toast + highlight
      → [review path] open CaptureReviewSheet (FAB input closes)
          → user edits fields / creates party|purpose
          → Confirm → commitTransaction → toast + highlight
          → Cancel → discard draft, reopen input with original text
```

---

## Confidence gates (when `needsReview === true`)

Review if **any** condition matches:

| ID | Condition | User-facing reason |
|----|-----------|-------------------|
| R1 | No numeric amount in input | "Amount missing" |
| R2 | Parsed amount is 0 | "Amount looks like zero" |
| R3 | Purpose matched via fallback id `1` and no purpose name/alias substring in input | "Category unclear" |
| R4 | Input contains `@word` or party-like token after `@` but `partyId` empty | "Party not recognized" |
| R5 | Input contains `#word` but purpose not matched | "Purpose not recognized" |
| R6 | Multiple purpose alias matches (future: score tie) | "Multiple categories possible" |
| R7 | `categoryHint` is receivable/payable/transfer/prospect | "Complex transaction — please confirm" |
| R8 | Legacy demo: input contains `apple` (until R6 generalizes ambiguity) | "Could mean more than one thing" |

**Fast path examples (no review):**

- `Coffee 5` — amount + purpose match
- `Salary 2000` — amount + income purpose
- `Lunch @Acme 50` — when `@Acme` resolves to existing party

---

## CaptureReviewSheet UI

Bottom sheet (same anchor as `ParserModal`): solid `bg-zen-panel`, drag handle, Escape/backdrop dismiss = Cancel.

**Header**

- `zen-micro-label`: "Review before saving"
- Original sentence in quotes (preserved as `narration` default)

**Fields (key-value rows)**

| Field | Control | Notes |
|-------|---------|-------|
| Amount | number input, signed or amount + in/out toggle | Pre-filled from parser |
| Date | date input | |
| Purpose | select + "Add new…" | Emoji in options; create inline (name + account type) |
| Party | select + "Add new…" optional | Create inline (name only); alias = name |
| Account | pill chips | cash / bank / bkash / nagad |
| Status | chips if receivable/payable/prospect | completed / pending / partial |

Fields listed in `reasons` get a subtle highlight border (`zen-spend/30` or hairline-strong).

**Actions**

- Primary: **Save** (sage pill, full width)
- Secondary: **Back to edit** (returns text to InputPill, closes sheet)

**Entity creation**

- Purpose: name + account type (reuse categories list from TransactionCard)
- Party: name field → `parties.addParty({ name, aliases: [name] })` → select new id
- After create, auto-select new entity in dropdown

---

## TransactionCard edit focus (bundled fix)

When `startEdit()` sets `isEditing = true`:

1. `$effect` watches `isEditing`
2. `tick()` then `editNarrationEl?.focus()` on narration `<textarea bind:this={editNarrationEl}>`
3. On mobile, optional `scrollIntoView({ block: 'nearest' })` if clipped by bottom chrome

No focus when merely expanded (read-only detail view).

---

## Parser improvements (minimal, supports gates)

Extend `parseTransaction` return with optional `parseMeta`:

```ts
parseMeta: {
  amountFound: boolean;
  purposeMatched: boolean;  // true if name/alias hit, not fallback
  partyMatched: boolean;
  purposeMatchCount: number;
  atMention?: string;     // raw @token if present
  hashMention?: string;   // raw #token if present
}
```

Keep `narration` as user's original input unless they edit it in review sheet.

Remove hardcoded `needsClarification()` from `submitTransaction.ts`; fold `apple` into R8 inside `assessParseConfidence`.

Deprecate standalone `ParserModal` purpose-only flow → replaced by `CaptureReviewSheet` (can delete ParserModal after migration or keep as thin wrapper during transition).

---

## Error handling

- Cancel: no transaction written; restore InputPill text.
- Save with invalid amount: inline field error, block submit.
- Create party/purpose with empty name: inline validation.
- Sheet open while navigating: `onNavigate` closes sheet and cancels (same as mobile menu).

---

## Testing

| Case | Expected |
|------|----------|
| `Coffee 5` | Fast path, no sheet |
| `50` | Review — amount only, purpose unclear |
| `apple 20` | Review — ambiguity |
| `@NewShop 100 groceries` | Review — party not found; user adds party inline |
| Edit card → narration focused | textarea has document focus |
| Confirm on sheet | transaction in store, toast, highlight |

Playwright: extend `nlp.test.ts` for fast path; add `capture-review.test.ts` for review gate.

---

## Migration / rollout

1. Ship `parseMeta` + `assessParseConfidence` (no UI) with unit tests.
2. Ship `CaptureReviewSheet` + layout wiring; remove apple-only ParserModal path.
3. Ship TransactionCard focus fix (independent, can land first).
4. Tune gates based on real usage (adjust R3 fallback detection).

---

## Open questions (defaults chosen)

- **Signed amount vs toggle:** Use signed number input matching current store convention (negative = expense).
- **Narration editing in sheet:** Optional collapsed "Description" field; default hidden unless user expands.
- **R7 complex types:** Always review for transfer/receivable/payable/prospect — user can confirm quickly.
