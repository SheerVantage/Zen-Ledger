# Zen Ledger - Use Cases

## 1. UC-1: Quick Text Capture (Basic Flow)
- **Actor**: User
- **Precondition**: App is open on "Daily Pulse".
- **Steps**:
    1. User taps the input pill.
    2. User types "Lunch at Chipotle $18.50".
    3. User taps the "Send" icon (or Enter).
    4. **System Parser**: Extracts `Party: Chipotle`, `Category: Food & Drink`, `Amount: -18.50`.
- **Outcome**: A "Success" checkmark floats up; balance updates; transaction appears at the top of "The Stream."

## 2. UC-2: Voice Input Transcription (Alternate Flow)
- **Actor**: User
- **Precondition**: User is walking/busy.
- **Steps**:
    1. User taps the microphone icon.
    2. Input pill background pulses (Recording state).
    3. User says "Gas station twenty five dollars."
    4. User taps microphone again to finish.
    5. **System Parser**: Transcribes text -> Parses components.
- **Outcome**: System confirms "Gas $25.00 logged to Transport."

## 3. UC-3: Resolving Ambiguity (Clarification Flow)
- **Actor**: User, AI Parser
- **Steps**:
    1. User types "Home Depot $120".
    2. **AI Logic**: Unsure if this is "Maintenance" or "Furniture."
    3. System triggers **The Clarification** bottom sheet.
    4. User selects "Home Maintenance."
- **Outcome**: Transaction is logged; system remembers preference for future "Home Depot" entries.

## 4. UC-4: Reviewing Monthly Insights
- **Actor**: User
- **Steps**:
    1. User navigates to "The Insight" via bottom nav.
    2. User swipes horizontally through narrative cards.
    3. User taps a card to see a breakdown of the top 3 spending categories.
- **Outcome**: User gains awareness of spending habits without seeing a spreadsheet.

## 6. UC-6: Weekly Reflection Review
- **Actor**: User
- **Steps**:
    1. System triggers a "Weekly Insight Available" notification.
    2. User opens "The Insight."
    3. User swipes through a specific story comparing this week's aggregate to the last 4 weeks.
    4. User taps "Zen Wisdom" to see a suggestion for next week (e.g., "Maybe one less 'Treat' next week to stay in the green?").
- **Outcome**: User feels empowered with actionable advice, not shamed by data.

## 7. UC-7: Adaptive Budget Adjustment (Life Event)
- **Actor**: User, AI Budgeter
- **Steps**:
    1. User logs a large transaction tagged "Moving Trucks" or "Security Deposit."
    2. **AI Logic**: Recognizes a potential life event.
    3. System waits for the first "Rent" payment in the new month.
    4. If the amount differs by >10% from previous months, it triggers a **Clarification Flow**.
    5. User confirms the new rent amount.
- **Outcome**: The "Safe to Spend" algorithm automatically adjusts the monthly baseline.

## 8. UC-8: Yearly Milestone Visualization
- **Actor**: User
- **Steps**:
    1. User selects "Yearly View" in Insights.
    2. User scrolls through a generative "Life Stream" that highlights months of high savings or major purchases.
- **Outcome**: User sees their financial growth as a narrative of their year.
