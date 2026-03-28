# Zen Ledger - The Daily Pulse (Home)

## Purpose
The entry point. Removes friction to add data immediately.

## Layout
Vertical stack. Bottom-weighted input to support one-handed thumb use.

## Key Elements
- **Status Header:** Top-left. "Good Morning, Alex." Subtext: "You're $42 under budget today."
- **Visualize Ring:** Center. A large, thick, semi-complete donut chart.
    - **Color:** Gradient from Terracotta to Sage.
    - **Center Text:** Large current balance or "Safe to spend: $120".
- **The Input Pill:** Bottom (Sticky). Large text field (height: 64px).
    - **Placeholder:** "Coffee $4..." or "Salary $3000..."
    - **Microphone Icon:** Right aligned, pulsating slowly.
    - **Behavior:** Focus expands keyboard, pushing content up.

## States
- **Empty:** Ring is greyed out. Text: "Quiet day so far."
- **Processing:** Input pill shows a "thinking" smooth wave animation.
- **Success:** Input clears, a small checkmark floats up and fades.

## Interactions
- **Tap Input:** Keyboard slides up, background blurs slightly.
- **Swipe Down on Ring:** Refreshes sync with bank (if connected).

## Responsive
- **Mobile:** Full width stacked.
- **Tablet:** Input floats bottom center (max-width 500px).
