---
name: Zen Ledger
description: Calm personal finance through conversational input and soft organic surfaces
colors:
  zen-oat: "#F4F1EB"
  zen-sage: "#6B705C"
  zen-herb: "#A5A58D"
  zen-earn: "#B7B7A4"
  zen-spend: "#CB997E"
  zen-almond: "#DDBEA9"
  zen-surface: "#FFFFFFB3"
  zen-panel: "#FFFFFF"
  zen-on-primary: "#FFFFFF"
  dark-oat: "#0F172A"
  dark-sage: "#4E6780"
  dark-herb: "#818B97"
  dark-earn: "#34D399"
  dark-spend: "#FB7185"
  dark-almond: "#1E293B"
  dark-surface: "#1E293BEB"
  dark-panel: "#1E293B"
  dark-on-primary: "#0F172A"
typography:
  display:
    fontFamily: "Nunito, sans-serif"
    fontWeight: 800
    fontSize: "clamp(1.75rem, 5vw, 2.25rem)"
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Nunito, sans-serif"
    fontWeight: 800
    fontSize: "1.25rem"
    lineHeight: 1.2
  title:
    fontFamily: "Nunito, sans-serif"
    fontWeight: 700
    fontSize: "1rem"
    lineHeight: 1.3
  body:
    fontFamily: "Quicksand, sans-serif"
    fontWeight: 600
    fontSize: "1rem"
    lineHeight: 1.5
  label:
    fontFamily: "Quicksand, sans-serif"
    fontWeight: 500
    fontSize: "0.75rem"
    lineHeight: 1.4
    letterSpacing: "0.1em"
  micro:
    fontFamily: "Quicksand, sans-serif"
    fontWeight: 700
    fontSize: "0.5625rem"
    lineHeight: 1.3
    letterSpacing: "0.2em"
rounded:
  pill: "9999px"
  zen: "24px"
  card-lg: "40px"
  card-md: "32px"
  card-sm: "16px"
  icon: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  card-padding: "20px"
components:
  button-primary:
    backgroundColor: "{colors.zen-sage}"
    textColor: "{colors.zen-on-primary}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  button-primary-active:
    backgroundColor: "{colors.zen-sage}"
    textColor: "{colors.zen-on-primary}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "{colors.zen-surface}"
    textColor: "{colors.zen-herb}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  chip-selected:
    backgroundColor: "{colors.zen-sage}"
    textColor: "{colors.zen-on-primary}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  chip-default:
    backgroundColor: "{colors.zen-surface}"
    textColor: "{colors.zen-herb}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  input-pill:
    backgroundColor: "{colors.zen-surface}"
    textColor: "{colors.zen-sage}"
    rounded: "{rounded.pill}"
    height: "64px"
    padding: "0 32px"
  card-metric:
    backgroundColor: "{colors.zen-surface}"
    textColor: "{colors.zen-sage}"
    rounded: "{rounded.card-lg}"
    padding: "{spacing.card-padding}"
  nav-fab:
    backgroundColor: "{colors.zen-sage}"
    textColor: "{colors.zen-on-primary}"
    rounded: "{rounded.pill}"
    size: "64px"
---

# Design System: Zen Ledger

## Overview

**Creative North Star: "Digital Softness"**

Zen Ledger feels like unbleached paper and clay: warm, rounded, quietly confident. The interface lowers financial anxiety through muted organic colors, generous whitespace, and motion that breathes rather than snaps. Surfaces float with soft shadows; numbers align with tabular precision inside friendly type.

The app is mobile-first and one-handed. Primary actions live at the bottom (FAB, input pill, nav). Top bar stays minimal: brand, page title, theme toggle.

**Key Characteristics:**
- Warm oat background with 2% noise grain overlay (`.noise-overlay`)
- No pure black or pure white; sage and herb carry text hierarchy
- Pill-shaped inputs and chips; cards use 24px–40px corner radii
- Terracotta for outflows, dusty green for inflows; never punitive red
- Backdrop blur on shell surfaces (header, bottom nav, input sheet) used sparingly for depth
- View Transitions API on route changes (400ms theme, 300ms page fade)
- Custom SVG icons only (`Icon.svelte`); emoji for category/purpose identity

**Explicitly rejects:** fintech hero-metric templates, side-stripe card accents, gradient text, decorative glassmorphism, identical icon-card grids, spreadsheet-style dense tables.

## Colors

A restrained palette: tinted neutrals (oat, sage, herb) with terracotta and dusty green as functional accents, not decoration.

