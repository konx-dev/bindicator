# AGENTS.md

> Guidance and instructions for AI agents (OpenCode, Cursor, GitHub Copilot, Claude, etc.) operating in the Bindicator repository.

---

## 1. Project Mission & Context

Bindicator is a personal, single-address bin collection tracking service for the UK household of Oliver Cox.
It provides:
1. **Web Dashboard:** Glanceable UI to see which bins go out tonight/tomorrow.
2. **REST API:** Fast endpoints to query the schedule.
3. **iCalendar Feed (`.ics`):** Subscription endpoint for mobile/calendar alerts.
4. **Data Ingestion Pipeline:** Merges two annual council PDFs (Core Waste + Paid Garden Waste) into a validated JSON schedule.

---

## 2. Core Technical Decisions & Architecture

- **Language:** TypeScript across the entire repository.
- **Monorepo Manager:** `pnpm` workspaces (`api/`, `web/`, `packages/types/`).
- **Backend API (`api/`):** [Hono](https://hono.dev/) on Node.js.
  - Keep it lightweight, modular, and adhere to Web standards (`fetch`, `Request`, `Response`).
  - Use Drizzle ORM with SQLite for persistent storage.
- **Frontend Web (`web/`):** React 18+ with Vite and Tailwind CSS.
  - Architecture prepared to consume an external/shared packaged Shadcn component library.
  - Never hardcode mock schedules or bin data in React components; always fetch from the API using `@bindicator/types`.
- **Database:** Local SQLite (`bindicator.db`).
- **Calendar:** Dynamic RFC 5545 iCalendar (`.ics`) generation using standard iCal libraries (e.g. `ical-generator`).

---

## 3. The 5 Bin Types (Domain Rules)

All code and data models must strictly recognize these 5 bin streams:
1. `household_waste`: General non-recyclable domestic waste (Black/Grey).
2. `food_waste`: Food caddy collection (Green/Brown caddy).
3. `paper_recycling`: Paper, newspapers, shredded paper, clean card (Blue box/wheelie).
4. `mixed_recycling`: Clean plastic bottles/trays, tin cans, foil, glass jars/bottles.
5. `garden_waste`: Organic garden cuttings, lawn trimmings (Brown/Green bin, paid annual service).

*Note:* Multiple bins can and frequently do share the same collection date (e.g., Household Waste + Food Waste on the same morning).

---

## 4. Operational & Coding Conventions

- **Type Sharing:** Always declare shared data contracts, DTOs, and enums in `packages/types/` (or the shared types module). Both `api` and `web` must import from this shared package.
- **No Unvetted Dependencies:** Avoid adding massive frameworks or unnecessary libraries. Keep the dependency footprint small.
- **Git Hygiene:**
  - Branch naming: `feat/<name>`, `fix/<name>`, `docs/<name>`, `chore/<name>`.
  - Conventional Commits: e.g. `feat(api): add /api/v1/bins/next endpoint`, `docs: update ARCHITECTURE.md`.
  - Never commit generated SQLite databases (`*.db`), secrets, or raw unnormalized test outputs.
  - Never commit directly to `main` without a branch and PR workflow.
- **Verification Loop:**
  - When making code changes, always run the relevant workspace lint, typecheck, and test scripts:
    - `pnpm --filter @bindicator/api test`
    - `pnpm --filter @bindicator/web build`
    - `pnpm -r typecheck`

---

## 5. File Map Reference

```text
bindicator/
├── README.md                 # Primary project readme
├── AGENTS.md                 # This agent instruction guide
├── docs/
│   ├── ARCHITECTURE.md       # Full monorepo & database architecture
│   ├── SPEC.md               # API contracts, data models & UI spec
│   ├── DATA_INGESTION.md     # Dual-PDF extraction & merge strategy
│   └── DEPLOYMENT.md         # Docker & k3s GitOps deployment
├── api/                      # @bindicator/api (Hono + Drizzle)
├── web/                      # @bindicator/web (React + Vite)
├── packages/
│   └── types/                # @bindicator/types (Shared DTOs & schemas)
└── data/                     # Annual PDF assets and normalized schedule JSON
    └── <year>/
        ├── raw/              # Original council PDFs
        └── schedule.json     # Validated, parsed schedule
```
