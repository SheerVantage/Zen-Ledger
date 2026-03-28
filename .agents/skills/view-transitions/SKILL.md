---
name: view-transitions
description: Manages smooth page-to-page transitions and element morphing using the View Transitions API in SvelteKit.
---

# View Transitions Skill

Enable native-app-like navigation between SvelteKit routes.

## Global Setup
- Wrap navigations in `document.startViewTransition()` within the `onNavigate` lifecycle hook in `src/routes/+layout.svelte`.

## Element Morphing
- When navigating from a **List Item** to a **Detail Page**, assign the same `view-transition-name` to the shared elements (e.g., the transaction amount).
- **CSS Rule**: `[style*="view-transition-name"] { contain: layout; }`

## Implementation Example
```typescript
// src/routes/+layout.svelte
onNavigate((navigation) => {
	if (!document.startViewTransition) return;
	return new Promise((resolve) => {
		document.startViewTransition(async () => {
			resolve();
			await navigation.complete;
		});
	});
});