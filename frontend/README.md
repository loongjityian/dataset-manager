# Frontend

React + TypeScript, built with Vite. Server data goes through TanStack Query; styling is Tailwind.

```sh
pnpm install
pnpm dev          # http://localhost:5173, proxies /api to the backend on :8000
pnpm test         # unit and UI tests (Vitest)
pnpm test:e2e     # browser tests against the real backend (Playwright)
pnpm lint && pnpm build
```

## Where things live

| Folder | What it holds | Backend equivalent |
|---|---|---|
| `src/api/` | The only code that calls the backend, plus its response types | `repositories/`, `schemas/` |
| `src/features/<domain>/` | Pages and components for one domain, and `queries.ts`: the hooks that load and change its data | `services/` |
| `src/components/` | UI shared across features (dialogs, notices, icons, toasts) | — |
| `src/app/` | Routes, layout, providers and app-wide setup | `main.py`, `api/` |
| `src/lib/` | Plain helpers: formatting, class names and button styles | `utils/` |
| `src/test/` | Test setup and an in-memory fake backend | `tests/conftest.py` |
| `e2e/` | Playwright tests | — |

Tests sit next to the feature they cover (`features/rows/rows.test.tsx`).
Colours and fonts are defined once in `src/index.css`.
