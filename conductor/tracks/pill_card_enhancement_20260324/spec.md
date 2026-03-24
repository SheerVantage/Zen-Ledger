# Specification: Implement Configurable InputPill and Enhance Transaction Card

## Overview
This track focuses on refactoring the `InputPill` component to be configurable and enhancing the `TransactionCard` to provide a more comprehensive, extensible view. A key requirement is to integrate the tagging feature directly into the `InputPill` while ensuring the global bottom bar instance remains unaffected.

## Functional Requirements
- **Configurable InputPill (`mode` prop):**
    - `mode="standalone"` (Default): The current global version with the action button (Mic/Send).
    - `mode="inline"`: A minimal version without the action button, designed for use inside cards.
- **Enhanced TransactionCard:**
    - Transition from standard `textarea` to `InputPill` in `inline` mode for narration and amount edits.
    - Full Detail View: Ensure all transaction metadata (amount, date, purpose, party) is displayed clearly when expanded.
    - Extensible Layout: Structure the card to easily accommodate future metadata.
- **Embedded Tagging in InputPill:**
    - **Autocomplete Menu:** Show suggestions for parties and purposes as the user types or selects text.
    - **NLP Auto-Tagging:** Automatically detect and visually tag entities using existing parsing logic.
    - **Inline Chips/Icons:** Provide visual feedback within the pill for currently tagged entities.

## Non-Functional Requirements
- **Backward Compatibility:** The global `InputPill` in the bottom bar must maintain its current behavior and appearance.
- **Subtle Focus State:** When in `inline` mode, the `InputPill` should use a more subtle, integrated focus style to blend with the card.
- **Responsiveness:** All changes must be fully responsive and optimized for mobile interactions.

## Acceptance Criteria
- [ ] `InputPill` correctly switches modes based on the `mode` prop.
- [ ] `TransactionCard` uses the `inline` `InputPill` for all text-based edits.
- [ ] The global bottom bar `InputPill` is unchanged in its appearance and functionality.
- [ ] Tagging (Party/Purpose) is functional within the `InputPill` in both modes.
- [ ] `TransactionCard` layout is robust and displays all relevant transaction details when expanded.
