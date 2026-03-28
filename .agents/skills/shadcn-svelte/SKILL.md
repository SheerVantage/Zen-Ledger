---
name: shadcn-svelte
description: Manages UI components using the shadcn-svelte port. Use when adding new UI elements like tables, forms, or dialogs to ensure consistent design and accessibility.
---

# shadcn-svelte Skill

This skill governs how UI components are added and styled within the SvelteKit project.

## Workflow
- **Installation**: Use `npx shadcn-svelte@latest add [component]` to fetch new components.
- **Location**: Components must reside in `$lib/components/ui/`.
- **Styling**: All components use Tailwind CSS. Modify local component files in the `ui` folder rather than writing global CSS overrides.

## Component Patterns
- **Forms**: Integrate components with `sveltekit-superforms` and `zod` for validation.
- **Icons**: Use `lucide-svelte` for all iconography within components.
- **Theming**: Use the `cn()` utility function from `$lib/utils` for dynamic class merging.

## Constraints
- Do not create custom components for standard UI elements (Buttons, Inputs, Modals) if a shadcn version exists.
- Ensure all components support Dark Mode using Tailwind's `dark:` prefix.