# Zen Ledger - PRD

## Product Overview
**The Pitch:** Personal finance without the spreadsheet trauma. Zen Ledger replaces complex forms with a single, conversational input bar, turning "Dinner at Mario's $45" into structured financial clarity instantly.

**For:** Anxiety-prone spenders and dashboard-averse savers who want to track money without facing a wall of red numbers and rigid grids.

**Device:** Mobile

**Design Direction:** "Digital Softness." A neomorphic-adjacent aesthetic featuring soft clay-like surfaces, extremely rounded corners, and a calming, muted palette. No sharp edges, no jarring reds for debt.

**Inspired by:** Headspace (mood), Amie (natural language input), Weather apps (clean, focused data).

---

## Screens
- **The Daily Pulse (Home):** At-a-glance financial health summary and the primary input interface.
- **The Stream (Transactions):** Chronological, card-based feed of financial activity with search/filter.
- **The Insight (Analysis):** Narrative-driven monthly summary, focusing on sentences over complex charts.
- **The Clarification (Parser Modal):** Interactive confirmation screen when the AI is unsure of a categorization.

---

## Universal Detection Policy
To ensure high accuracy without user intervention, the system employs an alias-based matching strategy for both purposes and parties:
- **Aliases:** Each entity (Purpose or Party) can have multiple aliases (e.g., "Coffee" -> "starbucks"; "John Doe" -> "johnny").
- **Matching Priority:** When parsing a transaction, the system checks for exact matches or alias matches within the description for both the purpose and the involved party.
- **Learning:** Users can manage these aliases directly in the Purpose and Party settings to refine detection over time.

---

## Key Flows
**Quick Add Transaction:** Catching up on spending while walking.

1. User opens app -> Keyboard is already open or taps "Say something..." pill.
2. User types "Groceries $120 and coffee $6" -> System recognizes two distinct items.
3. System briefly flashes "Got it" toast -> Updates "Daily Spend" ring instantly.

**Resolving Ambiguity:** Teaching the system.

1. User types "Weekly dues $50" -> AI is unsure if this is "Gym" or "HOA".
2. App slides up **The Clarification** sheet -> Suggests "Gym?" with a `?` icon.
3. User taps "Create new category: Club" -> System learns for next time.

---

## Design System

### Color Palette
A palette designed to lower heart rate. No pure black, no pure white.

- **Background:** `#F4F1EB` - "Warm Oat" - Like unbleached paper.
- **Surface:** `#FFFFFF` - White with 80% opacity for glass-like depth.
- **Primary:** `#6B705C` - "Deep Sage" - Main actions, high contrast text.
- **Secondary:** `#A5A58D` - "Dried Herb" - Secondary text, borders.
- **Income (Accent):** `#B7B7A4` - "Dusty Green" - Subtle positive indicators. (Includes **Recovered** - money received for past receivables).
- **Expense (Accent):** `#CB997E` - "Terracotta" - Used sparingly for spending. (Includes **Repaid** - payments made for past payables).
- **Interactive:** `#DDBEA9` - "Almond" - Buttons and active states.

### Typography
Rounded sans-serifs soften the numbers.

- **Headings:** **Nunito**, 800, 28px-36px. (Soft, bubbly, approachable).
- **Body:** **Quicksand**, 600, 16px. (Geometric but friendly).
- **Numbers:** **Nunito**, 700, tabular-nums.
- **Micro:** **Quicksand**, 500, 12px.

**Style notes:**
- **Border Radius:** `24px` minimum on cards, `999px` on buttons.
- **Shadows:** Double-layered soft shadows `0px 4px 20px rgba(107, 112, 92, 0.08)` to create a "floating" feel.
- **Texture:** Subtle noise grain overlay (2% opacity) on the background to remove digital harshness.

### Design Tokens
```css
:root {
  --color-bg: #F4F1EB;
  --color-surface: rgba(255, 255, 255, 0.85);
  --color-text-main: #6B705C;
  --color-text-sub: #A5A58D;
  --color-accent-spend: #CB997E;
  --color-accent-earn: #B7B7A4;
  
  --font-heading: 'Nunito', sans-serif;
  --font-body: 'Quicksand', sans-serif;
  
  --radius-card: 24px;
  --radius-pill: 999px;
  
  --shadow-soft: 0px 8px 24px -4px rgba(107, 112, 92, 0.12);
  --shadow-inner: inset 0px 2px 4px rgba(0,0,0,0.02);
}
---

## Wealth Audit & Performance
The system prioritizes performance and reliability by maintaining pre-calculated financial summaries:
- **Persistent Summaries:** Global and party-wise receivables, payables, and net balances are stored in a dedicated `Settings` table.
- **Just-in-Time Updates:** Summaries are updated automatically whenever a transaction is added, modified, or deleted.
- **Wealth Ledger:** A detailed breakdown in the "Insight" page providing party-wise receivables and payables alongside a "Cash at Hand" calculation.
- **Manual Audit:** A "Wealth Audit" feature in Settings allows users to force a full recalculation of all totals from the raw transaction history, ensuring 100% data fidelity.
- **Profile Management:** User preferences and identification are grouped with these summaries for a unified persistent state.
