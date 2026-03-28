---
name: micro-interactions
description: Implementation of subtle UI feedback and state-driven animations. Use for buttons, form inputs, and hover states.
---

# Micro-interactions Skill

Every user action must have a corresponding visual "breath."

## Interaction Patterns
- **Buttons**: Use a subtle "push" effect: `active:scale-95 transition-transform duration-100`.
- **Hover States**: Cards should lift slightly: `hover:-translate-y-1 hover:shadow-xl transition-all`.
- **Form Feedback**: When a user clicks "Add Transaction," use a brief spring animation to show the item appearing in the list.
- **Loading States**: Use `animate-pulse` on skeleton components while DuckDB is querying.

## Tech Implementation
- Use Svelte's built-in `transition:fade`, `transition:slide`, or `transition:scale`.
- For spring physics, use `import { spring } from 'svelte/motion'`.

## Constraints
- Keep durations short (150ms–300ms). Never let an animation block user input.