# Zen Ledger - Implementation Plans

## 1. Architectural Strategy
The application will be built as a Single Page Application (SPA) using SvelteKit, optimized for mobile-first interaction but responsive for tablet/desktop.

### 1.1 SvelteKit Structure
- **Routes**:
    - `/`: The Daily Pulse (Home)
    - `/stream`: The Stream (Transactions)
    - `/insight`: The Insight (Analysis)
    - `/settings`: Global Settings & Profile
    - `/purposes`: Purpose/Account Type Management
    - `/parties`: Party/Contact Management
- **Components**:
    - `InputPill.svelte`: Natural language input with voice support & autocomplete.
    - `TransactionCard.svelte`: Expandable card with inline editing and tagging.
    - `StatusRing.svelte`: The central visualization on the home screen.
    - `ParserModal.svelte`: The clarification bottom sheet.
    - `WealthLedger.svelte`: Asset/Liability balance summary.
    - `AccrualModal.svelte`: Manual logging for recurring templates.
- **Stores**:
    - `transactions.ts`: Central state management for ledger.
    - `purposes.ts`, `parties.ts`: Entity management with similarity detection.
    - `categories.ts`: Global account category definitions.
    - `settings.ts`: Profile data and financial recalculation engine.
    - `ui.ts`: Theme and modal state.

### 1.2 NLP Integration
- **Client-Side Parsing**: Initial regex-based or rule-based parsing for speed.
- **Server-Side Enrichment**: Integration with a weightless LLM (e.g., Gemini Nano or a cloud endpoint) for complex intent resolution.
- **Voice**: Web Speech API for real-time transcription.

## 2. Technical Roadmap

### Phase 1: Foundation (Structure & Styles)
- Initialize SvelteKit + Tailwind CSS.
- Configure Design Tokens as Tailwind extended theme.
- Implement the baseline layout and navigation.

### Phase 2: Core UX (Home & Input)
- Build the `InputPill` with NLP feedback loops.
- Implement the `StatusRing` visualization.
- Set up the initial state management for data entry.

### Phase 3: Data Management (The Stream)
- Implement `The Stream` with infinite scroll and swipe actions.
- Build filtering and search capabilities.
- Integrate the `ParserModal` for handling ambiguity.

### Phase 4: Intelligence & Analytics (The Insight)
- Complete the monthly summary logic.
- Implement the "Stories" horizontal swipe interface for insights.
- Refine the NLP model with user feedback (learning state).

## 3. Improvements & Suggestions (UX + Efficiency)

### 3.1 Proactive Budgeting (Antigravity's Suggestion)
- **Pulse Notifications**: Instead of just balance, the app can nudge: *"Hey, you've spent $20 more on coffee this week than your usual trend. Take a breather?"*
- **Logic**: Use simple moving averages to detect anomalies in spending habits.

### 3.2 Dynamic Contextual Input
- **System Efficiency**: If the user starts typing "Lunch...", the placeholder should change to suggest common amounts or people. 
- **Learning**: Match patterns based on time of day (e.g., if it's 8:00 AM, suggest "Coffee $4").

### 3.3 Visual Pacing
- **Calm Interaction**: Use slightly slower, intentional transition durations (400ms-600ms) for modals to reinforce the "Zen" feel.
- **Haptic Feedback**: Implement subtle vibrations for success/error states to provide non-visual confirmation.

### 3.4 Multi-Theme Transition
- **Implementation**: Since the user wants two modes (Focus/Calm), we can use a CSS variable-based theme system controllable via a single data-theme attribute on the `<body>`.
- **Logic**: This allows instant switching between "Zen Ledger" and "Swiss Grid" aesthetics without reload.
