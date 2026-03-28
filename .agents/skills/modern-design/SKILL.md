---
name: modern-design
description: Guidelines for high-end, modern UI design using Tailwind CSS. Use when building dashboards, cards, or data-heavy views to ensure a "premium" look.
---

# Modern Design Skill

Apply these aesthetic principles to all generated components:

## Visual Language
- **Soft Shadows**: Use `shadow-sm` or custom `shadow-[0_8px_30px_rgb(0,0,0,0.04)]` instead of heavy borders.
- **Glassmorphism**: For overlays and sidebars, use `bg-white/70 backdrop-blur-md dark:bg-slate-900/70`.
- **Typography**: Use `font-sans` with tight tracking (`tracking-tight`) for headers. Use `text-slate-500` for secondary info to create hierarchy.
- **Finance Accents**: Use a "Success" palette (Emerald/Teal) for positive balances and a "Destructive" palette (Rose/Amber) for expenses.

## Layout Patterns
- **Card-Based**: Wrap logical groups in cards with `rounded-2xl` and `border border-slate-100`.
- **Empty States**: Never show a blank screen. Use illustrated placeholders or "Skeleton" loaders.

## Constraints
- Avoid pure black `#000`. Use `bg-slate-950` for dark mode.
- Do not use default blue links; use brand-colored buttons or subtle underlines.