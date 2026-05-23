# Zen Ledger

Calm personal finance through conversational input. Log transactions in plain language ("Coffee 5", "Salary 2000"), review ambiguous captures when needed, and see where you stand without spreadsheet anxiety.

**Stack:** SvelteKit 2 · Svelte 5 · Tailwind CSS v4 · localStorage (SQLite planned)

## Quick start

```sh
npm install
npm run dev      # http://localhost:5173
npm run check    # svelte-check
npm test         # Playwright (19 tests)
npm run build
```

## Routes

| Path | Screen |
|------|--------|
| `/` | Pulse — safe-to-spend hero, recent activity |
| `/stream` | Full transaction feed with search & filters |
| `/insight` | Stories + wealth ledger |
| `/settings` | Profile, export/import, recurring |
| `/purposes`, `/parties` | Entity management |

**Capture:** Tap the **+** FAB → type in the bottom sheet → Enter. High-confidence input saves immediately with toast + card highlight; low-confidence input opens a **review sheet** before save.

## Documentation

| Doc | Description |
|-----|-------------|
| [Documents/STATUS.md](./Documents/STATUS.md) | **Current status**, bugs fixed, what's next |
| [PRODUCT.md](./PRODUCT.md) | Product purpose, IA, features, tone |
| [DESIGN.md](./DESIGN.md) | Design system tokens and components |
| [Documents/requirements.md](./Documents/requirements.md) | Requirements with completion notes |
| [Documents/tasks.md](./Documents/tasks.md) | Implementation task checklist |
| [Documents/plans.md](./Documents/plans.md) | Phased roadmap |
| [trashed/README.md](./trashed/README.md) | Obsolete code, docs, and archives (not used by app) |

## License

Private project.
