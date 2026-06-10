# Plan: Impeccable Evaluation (Whole App)

**Date:** 2026-06-09
**Goal:** Systematically evaluate and refine the UI/UX of Zen Ledger after multi-device sync implementation

---

## Context

Recent changes to the app:
- Added AuthModal (email + Google sign-in)
- Added SyncButton (manual sync to Supabase)
- Added sign-out to mobile drawer
- Migrated stores from localStorage to IndexedDB (Dexie.js)
- Modified layout header with new components

User has tested the app and found UI/UX issues but hasn't shared them yet. Goal is for Impeccable to discover these issues independently.

---

## Execution Plan

### Step 1: `critique` - UX Design Review

**Target:** Whole app (all routes and components)

**What it does:**
- Heuristic UX evaluation against design principles
- Identifies usability issues, cognitive load problems, workflow friction
- Scores each issue by severity
- Checks against PRODUCT.md design principles (calm, soft, effortless)

**Routes to evaluate:**
- `/` (Pulse) - Dashboard with StatusRing, financial details
- `/stream` - Transaction feed with search/filters
- `/insight` - Story cards + WealthLedger
- `/settings` - Profile, categories, export/import
- `/purposes` - Purpose CRUD
- `/parties` - Party CRUD

**Components to evaluate:**
- AuthModal (new)
- SyncButton (new)
- InputPill (capture flow)
- CaptureReviewSheet
- TransactionCard
- StatusRing
- WealthLedger
- Bottom nav + FAB
- Mobile drawer (modified)

**Output:** List of UX issues with severity ratings

---

### Step 2: `audit` - Technical Quality Checks

**Target:** Whole app

**What it does:**
- Accessibility (WCAG AA compliance)
- Performance (rendering, bundle, lazy loading)
- Responsive behavior (mobile-first, one-handed use)
- Code quality (consistency, patterns)

**Specific checks:**
- Contrast ratios (zen-sage on zen-oat, etc.)
- Touch targets (48px+ for mobile)
- Keyboard navigation
- Screen reader support
- ARIA labels on icon-only buttons
- View transitions
- Reduced motion support
- Bundle size impact from Dexie.js + Supabase

**Output:** Technical issues with fix recommendations

---

### Step 3: `polish` - Final Quality Pass

**Target:** All issues found in critique + audit

**What it does:**
- Fix the issues identified in steps 1 and 2
- Ensure consistency across components
- Final visual refinement
- Ship-ready quality

**Actions:**
- Apply fixes from critique (UX issues)
- Apply fixes from audit (technical issues)
- Verify consistency (same button shapes, same form controls)
- Check edge cases (empty states, error states, loading states)

**Output:** Updated code with all fixes applied

---

## Files Likely to be Modified

| File | Reason |
|------|--------|
| `src/lib/components/AuthModal.svelte` | New component, needs polish |
| `src/lib/components/SyncButton.svelte` | New component, needs polish |
| `src/routes/+layout.svelte` | Modified header, mobile drawer |
| `src/lib/components/TransactionCard.svelte` | Core component, may need fixes |
| `src/lib/components/InputPill.svelte` | Core capture flow |
| `src/routes/+page.svelte` | Pulse dashboard |
| `src/routes/stream/+page.svelte` | Stream page |
| `src/routes/insight/+page.svelte` | Insight page |
| `src/lib/assets/icons.json` | May need new icons |

---

## Success Criteria

- [ ] All UX issues from critique are addressed
- [ ] All technical issues from audit are addressed
- [ ] App passes WCAG AA contrast checks
- [ ] All touch targets are 48px+
- [ ] Consistent component vocabulary across all screens
- [ ] No regressions in existing functionality
- [ ] TypeScript compiles with minimal errors
- [ ] App feels "calm, soft, effortless" per design principles

---

## Estimated Time

- Step 1 (critique): 5-10 minutes
- Step 2 (audit): 5-10 minutes
- Step 3 (polish): 15-30 minutes (depending on issues found)
- **Total:** 25-50 minutes

---

## Notes

- Impeccable operates in plan mode during evaluation (read-only)
- During polish phase, it will make edits to fix issues
- Each step builds on the previous one
- User should test after polish to verify fixes
