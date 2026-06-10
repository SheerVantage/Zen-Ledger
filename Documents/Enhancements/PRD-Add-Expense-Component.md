By Gedget.app
Chrome: https://expense-minder.gadget.app/edit/development/preview

# PRD — Add New Expense Component

## 1. Overview

The **Add New Expense** feature is the primary entry point of ExpenseMinder. It provides a natural language expense entry interface that lets users type a plain English sentence and have it parsed and saved into a structured expense record. There are no forms, no dropdowns, no date pickers — just a single textarea. The user describes what they spent (or received), and the system figures out the amount, date, party, and category automatically.

---

## 2. Goals & Design Philosophy

- **Capture expense data at the speed of thought** — the user should never have to slow down to fill in fields
- **Zero friction** — no required fields, no form widgets — just a single textarea
- **Self-teaching interface** — example prompts show users exactly what kinds of inputs work without any documentation
- **Autocomplete assists without interrupting** — chips appear below the textarea only when relevant, never overlaying the text
- **Inline confirmation** — the success card shows the parsed result so the user can verify the system understood their input correctly
- **Design philosophy** — this should feel more like sending a message than filling out a form

---

## 3. Scope

### In Scope
- Natural language parsing (NLP) of plain English expense descriptions
- Autocomplete chip system for dates, parties, and purposes
- Success confirmation card displaying the parsed expense fields
- Example prompts card with clickable entries that populate the textarea
- Toast notifications for success, empty input, and API errors
- Upsert behavior for parties and purposes (auto-create if not found)

### Out of Scope
- Authentication or user sessions
- Editing an existing expense from this screen
- Currency conversion between different currencies
- External AI APIs (e.g. OpenAI) — parsing is regex/keyword-based only
- Multi-expense entry in a single input
- Expense deletion or undo from this screen (noted as future enhancement)

---

## 4. Data Schema

### 4.1 `expense` Model

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (auto) | — | Auto-generated primary key |
| `amount` | number (2 decimals) | **Yes** | Parsed from input |
| `date` | dateTime (with time) | **Yes** | Parsed from input or defaults to now |
| `details` | string | No | Stores the full raw input text verbatim |
| `party` | belongsTo `party` | **Yes** | Resolved or auto-created during submission |
| `purpose` | belongsTo `purpose` | **Yes** | Resolved or auto-created during submission |
| `createdAt` | dateTime | — | Auto-managed by Gadget |
| `updatedAt` | dateTime | — | Auto-managed by Gadget |

### 4.2 `party` Model

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (auto) | — | Auto-generated primary key |
| `name` | string | **Yes** | Party name (person or organization) |
| `type` | enum | **Yes** | One of: `individual`, `organization` |
| `expenses` | hasMany `expense` | — | Reverse relation |

### 4.3 `purpose` Model

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string (auto) | — | Auto-generated primary key |
| `name` | string | **Yes** | Category name (e.g. `food`, `rent`) |
| `type` | enum | **Yes** | One of: `income`, `expense` |
| `defaultParty` | belongsTo `party` | No | Optional default party for this purpose |
| `expenses` | hasMany `expense` | — | Reverse relation |

### 4.4 Key Schema Design Decisions

- **`details` stores raw input verbatim** — the original intent is never lost and can be used for re-parsing or display in future versions
- **Parties and purposes are shared lookup tables** — the component auto-creates them if they don't exist (upsert pattern), so the user never has to pre-configure categories before their first use
- **`party` defaults to `"Self"`** — when no party can be extracted from the input text, the expense is attributed to the user themselves
- **`purpose` defaults to `"miscellaneous"`** — when no keyword match is found in the input text, the catch-all category is used

---

## 5. Backend Architecture

### 5.1 Global Action: `parseExpense`

**File:** `api/actions/parseExpense.ts`  
**Accepts:** `input: string`  
**Returns:** `{ amount, date, purposeName, partyName, details, transactionType }` (with `returnType: true`)  
**DB writes:** None — this is a pure parsing function

#### Amount Parsing

- **Regex:** `/(?:bdt|taka|tk|৳)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i`
- Strips commas from thousands separators (e.g. `3,200` → `3200`)
- Parses the result as a float
- Returns `0` if no numeric match is found in the input