### Primary
- **Deep Sage** (#6B705C): Primary text, active nav, FAB, selected chips, primary buttons. The calm anchor of the interface.
- **Warm Oat** (#F4F1EB): Page background in light mode. Like unbleached paper; always present behind content.

### Secondary
- **Dried Herb** (#A5A58D): Subtitles, borders, inactive nav, placeholder text, micro-labels.
- **Almond** (#DDBEA9): Interactive chip backgrounds, mic button idle state, hover washes.

### Tertiary
- **Terracotta Spend** (#CB997E): Expense amounts, outflow indicators. Used sparingly; informative, not alarming.
- **Dusty Green Earn** (#B7B7A4): Income amounts, positive indicators, recovered funds.

### Neutral
- **Frosted Surface** (rgba(255,255,255,0.7)): Cards, input pill, filter panels. Glass-adjacent but readable.
- **Panel White** (#FFFFFF): Solid card interiors, elevated panels in light mode.
- **On Primary** (#FFFFFF light / #1C1B18 dark): Text atop sage buttons and selected chips.

### Text hierarchy (Option A)
- **Sage** (`zen-sage`): Primary labels, amounts, navigation active state.
- **Body** (`zen-body` — #5C5A52 light / #B8B6AE dark): Secondary running text when softer than sage is needed.
- **Muted** (`zen-muted` — #8F9078 light / #6E6C65 dark): Micro-labels, section captions, filter hints.
- **Muted Soft** (`zen-muted-soft` — #A8A498 light / #8A8880 dark): Placeholders, footnotes, disabled-adjacent copy.

### Hairlines (Option A)
- **Hairline** (`zen-hairline`): Default 1px borders on list cards, inputs, toolbars.
- **Hairline Soft** (`zen-hairline-soft`): Lighter dividers inside panels.
- **Hairline Strong** (`zen-hairline-strong`): Hover and expanded list-card borders.

### Semantic
- **Success** (`zen-success` — #7A9470 light / #A8B896 dark): Confirmations and positive feedback. Calm, not alarm green.

### Utility classes (`layout.css`)
- **`.zen-micro-label`**: 11px / 600 / 0.08em uppercase captions (date headers, metric labels).
- **`.zen-field-label`**: Same spec, block layout for form fields.
- **`.zen-caption-muted`**: 12px footnote text in `zen-muted-soft`.
- **`.zen-list-card`**: Flat list surface; hairline border, no shadow; hover strengthens border only.

### Dark theme (`data-theme="dark"`)
- Background shifts to **Warm Charcoal** (#1C1B18); surfaces to **Elevated Warm** (#2A2824).
- Text uses **Warm Off-White** (#D4D2C8); earn/spend stay **Dusty Green** (#A8B896) and **Terracotta** (#C9A088).
- Theme transition: 400ms cubic-bezier(0.4, 0, 0.2, 1) on background and text.

### Named Rules
**The Calm Money Rule.** Never use pure red (#FF0000) or alarm colors for debt or overspend. Terracotta and rose at reduced opacity carry outflow semantics.

**The One Accent Rule.** Sage is the only strong brand color on any screen. Terracotta and dusty green appear only on numbers and small indicators, not large fills.

**The Palette Discipline Rule.** Do not introduce off-brand hues (e.g. `blue-500` on Loans card). Extend the Zen palette or use sage-tinted semantic variants.

## Typography

**Display Font:** Nunito (700, 800)
**Body Font:** Quicksand (500, 600, 700)

**Character:** Bubbly but trustworthy. Headings feel approachable; body stays geometric and readable. Numbers always use Nunito with `tabular-nums`.

### Hierarchy
- **Display** (800, clamp 1.75–2.25rem, line-height 1.1): Page hero metrics (Liquid Cash, Net Worth values at 3xl/-black).
- **Headline** (800, 1.25rem): Section titles ("Recent"), story card headlines on Insight.
- **Title** (700, 1rem): Transaction titles, card primary labels.
- **Body** (600, 1rem, max ~65ch): Narration text, descriptions, modal copy.
- **Label** (500–700, 0.75rem, uppercase, tracking 0.1em): Form labels, filter field labels.
- **Micro** (700, 9–10px, uppercase, tracking 0.2em): Metric category labels ("LIQUID CASH", "RANGE REVIEW").

### Named Rules
**The Number Alignment Rule.** All currency values use `tabular-nums` and Nunito 700–900. Never use proportional figures in lists or dashboards.

**The Micro Label Rule.** Metric categories use uppercase micro type with wide letter-spacing. This creates hierarchy without adding visual weight.

## Elevation

Hybrid: soft shadows for floating elements, tonal layering for nested content. Not flat, not Material-heavy.

### Shadow Vocabulary
- **zen-soft** (`0px 8px 32px -4px rgba(107, 112, 92, 0.12)`): Metric cards, selected chips, filter panel.
- **zen-heavy** (`0px 12px 48px -8px rgba(0, 0, 0, 0.15)` light / `0px 12px 64px rgba(0,0,0,0.6)` dark): FAB, bottom nav, input sheet, capture review sheet.
- **Inner inset** (`inset 0px 2px 4px rgba(0,0,0,0.02)`): Input pill depth (spec; partial use today).

### Depth without cards
- Sticky date headers use `bg-zen-oat/80 backdrop-blur-md` to float over Stream content.
- Noise overlay at z-index 9999 adds paper texture without affecting interaction.

### Named Rules
**The Float Rule.** Only FAB, bottom nav, modals, and primary metric cards get heavy shadows. List items use `.zen-list-card` (hairline only). Inline content stays flat or uses light borders.

**The No Side-Stripe Rule.** Never use colored left/right borders on cards or list items. Use background tints, icons, or full borders at 10% herb opacity.

## Components

### Buttons
- **Shape:** Full pill (`rounded-full`, 48–64px height for primary).
- **Primary:** Sage fill, white/dark-slate text, `active:scale-95` press feedback.
- **FAB:** 64px circle, sage fill, 4px surface border, `-top-8` protrusion from nav bar, plus icon rotates 45° when input open.
- **Ghost/Icon:** 40px rounded-xl, almond/20 background, sage icon; theme toggle in header.
- **Hover/Focus:** Scale 1.02–1.05 on cards; scale 0.95–0.98 on press. No bounce easing.

### Chips / Filter pills
- **Default:** Surface background, herb text, pill shape, text-xs bold.
- **Selected:** Sage fill, on-primary text, shadow-zen-soft.
- **Use:** Category quick-filter on Pulse, account/prospect type selectors in InputPill extras.

### Cards / Containers
- **Metric card:** `rounded-[2.5rem]` (40px), surface/40 + backdrop-blur-3xl, border herb/10, p-5, decorative icon at 5% opacity in corner.
- **Planning/Loans card:** `rounded-[2rem]`, tinted sage or semantic background at 5%, smaller type hierarchy.
- **Transaction card:** Collapsed ~80px feel, `zen-list-card` (hairline border, no shadow), expand via accordion slide (400ms), amount right-aligned with terracotta/sage color by direction.
- **Internal padding:** Minimum p-4 (16px); metric cards p-5 (20px).

### Inputs / Fields
- **InputPill:** 64px height, full-width pill, surface/40 + blur + border herb/10, text-lg semibold, placeholder herb/40.
- **Action button:** 48px circle inside pill right edge; almond when idle (mic), sage when active (send/recording).
- **Processing state:** Ring-2 sage/30, three-dot bounce animation, optional wave overlay.
- **Extras panel:** Account pills, transfer from/to, prospect type/confidence; slides below input on `showExtras`.
- **Search input:** Small rounded-full, expands width on focus (w-32 → w-48).
- **Date/number filters:** Oat/30 fill, herb/10 border, rounded-lg, text-xs.

### Navigation
- **Top bar:** Fixed, h-16, solid panel, border-b herb/10, centered page title, theme toggle, mobile drawer trigger (right).
- **Bottom nav:** h-20, five slots, active pill + indicator, inactive herb, active sage bold.
- **Mobile menu:** Right slide drawer with backdrop; Manage (Parties, Purposes) + Settings; burger right of theme toggle.

### Modals & sheets
- **CaptureReviewSheet:** Bottom sheet for low-confidence captures; solid `bg-zen-panel`, flagged fields, inline entity create, "Back to edit".
- **Global input sheet** (`#global-input-sheet`): InputPill with auto-focus on `[data-testid="capture-input"]`.
- **AccrualModal:** Recurring accrual logging.
- **CaptureReviewSheet:** Bottom sheet for low-confidence capture review (replaces legacy ParserModal; see `trashed/code/components/`).
- **Backdrop:** oat/50, fade; click to dismiss review sheet.

### Signature components
- **StatusRing:** 280px SVG donut (220px compact), 24px stroke, terracotta→sage gradient arc, center "Safe to spend" label. Rendered on Pulse hero in compact mode.
- **WealthLedger:** Party rows with receivable/payable columns, embedded in Insight page.
- **TransactionCard:** Core surface; supports expand, edit, settle, word-selection tagging, purpose/party inline add.

## Do's and Don'ts

### Do:
- **Do** use the Zen token classes (`bg-zen-oat`, `text-zen-sage`, `rounded-zen`, `shadow-zen-soft`) from `layout.css`.
- **Do** keep bottom nav and FAB visible on all main routes; reserve `pb-24` to `pb-40` on page content.
- **Do** use `active:scale-95` on tappable elements for tactile feedback.
- **Do** animate modals and sheets at 400–600ms with ease-out curves (cubicOut, not bounce).
- **Do** use emoji for purpose/category identity alongside or instead of generic icons.
- **Do** maintain WCAG AA contrast in both light and dark themes.
- **Do** use view-transition-friendly structure when morphing between list and detail (future Stream polish).

### Don't:
- **Don't** use `#000`, `#fff`, navy-and-gold fintech palettes, or generic SaaS hero-metric layouts.
- **Don't** add colored side-stripe borders on cards, alerts, or list items.
- **Don't** use gradient text (`background-clip: text`) for amounts or headings.
- **Don't** use glassmorphism (backdrop-blur + transparency) as the default for every surface; reserve for shell and input areas.
- **Don't** import Lucide or other external icon libraries; extend `icons.json` instead.
- **Don't** nest cards inside cards; use spacing and subtle borders to separate groups.
- **Don't** use bounce or elastic easing on UI transitions.
- **Don't** show punitive red, "OVERDUE", or shame language for missed entries.
- **Don't** open modals when inline expansion or bottom sheets suffice.
- **Don't** introduce off-palette colors (raw Tailwind blue/emerald on dashboard cards) without mapping to Zen semantic tokens.
