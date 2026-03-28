This is very helpful — I can see exactly what's already built. Let me study the schema carefully before composing the prompt.

**What's already there:**
- Categories: `expense`, `earning`, `receivable`, `payable`, `recovered`, `repaid`
- Purposes (sub-types with aliases and emojis)
- Parties with aliases
- Transactions with `narration`, `amount`, `date`, `purposeId`, `partyId`
- Summaries: global balance, receivables, payables, party-wise breakdown
- NLP-style narration parsing already working
- Version 1.4.0

**Key gaps I can see:**
- No `TRANSFER`, `LOAN_GIVEN`, `LOAN_TAKEN`, `PROSPECT` categories
- No `status` field on transactions (pending/partial/completed)
- No `linkedTo` for settlements against receivables/payables
- No `account` field (cash vs bank)
- `recovered` and `repaid` are categories but should be events/sub-states on receivables/payables
- Party linkage missing on several receivable transactions (partyId is empty string)
- Currency set to `$` but user is in Bangladesh — likely a settings oversight
- `cashAtHand: -473000` suggests balance calculation may need revisiting once accounts are introduced

Let me now compose the precise modification prompt:

---

## Prompt for Your AI Agent

---

### Context

You are working on **Zen Ledger**, a personal finance app built in **SvelteKit**, currently at **version 1.4.0**. The app already has a working transaction entry system where the user types a natural-language narration which is parsed into party, purpose, amount, and date. There is a filterable transaction list and a dashboard with summary cards.

Below is the **exact current schema** extracted from a live backup. All modifications must preserve backward compatibility with existing data.

```json
Current Categories:
  expense | earning | receivable | payable | recovered | repaid

Current Transaction fields:
  id, narration, amount, date, purposeId, partyId, createdAt, updatedAt

Current Settings > summaries:
  global: { balance, receivables, payables, cashAtHand }
  partyWise: { [partyId]: { receivables, payables, balance } }
```

---

### What to Build — Incremental Enhancements

Make the following changes in order. Confirm each section before proceeding to the next.

---

#### STEP 1 — Extend the Category System

The current six categories (`expense`, `earning`, `receivable`, `payable`, `recovered`, `repaid`) need two additions and one structural clarification.

**Add these two new categories:**

```json
{
  "id": "transfer",
  "name": "Transfer",
  "emoji": "🔄",
  "description": "Money moved between your own accounts",
  "direction": "neutral"
},
{
  "id": "prospect",
  "name": "Prospect",
  "emoji": "🔭",
  "description": "Planned or expected future transaction",
  "direction": "neutral"
}
```

**Clarify `recovered` and `repaid`:** These should no longer be standalone categories a user picks from scratch. They are settlement events triggered when the user settles an existing `receivable` or `payable`. Existing records tagged `recovered`/`repaid` must be preserved as-is, but the UI should guide new settlements through the linking flow described in Step 3.

---

#### STEP 2 — Extend the Transaction Schema

Add the following optional fields to every transaction record. All are optional so existing records remain valid without migration:

```
account        : string   — "cash" | "bank" | "bkash" | "nagad" | user-defined
                            Default: "cash". Hidden/irrelevant for receivable, payable, prospect.

toAccount      : string   — Only for category = "transfer". Destination account.

status         : string   — "completed" | "pending" | "partial"
                            Default: "completed" for expense/earning/transfer
                            Default: "pending" for receivable/payable/prospect

linkedTo       : string   — Transaction ID of a parent receivable, payable, or loan
                            Set when this transaction settles or partially settles another

isPassthrough  : boolean  — true when money was received on behalf of someone else
                            and disbursed to a third party (net-zero pair)
                            Default: false

prospectType   : string   — Only when category = "prospect"
                            One of: "expected_income" | "expected_expense" |
                            "pipeline" | "possible_repayment" | "plan"

confidence     : string   — Only when category = "prospect"
                            One of: "high" | "medium" | "low"
                            Default: "medium"

expectedDate   : string   — ISO date. For future-dated receivables, payables, prospects.
```

**Update the summary recalculation logic** to account for the new fields:
- `transfer` transactions must never appear in income or expense totals
- `prospect` transactions must be tallied separately — never mixed into confirmed totals
- `status: "partial"` on a receivable/payable means the remainder is still outstanding; outstanding = original amount minus sum of all linked settlement amounts
- `cashAtHand` should be renamed to `netPosition` in new calculations (keep `cashAtHand` for backward compat)

---

#### STEP 3 — Settlement Flow (Linking Transactions)

When the user records a new `earning` or `expense` transaction, check if there are open `receivable` or `payable` records for the same party. If yes, offer a prompt:

> "This looks like a payment from [Party]. Do you want to record it against an open receivable?"

If the user confirms:
- Set `linkedTo` on the new transaction pointing to the parent receivable/payable ID
- Set the new transaction's category to `recovered` (if settling a receivable) or `repaid` (if settling a payable)
- Recalculate the parent record's outstanding balance: `outstanding = original - Σ(linked settlement amounts)`
- If outstanding reaches 0, set parent status to `"completed"`; otherwise set to `"partial"`
- Show the outstanding balance on the parent record in the transaction list

This must also work when the user explicitly picks "Settle a receivable / payable" as their intent in the narration (e.g. *"received 15000 from Client AA against invoice"*).

---

#### STEP 4 — Account Field in UI

Add an **account selector** to the transaction entry form. This appears below the narration input after parsing:

- Show pill-style selector: **Cash · Bank · bKash · Nagad** (+ user can add custom accounts in Settings)
- Default to **Cash**
- For `receivable`, `payable`, `prospect`: hide the account selector entirely (no cash has moved)
- For `transfer`: show **From** and **To** account selectors

The narration parser should also attempt to detect account mentions:
- "deposited in bank", "sent via bKash", "withdrew from ATM" → set account accordingly

---

#### STEP 5 — Prospect Recording

Add `prospect` as a selectable category. When selected, show:

1. **Prospect type** selector (pills): Expected Income · Expected Expense · Pipeline · Possible Repayment · Plan
2. **Confidence** selector: High · Medium · Low
3. **Expected date** field (date picker, optional)
4. Account field is hidden

Prospects must be **promotable**: add a "Confirm" action on any prospect record that lets the user convert it into a real `receivable`, `payable`, `earning`, or `expense`. On promotion:
- Create a new transaction of the target category, pre-filled with the prospect's data
- Set the prospect's status to `"completed"` and link it to the new record via `linkedTo`
- Archive the prospect (hide from active lists, visible in history)

---

#### STEP 6 — Dashboard Updates

Update the dashboard summary cards as follows. **Do not remove existing cards** — extend them.

**Existing cards to update:**
- **Balance** — remains, but clarify it reflects completed income minus completed expenses (exclude transfers, prospects, neutral accruals)
- **Receivables** — show total outstanding (after partial settlements), not raw sum
- **Payables** — same, outstanding only

**Add new summary band — "Planning Horizon"** (visually separated from confirmed figures, toggleable with a single toggle):
- Expected Inflows (sum of `prospect` records with `prospectType: expected_income | pipeline | possible_repayment`)
- Expected Outflows (sum of `prospect` records with `prospectType: expected_expense | plan`)
- Broken down by confidence: High / Medium / Low
- Clearly labelled as *not confirmed* — use muted colors, dashed borders, or italic labels to distinguish from real totals

**Add Loans summary card** (once loan categories are in use):
- Total loaned out (outstanding)
- Total borrowed (outstanding)

---

#### STEP 7 — Narration Parser Enhancements

The existing parser handles: party, purpose, amount, date. Extend it to also detect:

| Pattern in narration | Inferred field |
|---|---|
| "pending", "accrued", "due", "to be paid" | `status: "pending"` |
| "advance", "deposit to bank", "cheque deposited" | category hints |
| "partial", "partial payment" | `status: "partial"` |
| "via bKash", "sent bKash", "nagad", "bank transfer" | `account` |
| "loan to", "lent", "gave as loan" | category: `receivable` (loan given) |
| "borrowed", "loan from", "took loan" | category: `earning` + flag as liability |
| "Zakat", "zakat", "sadaqah", "charity" | tag: `zakat` or `charity` |
| "against invoice", "against receivable" | trigger settlement flow |
| "passthrough", "on behalf of", "to give away" | `isPassthrough: true` |

---

#### STEP 8 — Data Integrity & Fixes

Fix the following issues found in the current backup:

1. **Missing partyId on receivables** — transactions `kn5960f`, `q02673o`, `653dvne`, `33qcrtp`, `lo9kdra` have `partyId: ""`. The party names are in the narration. Either parse and link them to existing party records, or flag them in the UI as "party unlinked — tap to assign".

2. **Currency setting** — currently set to `"$"` but the user is in Bangladesh and all amounts are in Taka. Update the default currency to `"৳"` (BDT). Make this user-editable in Settings.

3. **`cashAtHand: -473000`** — this negative value likely results from receivables being counted as outflows. Once the new status-aware outstanding calculation is in place, recalculate and verify this figure reflects true net position.

4. **`recovered` and `repaid` purposes** — purposes with id `7` ("Recovered") and `8` ("Repaid") exist. These should be migrated to be used only as settlement-linked transaction categories, not free-standing purposes. Do not delete them — deprecate from the "new purpose" picker.

---

#### Backward Compatibility Rules

- All existing transactions remain valid. New fields are additive and optional.
- Existing category IDs (`expense`, `earning`, `receivable`, `payable`, `recovered`, `repaid`) are unchanged.
- Existing purpose and party records are unchanged.
- Summary recalculation must produce the same results as before for existing records that have no new fields set.
- Version should be bumped to `2.0.0` once all steps are complete.

---

#### Reference Test Cases

After implementation, the following transactions must all be recordable correctly:

| Narration (as user would type) | Expected parse result |
|---|---|
| "Bought vegetables 1000 taka" | expense, cash, completed |
| "Invoice raised to Client AA 50000 taka" | receivable, pending, party: Client AA |
| "Received house rent 10000 taka from tenant" | earning, cash, completed |
| "Received 15000 from Client AA against invoice" | recovered, cash, linkedTo: Client AA receivable |
| "Bua's salary 6000 taka accrued" | payable, pending, party: Bua |
| "Gave Omuk 5000 taka as loan" | receivable (loan), cash, completed |
| "Omuk repaid 3000 taka" | recovered, partial, linkedTo: Omuk loan |
| "Cheque 100000 deposited in bank" | transfer, from: cash, to: bank |
| "Zakat accrued 30000 taka" | payable, pending, tag: zakat |
| "Gave 10000 as Zakat" | repaid, cash, linkedTo: Zakat payable |
| "Received 5000 from relative to give to charity, gave away" | earning + expense, isPassthrough: true |
| "Expected project from new client 80000 taka" | prospect, expected_income, confidence: medium |

---

*Work through Steps 1–4 first and confirm before proceeding to Steps 5–8. Preserve all existing data and functionality throughout.*