#### Date Parsing (Priority Order)

1. Keyword **`today`** anywhere in the input → current date/time (`new Date()`)
2. Keyword **`yesterday`** anywhere in the input → current date minus 1 day
3. Pattern **`last [weekday]`** (e.g. `last monday`, `last friday`) → calculates the most recent past occurrence of the named weekday using day-of-week arithmetic: `daysBack = currentDay - targetDay`; if `daysBack ≤ 0`, adds `7` to get the previous week
4. Pattern **`[Month] [DD]`** or **`[DD] [Month]`** (e.g. `January 02`, `02 January`) → constructs a date in the current year; if that date is in the future, rolls back to the previous year
5. **Default:** current date/time (`new Date()`)

#### Purpose Parsing

A prioritized keyword lookup table. The first matching group wins (case-insensitive):

| Trigger Keywords | Resolved Purpose Name |
|---|---|
| utility, utilities, electric, electricity, water, gas | `utility bills` |
| vegetable, vegetables, grocery, groceries | `vegetables` |
| conveyance, transport, taxi, bus, rickshaw, uber | `conveyance` |
| stationary, stationery, pen, paper, notebook | `stationary` |
| food, lunch, dinner, breakfast, meal | `food` |
| medical, medicine, doctor, hospital | `medical` |
| rent, house | `rent` |
| entertainment, movie, cinema | `entertainment` |
| *(no match)* | `miscellaneous` |

#### Party Parsing (Priority Order)

1. **Title pattern:** `/(?:Mr\.?|Mrs\.?|Ms\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/ ` — captures the full title + name (e.g. `Mr Omuk`, `Mrs Smith`)
2. **Preposition pattern:** `/(?:to|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/ ` — captures the capitalized name following the word `to` or `from`
3. **Default:** `null` — resolved to `"Self"` by the downstream `createExpenseFromText` action

#### Transaction Type Detection

Keyword-based detection, case-insensitive:

| Keywords | Transaction Type |
|---|---|
| received, receive, got, income | `income` |
| lent, lend, gave loan | `lent` |
| borrowed, borrow, took loan | `borrowed` |
| paid, pay, spent, expense | `expense` |
| *(no match)* | `expense` (default) |

> **Note:** `transactionType` is parsed and returned as part of the action result but is **not yet stored** on the `expense` model. It is available for future use.

---

### 5.2 Global Action: `createExpenseFromText`

**File:** `api/actions/createExpenseFromText.ts`  
**Accepts:** `input: string`  
**Returns:** Full expense record with nested `party` and `purpose` (with `returnType: true`)

#### Step-by-Step Orchestration

1. **Parse input** — Call `api.parseExpense({ input: params.input })` to receive the structured parse result: `{ amount, date, purposeName, partyName, details, transactionType }`

2. **Purpose upsert** — Call `api.purpose.maybeFindFirst({ filter: { name: { equals: parsed.purposeName } } })`. If the result is `null`, call `api.purpose.create({ name: parsed.purposeName, type: "expense" })` to create the category on the fly.

3. **Party upsert** — Resolve party name as `parsed.partyName || "Self"`. Call `api.party.maybeFindFirst({ filter: { name: { equals: partyName } } })`. If the result is `null`, call `api.party.create({ name: partyName, type: "individual" })`.

4. **Expense creation** — Call `api.expense.create({ amount, date, details: parsed.details || params.input, party: { _link: party.id }, purpose: { _link: purpose.id } })`. The `{ _link: id }` syntax is required for `belongsTo` relationship fields.

5. **Return** the created expense with a `select` that includes: `id, amount, date, details, party { id, name, type }, purpose { id, name, type }`

> The two `maybeFindFirst` + `create` sequences are intentional upsert patterns. They ensure the lookup tables (parties, purposes) grow organically as the user enters expenses, without requiring any pre-setup or configuration.

---

## 6. Frontend Architecture

**File:** `web/routes/_public._index.tsx`  
**Route:** `/`  
**Framework:** React Router v7 (framework mode, SSR)  
**Data fetching strategy:** All data fetched client-side — no SSR loader needed

