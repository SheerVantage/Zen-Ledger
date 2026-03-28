# Implementation Plan: Implement Configurable InputPill and Enhance Transaction Card

## Phase 1: InputPill Refactoring [checkpoint: f4a9c65]
- [x] Task: Update `InputPill.svelte` with a `mode` prop
    - [x] Add `mode` prop (values: `standalone` | `inline`).
    - [x] Update conditional rendering to show/hide the action button based on the `mode`.
- [x] Task: Implement subtle focus state for `inline` mode
    - [x] Adjust CSS/Tailwind classes for a less prominent focus ring.
- [x] Task: Write unit tests for `InputPill` mode variations
    - [x] Verify both modes render correctly and function as expected.
- [x] Task: Conductor - User Manual Verification 'Phase 1: InputPill Refactoring' (Protocol in workflow.md)

## Phase 2: Embedded Tagging Implementation
- [~] Task: Integrate autocomplete menu into `InputPill`
    - [ ] Show suggestions based on user input.
- [ ] Task: Enhance NLP Auto-Tagging in `InputPill`
    - [ ] Automatically detect and highlight potential tags.
- [ ] Task: Implement visual feedback for tags (chips/icons)
    - [ ] Display current tags within the pill UI.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Embedded Tagging Implementation' (Protocol in workflow.md)

## Phase 3: TransactionCard Enhancement
- [ ] Task: Transition `TransactionCard` to use `InputPill` for edits
    - [ ] Replace `textarea` with `InputPill` in `inline` mode.
    - [ ] Ensure seamless data synchronization between the card and the pill.
- [ ] Task: Improve `TransactionCard` detail view and layout
    - [ ] Refine the display of all metadata (amount, date, purpose, party) for clarity and extensibility.
- [ ] Task: Perform end-to-end testing for transaction editing flow
    - [ ] Verify card expansion and editing using the new `InputPill` integration.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: TransactionCard Enhancement' (Protocol in workflow.md)
