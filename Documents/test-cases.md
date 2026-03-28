# Zen Ledger - Test Cases

## 1. TC-1: NLP Accuracy Test (Basic)
| ID | Step | Input | Expected Outcome |
| :-- | :-- | :-- | :-- |
| 1.1 | Type transaction | "Coffee $5" | Logged as -$5.00, Category: Food & Drink. |
| 1.2 | Type income | "Salary $2000" | Logged as +$2000.00, Category: Income. |
| 1.3 | Missing amount | "Coffee" | Input pill stays open; placeholder: "How much was the coffee?" |

- **Follow-up**: If amount is missing, ensure focus returns to input.

## 2. TC-2: Home Page (The Daily Pulse)
| ID | Step | Condition | Expected Outcome |
| :-- | :-- | :-- | :-- |
| 2.1 | View Ring | Initial state | Shows "Safe to spend: $200" (or default budget). |
| 2.2 | Add Expense | -$50 added | Ring progress decreases; balance shows $150. |
| 2.3 | Theme Toggle | Switch theme | Instant transition to Swiss Grid palette (if implemented). |

- **Follow-up**: Verify CSS variable injection in `:root`.

## 3. TC-3: The Stream (Transaction List)
| ID | Step | Action | Expected Outcome |
| :-- | :-- | :-- | :-- |
| 3.1 | Scroll List | Swipe up | Sticky headers update contextually (Today -> Yesterday). |
| 3.2 | Expand Card | Tap "Starbucks" | Card slides down (400ms) to reveal "Edit" / "Delete". |
| 3.3 | Delete Item | Tap "Delete" | Card fades out; Home page balance updates immediately. |

- **Follow-up**: Ensure haptic feedback triggers on delete.

## 4. TC-4: The Insight (Stories)
| ID | Step | Action | Expected Outcome |
| :-- | :-- | :-- | :-- |
| 4.1 | Swipe Right | Tap right edge | Next card flies in from right (600ms). |
| 4.2 | Last Card | Tap right on end | Subtle "bounce" animation to indicate boundary. |
| 4.3 | Data Sync | No transactions | Page shows: "Gathering wisdom... check back in a few days." |

- **Follow-up**: Verify empty states for all metric cards.

## 5. TC-5: Voice Interaction (Simulated)
| ID | Step | Action | Expected Outcome |
| :-- | :-- | :-- | :-- |
| 5.1 | Mic Tap | Tap Mic icon | Background pulses; placeholder: "Listening...". |
| 5.2 | End Recording | Tap Mic again | Text "Coffee $5" auto-appears and submits after 1s. |

- **Follow-up**: Ensure microphone permission prompt is handled gracefully.

## 6. TC-6: Adaptive Budget Logic (Drift Test)
| ID | Step | Input | Expected Outcome |
| :-- | :-- | :-- | :-- |
| 6.1 | Log anomalous Rent | "Rent $2000" (Prev $1500) | Clarification Modal appears after 2nd consecutive month. |
| 6.2 | Adjust Baseline | Tap "Yes, this is my new rent." | Daily Pulse "Safe to spend" decreases by $500 / 30. |

- **Follow-up**: Verify that once-off large purchases (e.g., "Laptop $2k") *do not* trigger budget adjustments unless explicitly requested.

## 7. TC-7: Performance & Archival
| ID | Step | Condition | Expected Outcome |
| :-- | :-- | :-- | :-- |
| 7.1 | Heavy Data Stream | 500+ transactions | The Stream scrolls smoothly at 60fps; date headers remain sticky. |
| 7.2 | Old Data Search | Search "March 2024" | Results appear under 200ms using local indexing. |

- **Follow-up**: Test data persistence across app restarts and updates.