### 6.1 State

| State Variable | Type | Purpose |
|---|---|---|
| `input` | `string` | Current textarea value |
| `cursorPosition` | `number` | Current cursor index within `input` (tracks `selectionStart`) |
| `suggestions` | `Suggestion[]` | Active autocomplete chips to display below the textarea |
| `lastCreatedExpense` | `any` | Holds the last successfully created expense for the confirmation card |

### 6.2 API Hooks

- **`useGlobalAction(api.createExpenseFromText)`** — submission handler; destructures as `[{ data, fetching, error }, createExpense]`
- **`useFindMany(api.purpose, { select: { id: true, name: true } })`** — loads all purposes once on mount for client-side autocomplete matching
- **`useFindMany(api.party, { select: { id: true, name: true } })`** — loads all parties once on mount for client-side autocomplete matching

> Purposes and parties are loaded once on mount and matched entirely client-side. No debounced search requests are made during typing.

### 6.3 Cursor Tracking

The textarea tracks cursor position via four events simultaneously:

| Event | Role |
|---|---|
| `onChange` | Updates `input` value AND `selectionStart` |
| `onSelect` | Updates `selectionStart` (handles arrow key navigation) |
| `onClick` | Updates `selectionStart` (handles mouse click repositioning) |
| `onKeyUp` | Updates `selectionStart` (handles keyboard navigation) |

This multi-event approach ensures `cursorPosition` is always in sync regardless of how the user moves within the text.

### 6.4 Word Extraction Algorithm

**Function:** `extractCurrentWord(text: string, cursorPos: number): string`

1. Split `text` at `cursorPos` into `beforeCursor = text.substring(0, cursorPos)` and `afterCursor = text.substring(cursorPos)`
2. Find word start: `beforeCursor.search(/\S+$/)` — index of the last run of non-whitespace characters before the cursor
3. Find word end: `afterCursor.search(/\s/)` — index of the first whitespace character after the cursor
4. If no word start is found (result is `-1`), use `cursorPos` as the start index
5. If no word end is found (result is `-1`), use `afterCursor.length` to extend to the end of the string
6. Return `text.substring(start, end).trim()`

This correctly extracts the word the cursor is currently inside, even when the cursor is in the middle of the word.

### 6.5 Suggestion Generation Algorithm

**Function:** `getSuggestions(word: string): Suggestion[]`

#### Guard Conditions (return empty array immediately)
- `word` is empty or has fewer than 2 characters
- `word` matches `/^\d+$/` — pure numbers never trigger suggestions (amounts are not autocompleted)

#### Suggestion Priority Order

**Priority 1 — Date suggestions** (checked first):
- **Trigger fragments:** `tod`, `yest`, `last`, `sun`, `mon`, `tue`, `wed`, `thu`, `fri`, `sat`
- **Candidate pool:** `["today", "yesterday", "last sunday", "last monday", "last tuesday", "last wednesday", "last thursday", "last friday", "last saturday"]`
- **Filter:** candidates whose text `startsWith(lowerWord)`
- **Chip type:** `"date"` → rendered as blue chips

**Priority 2 — Party suggestions** (checked second, only if no date suggestions):
- **Triggers:** current word starts with `mr` or `mrs`, OR the word immediately before the cursor is `to` or `from`
- **`beforeWord` derivation:** `input.substring(0, cursorPosition).trim().split(/\s+/).slice(-2, -1)[0]`
- **Candidates:** all loaded parties where `party.name.toLowerCase().includes(lowerWord)`, capped at 5
- **Chip type:** `"party"` → rendered as green chips

**Priority 3 — Purpose suggestions** (fallback — only shown if no date or party suggestions were found):
- **Candidates:** all loaded purposes where `purpose.name.toLowerCase().includes(lowerWord)`, capped at 5
- **Chip type:** `"purpose"` → rendered as purple chips

**Global cap:** Total suggestions across all types are capped at 5.

### 6.6 Suggestion Application Algorithm

**Function:** `applySuggestion(suggestionText: string)`

