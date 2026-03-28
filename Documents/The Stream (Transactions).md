# Zen Ledger - The Stream (Transactions)

## Purpose
Reviewing history without spreadsheet fatigue.

## Layout
Infinite scroll list with "sticky" date headers.

## Key Elements
- **Date Header:** "Today", "Yesterday", "Tuesday". Sticky positioning. Font: Nunito 700, small caps, Sage color.
- **Transaction Card:** Height 80px. Background: Surface White.
    - **Icon:** Left. Emoji based on category (e.g., ☕ for coffee) inside a Circle (Color: Almond).
    - **Title:** "Starbucks".
    - **Subtitle:** "Personal • 9:41 AM".
    - **Amount:** Right aligned. `- $4.50` (Terracotta) or `+ $200.00` (Sage).
- **Search/Filter Fab:** Floating Action Button bottom right. Icon: Sliders.

## States
- **Loading:** Skeleton pulses (shimmer effect) on 5 rows.
- **End of list:** "That's everything for now." with a small leaf illustration.

## Interactions
- **Swipe Left:** Reveal "Edit" and "Delete" actions (Background: Terracotta).
- **Tap Card:** Expands details inline (accordion style).
