# Zen Ledger - Style Guide

## 1. Visual Philosophy: "Digital Softness"
The aesthetic is designed to reduce financial stress. It eschews the rigid, data-heavy look of traditional banking for a "Zen" feel: clay-like surfaces, muted organic colors, and soft typography.

## 2. Color Palette (Tailwind Tokens)

| Token | Hex/Value | Name | Usage |
| :--- | :--- | :--- | :--- |
| `bg-zen-oat` | `#F4F1EB` | Warm Oat | Primary background, mimics unbleached paper. |
| `bg-zen-white` | `rgba(255, 255, 255, 0.85)` | Frosted White | Card surfaces, provides a glass-morphism depth. |
| `text-zen-sage` | `#6B705C` | Deep Sage | Primary text, main CTA buttons, high contrast. |
| `text-zen-herb` | `#A5A58D` | Dried Herb | Subtitles, borders, inactive states. |
| `accent-zen-earn` | `#B7B7A4` | Dusty Green | Income indicators, positive growth. |
| `accent-zen-spend`| `#CB997E` | Terracotta | Expense indicators, alerts (non-punitive). |
| `btn-zen-almond` | `#DDBEA9` | Almond | Interactive elements, chip backgrounds. |

## 3. Typography
- **Headings**: `Nunito`, Weight 800 (Extra Bold).
    - *Purpose*: Friendly, bubbly, and approachable headers.
- **Body**: `Quicksand`, Weight 600 (Semi-Bold).
    - *Purpose*: Clean, geometric, yet organic for readability.
- **Numbers**: `Nunito`, Weight 700, Tabular-nums.
    - *Purpose*: Ensures vertical alignment in lists (monospaced numbers).

## 4. UI Components & Tokens

### 4.1 Cards (The "Floating" Surface)
- **Border Radius**: `24px` (`rounded-3xl` in Tailwind terms).
- **Shadow**: `0px 8px 24px -4px rgba(107, 112, 92, 0.12)`.
- **Transitions**: `ease-in-out`, `300ms` duration for hover/active states.

### 4.2 Buttons (The "Pill")
- **Radius**: `999px` (`rounded-full`).
- **Standard Height**: `48px` or `56px` for primary actions.
- **Micro-Interaction**: Subtle scale down (98%) on press.

### 4.3 Input Pill
- **Height**: `64px`.
- **Background**: White with subtle inner shadow (`inset 0px 2px 4px rgba(0,0,0,0.02)`).
- **Animation**: "Thinking" state uses a CSS pulse on the `bg-zen-almond` color.

## 5. Intricate Details
- **Noise Texture**: A global overlay with 2% opacity noise grain to break the digital flatness.
- **Gradients**: Use extremely subtle gradients (Sage to Herb) for charts, never stark linear transitions.
- **Spacing**: Generous whitespace. Minimum padding for cards should be `20px` (`p-5`).
- **Icons**: Soft-cornered SVG icons or specific Emojis for categories.

## 6. Implementation Notes (Tailwind)
```javascript
// tailwind.config.cjs
module.exports = {
  theme: {
    extend: {
      colors: {
        zen: {
          oat: '#F4F1EB',
          sage: '#6B705C',
          herb: '#A5A58D',
          earn: '#B7B7A4',
          spend: '#CB997E',
          almond: '#DDBEA9',
        }
      },
      fontFamily: {
        heading: ['Nunito', 'sans-serif'],
        body: ['Quicksand', 'sans-serif'],
      },
      borderRadius: {
        'zen': '24px',
      },
      boxShadow: {
        'zen-soft': '0px 8px 24px -4px rgba(107, 112, 92, 0.12)',
      }
    }
  }
}
```