1. Re-run `extractCurrentWord` using the current `input` and `cursorPosition` to get the word's `start` and `end` indices
2. Build the new input string: `newInput = input.substring(0, start) + suggestionText + input.substring(end)`
3. Calculate the new cursor position: `newCursorPos = start + suggestionText.length`
4. Update `input` state with `newInput` and clear `suggestions` to `[]`
5. In a `setTimeout(() => {}, 0)` (deferred to next render tick): focus the textarea ref and call `setSelectionRange(newCursorPos, newCursorPos)` to place the cursor immediately after the inserted text

> The `setTimeout` deferral is critical — it ensures the DOM has re-rendered with the new textarea value before the cursor position is programmatically set. Without it, `setSelectionRange` may operate on stale DOM state.

### 6.7 Form Submission

1. Call `event.preventDefault()` to prevent native form submission
2. **Guard:** if `input.trim()` is empty, call `toast.error("Please enter an expense description")` and return immediately — no API call is made
3. Call `createExpense({ input: input.trim() })`
4. **On success:** call `toast.success("Expense created successfully!")`, set `lastCreatedExpense` to the returned data object, clear `input` to `""`, and clear `suggestions` to `[]`
5. **On error:** call `toast.error(\`Failed to create expense: ${result.error.message}\`)`
6. The submit button is disabled while `fetching === true` OR while `input.trim() === ""`

---

## 7. UI/UX Specification

### 7.1 Page Layout

- **Background:** `bg-gradient-to-b from-background to-muted/20` (full page gradient)
- **Content column:** `max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8` (centered, responsive padding)
- **Vertical flow (top to bottom):**
  1. Page Header
  2. Main Input Card
  3. Confirmation Card *(conditional — only after a successful submission)*
  4. Example Prompts Card
  5. Help Text Footer

### 7.2 Page Header

- **App name:** `text-4xl font-bold` with gradient text: `bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent`
- **Subtitle:** `text-muted-foreground text-lg`, centered
- **Spacing:** `mb-8` below the header block

### 7.3 Main Input Card

- **Card:** Shadcn `<Card>` with `shadow-lg mb-6`
- **`<CardHeader>`:** Title "Add New Expense" (`text-2xl`), description "Describe your expense in plain language and we'll handle the rest"
- **`<CardContent>`:**
  - **`<Textarea>`:** `min-h-[120px] text-lg resize-none`, placeholder `"e.g., paid electricity bill 1500 today"`, disabled when `fetching === true`
  - **Autocomplete chip tray:** rendered below the textarea (not overlaid), classes `mt-2 flex flex-wrap gap-2`, only rendered when `suggestions.length > 0`
  - **Submit button:** `w-full h-12 text-lg`, disabled when `fetching || !input.trim()`. When loading, replaces label with `<Loader2 className="animate-spin" /> Processing...`

### 7.4 Autocomplete Chips

Each chip is a `<button type="button">` (explicitly not a submit button) styled as a rounded pill:

- **Base classes:** `inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-colors`

| Chip Type | Color Classes | Icon |
|---|---|---|
| Date | `bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300` | `<Calendar className="h-3 w-3 mr-1" />` |
| Purpose | `bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300` | `<Tag className="h-3 w-3 mr-1" />` |
| Party | `bg-green-100 text-green-800 hover:bg-green-200 border-green-300` | `<User className="h-3 w-3 mr-1" />` |

- Clicking a chip calls `applySuggestion(suggestion.text)`, which replaces the current word in-place and moves the cursor forward
- The color-coding creates an instant visual grammar: **blue = time**, **purple = category**, **green = person/org**

### 7.5 Confirmation Card (Conditional)

Only rendered when `lastCreatedExpense` is non-null (i.e., after at least one successful submission in the current session). It persists until the next submission replaces it with the new result.

- **Card classes:** `shadow-md mb-6 border-green-200 bg-green-50/50`
- **Header:** "✓ Expense Created" in `text-green-900`
- **Body:** `grid grid-cols-2 gap-4 text-sm` with the following fields:
  - **Amount:** `BDT {amount}` in `text-lg font-bold text-green-900`
  - **Date:** formatted with `toLocaleDateString()`
  - **Purpose:** purpose name
  - **Party:** party name
  - **Details:** full raw input string, spans `col-span-2`
