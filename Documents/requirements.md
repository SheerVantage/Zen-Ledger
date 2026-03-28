# Zen Ledger - Requirements

## 1. Product Goal
Create a minimalistic, low-maintenance personal finance mobile application that minimizes the burden of data entry through intelligent natural language processing (text and voice input).

## 2. Core Features

### 2.1 Natural Language Processing (NLP) Input
- **Voice Input**: Integrated voice recording with auto-transcription.
- **Text Input**: Single prominent input field for command-like entry (e.g., "Dinner at Mario's $45").
- **Parsing Engine**: 
    - Extract: Party (merchant/person), Date, Purpose, Amount, and Type (Income/Expense).
    - Intelligent Categorization: Associate entries with existing categories or suggest new ones.

### 2.2 Dashboard (The Daily Pulse)
- At-a-glance financial health summary.
- Visualization of "Safe to spend" vs. actual spend.
- Primary entry point for quick transactions.

### 2.3 Transaction Management (The Stream)
- Chronological, card-based feed of all financial activity.
- Infinite scroll with sticky date headers.
- Search and filter functionality.
- Swipe actions: Edit and Delete.
- Expandable cards for detailed view with **Selection-to-Action**: Select text in narration to quickly tag as Party or pre-fill a new Purpose.
- Support for **Recovered** and **Repaid** categories that reduce receivables/payables using FIFO logic.
- **Purpose & Party Aliases**: Support for multiple aliases per purpose and party to improve automatic transaction categorization and detection.
- **Entity Auditing**: Every data entity (Purpose, Party, Transaction) tracks `createdAt` and `updatedAt` timestamps for data integrity and synchronization support.

### 2.4 Analysis (The Insight)
- Narrative-driven monthly summary (stories format).
- Focus on friendly, conversational insights over complex charts.
- Key metrics: Spend trends, Top categories, Savings summary.

### 2.5 Clarification System (The Parser Modal)
- Interactive bottom sheet for resolving NLP ambiguities.
- Displays original input and multiple choice options for categorization.
- Learning capability to improve future parsing.

## 3. Technology Stack
- **Framework**: SvelteKit (Latest version)
- **Styling**: Tailwind CSS
- **Design Strategy**: Responsive-first, primarily targeting mobile, but with tablet-optimized layouts.

## 4. Design Tenets
- **Minimalism**: Ruthless elimination of non-essential UI elements.
- **Intuitiveness**: Zero learning curve for data entry.
- **Calmness**: Using the "Zen" aesthetic (soft colors, rounded shapes, gentle animations).
- **Efficiency**: Minimal taps required for common actions.

## 5. User Journey Highlights
1. **Entry**: Open app, tap/speak, confirm (if necessary), finish.
2. **Review**: Scroll through "The Stream" to check past spending.

## 6. Performance & Data Storage
- **Persistent Financial Summaries**: The application maintains a pre-calculated table of global and party-wise financial totals (receivables, payables, balances) to ensure instantaneous dashboard loads.
- **Incremental Updates**: Summaries are updated incrementally on every transaction change.
- **Wealth Audit**: Users can trigger a manual recalculation of all summaries from the primary transaction ledger in the Settings page.
- **Profile Persistence**: User name, daily budget, and currency preferences are persisted alongside financial summaries.
