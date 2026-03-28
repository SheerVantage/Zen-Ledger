---
name: tailwind-css
description: Standardizes Tailwind CSS usage for styling. Use for layout design, responsive adjustments, and theme configuration.
---

# Tailwind CSS Skill

Guidelines for maintaining a clean, utility-first styling architecture.

## Best Practices
- **Utility First**: Prefer utility classes over `@apply` in `.svelte` or `.css` files.
- **Class Ordering**: Follow a logical order: Layout (flex, grid) -> Sizing (w, h) -> Spacing (m, p) -> Typography (text) -> Decoration (bg, border).
- **Configuration**: Add project-specific tokens (e.g., brand colors like `finance-green`) to `tailwind.config.ts` under `theme.extend`.

## Modern Features
- Use **Container Queries** (`@container`) for complex dashboard widgets that change size based on their parent grid cell.
- Utilize Tailwind's built-in **Arbitrary Values** `-[...]` sparingly; favor theme extensions for reusable values.

## Constraints
- Avoid "Div Soup." Use semantic HTML tags (`<section>`, `<article>`, `<nav>`) styled with Tailwind.
- Do not use inline styles (`style="..."`) unless the value is truly dynamic (e.g., a progress bar width from a variable).
- **Svelte Syntax Conflict**: Do **NOT** use the `class:directive={condition}` syntax with Tailwind classes that contain a slash `/` (e.g., `ring-sage/30`) or a colon `:`, as it will cause a Svelte compilation error. Use the standard ternary syntax `class={condition ? 'class-name' : ''}` instead.