- Each field only renders if its value is non-null — no empty placeholder labels
- This card serves as a **parse confirmation**: the user can immediately verify the system understood their input correctly

### 7.6 Example Prompts Card

- **Card:** Shadcn `<Card>` with `shadow-md`
- **Header:** Title "Try These Examples", description "Click on any example to use it"
- **Row format:** Full-width `<button>` elements: `w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm`
- Each row has a `→` arrow prefix styled in `text-muted-foreground`
- Clicking a row **populates the textarea** and clears suggestions — it does **not** auto-submit
- All buttons are disabled during `fetching`

**Current hardcoded examples:**

| # | Example String | Demonstrates |
|---|---|---|
| 1 | `paid utility bills BDT 3200 today` | Currency prefix, relative date |
| 2 | `vegetables - 200, yesterday` | Comma-separated format, relative date |
| 3 | `last sunday, conveyance 150` | Weekday reference date |
| 4 | `lent Mr Omuk 5000 January 02` | Party name with title, calendar date |
| 5 | `stationary 300` | Implicit date (defaults to today) |

### 7.7 Help Text Footer

- **Container:** `mt-6 text-center text-sm text-muted-foreground`
- **Line 1:** "Just describe your expense naturally - include amount, what it was for, and when."
- **Line 2:** "The app will figure out the rest!"

### 7.8 Toast Notifications

- **Library:** `sonner` (`import { toast } from "sonner"`)

| Trigger | Call |
|---|---|
| Successful expense creation | `toast.success("Expense created successfully!")` |
| Empty textarea on submit | `toast.error("Please enter an expense description")` |
| API/backend error | `toast.error(\`Failed to create expense: ${result.error.message}\`)` |

---

## 8. Input Format Reference

### 8.1 Amount Formats

| Input Example | Parsed Amount |
|---|---|
| `1500` | 1500.00 |
| `3,200` | 3200.00 |
| `BDT 3200` | 3200.00 |
| `Taka 500` | 500.00 |
| `Tk 200` | 200.00 |
| `৳ 750` | 750.00 |
| `1500.50` | 1500.50 |
| *(no number in input)* | 0.00 |

### 8.2 Date Expressions

| Input Expression | Resolved Date |
|---|---|
| `today` | Current date/time |
| `yesterday` | Current date minus 1 day |
| `last monday` | Most recent past Monday |
| `last friday` | Most recent past Friday |
| `January 02` | January 2nd (current or previous year) |
| `02 January` | January 2nd (current or previous year) |
| *(omitted)* | Defaults to current date/time |

### 8.3 Party Expressions

| Input Pattern | Parsed Party |
|---|---|
| `Mr Omuk` | `Mr Omuk` |
| `Mrs Smith` | `Mrs Smith` |
| `paid to Rahman` | `Rahman` |
| `received from Ali` | `Ali` |
| *(none detected)* | `Self` (default) |

### 8.4 Purpose Keyword Mapping

| Trigger Keywords | Resolved Purpose Name |
|---|---|
| utility, utilities, electric, electricity, water, gas | `utility bills` |
| vegetable, vegetables, grocery, groceries | `vegetables` |
| conveyance, transport, taxi, bus, rickshaw, uber | `conveyance` |
| stationary, stationery, pen, paper, notebook | `stationary` |
| food, lunch, dinner, breakfast, meal | `food` |
| medical, medicine, doctor, hospital | `medical` |
| rent, house | `rent` |
| entertainment, movie, cinema | `entertainment` |
| *(no keyword match)* | `miscellaneous` |

### 8.5 Transaction Type Signals

| Signal Words | Transaction Type |
|---|---|
| paid, pay, spent, expense | `expense` |
| received, receive, got, income | `income` |
| lent, lend, gave loan | `lent` |
| borrowed, borrow, took loan | `borrowed` |
| *(none detected)* | `expense` (default) |

### 8.6 Flexible Input Order

The parser does not depend on word order. All of the following inputs produce the same structured result:

```
paid utility bills BDT 3200 today
today BDT 3200 utility bills
utility bills, 3200, today
3200 electricity today
```

Fields are extracted independently via regex and keyword matching, not by position.

---

## 9. Behavioral Edge Cases

| Scenario | Behavior |
|---|---|
| No amount in input | `amount` is set to `0`; expense is still created successfully |
| No date in input | Defaults to current date/time |
| No purpose keyword match | Defaults to `"miscellaneous"` purpose |
| No party detected | Defaults to `"Self"` party |
| Purpose doesn't exist in DB | Auto-created on the fly with `type: "expense"` |
| Party doesn't exist in DB | Auto-created on the fly with `type: "individual"` |
| Future calendar date entered (e.g. `March 15` in January) | Date is rolled back to the same day in the previous year |
| Empty textarea on submit | Toast error shown; no API call is made |
| Textarea contains only whitespace | Treated identically to empty — `input.trim()` guard catches it |
| Cursor at very start of text | `wordStart` falls back to `cursorPos`; extraction extends forward only |
| Cursor at very end of text | `wordEnd` regex finds no trailing space; falls back to `text.length` |
| Suggestion chip clicked on a pure-number word | Numbers match the `/^\d+$/` guard in `getSuggestions` — no chips are ever shown for numeric words |
| Last word in sentence has no trailing space | `afterCursor.search(/\s/)` returns `-1`; `wordEnd` correctly extends to `text.length` |

---

## 10. Known Limitations & Future Enhancements

### 10.1 Current Limitations

- **Ambiguous keyword matching:** The parser is regex/keyword-based — ambiguous inputs (e.g. `"gas 300"` could mean fuel or utility) always resolve to the first matching keyword group in the lookup table
- **No multi-expense entry:** A single input cannot contain multiple expenses (e.g. `"food 200 and transport 100"` creates only one expense record)
- **BDT-centric currency prefix:** Only `BDT`, `Taka`, `Tk`, and `৳` are recognized as currency prefixes; other currencies' numeric values still parse but without a prefix
- **`transactionType` not persisted:** The field is parsed and returned by `parseExpense` but there is no corresponding column on the `expense` model — the value is discarded after parsing
- **Dashboard filter is stubbed:** The natural language filter input on the Dashboard page is disabled and shows placeholder text only; it does not call `parseSearchQuery`
- **Hardcoded `BDT` prefix in confirmation card:** The amount is always displayed as `BDT {amount}` regardless of the actual input currency
- **Auto-upserted records use fixed defaults:** Parties created via upsert always use `type: "individual"` and purposes always use `type: "expense"`, even when the input signals income or an organizational entity

### 10.2 Suggested Future Enhancements

- **Persist `transactionType`:** Add a `transactionType` enum field to the `expense` model and write the parsed value during `createExpenseFromText`
- **LLM-based parsing:** Replace the regex/keyword parser with an OpenAI structured output call (using the existing OpenAI connection) for higher accuracy on ambiguous or complex inputs
- **Multi-currency support:** Detect currency symbols/codes and apply exchange rate lookup for non-BDT amounts
- **Bulk expense entry:** Support multiple comma-separated expense descriptions in a single input field submission
- **Keyboard shortcut:** Add `Cmd/Ctrl + Enter` as a keyboard shortcut to submit the form
- **Tab-to-complete:** When exactly one suggestion chip is visible, pressing `Tab` should apply it automatically
- **Wire up Dashboard filter:** Connect the natural language filter input to the existing `parseSearchQuery` global action to enable AI-powered search on the Expenses list
- **Confirmation card animation:** Add a subtle slide-down CSS transition when the confirmation card first appears after submission
- **Undo toast action:** Add an "Undo" button to the success toast that calls `api.expense.delete` on the just-created expense ID

---

## 11. File Index

| File | Role |
|---|---|
| `web/routes/_public._index.tsx` | Primary UI component — the entire Add New Expense page |
| `api/actions/parseExpense.ts` | Global action — pure NLP parser, no DB writes |
| `api/actions/createExpenseFromText.ts` | Global action — orchestrates parse → upsert → create |
| `api/models/expense/schema.gadget.ts` | Expense model schema |
| `api/models/party/schema.gadget.ts` | Party model schema |
| `api/models/purpose/schema.gadget.ts` | Purpose model schema |