# Bindicator

> A minimal, reliable, self-hosted household bin collection schedule indicator and calendar sync service.

Bindicator provides an instant answer to the weekly question: *"Which bins go out tonight?"*

Designed specifically for single-address / household accuracy without relying on fragile external scrapers, Bindicator combines annual council collection schedules (including separate paid subscription streams like garden waste) into a clean, unified dashboard, an API, and an auto-updating calendar feed (`.ics`).

---

## Features

- **Dashboard Web UI:** Clean, responsive, glanceable card showing which bin(s) are due next, a countdown ("Tomorrow", "In 3 days"), and an upcoming collection timeline.
- **Lightweight JSON API:** Fast REST endpoints returning upcoming and historical collection dates.
- **Calendar Feed (`iCal / .ics`):** Subscribe once on iPhone, Android, or Google Calendar to receive automated collection reminders.
- **Dual-PDF Ingestion:** Supports merging separate annual PDF calendars (e.g. Core Council Waste + Paid Garden Waste) into an auditable, normalized JSON schedule.
- **Self-Host & GitOps Ready:** Runs as a lightweight Docker container with persistent SQLite storage, easily deployed on k3s, Docker Compose, or Unraid/homelab setups.

---

## Tech Stack

- **Monorepo:** `pnpm` workspaces
- **Backend API:** TypeScript + [Hono](https://hono.dev/) on Node.js (fast, modern Web standard framework with zero baggage)
- **Frontend Web:** React + [Vite](https://vitejs.dev/) + Tailwind CSS (configured to consume a custom packaged Shadcn UI library)
- **Shared Types:** TypeScript shared types package (`@bindicator/types`) for end-to-end type safety between API and Web
- **Database:** SQLite via [Drizzle ORM](https://orm.drizzle.team/)
- **Deployment:** Docker (multi-stage build), k3s / GitOps-ready

---

## Repository Structure

```text
bindicator/
├── README.md               # Project overview & getting started (you are here)
├── AGENTS.md               # Context, rules, and conventions for AI assistants
├── docs/
│   ├── ARCHITECTURE.md     # System architecture, monorepo layout, database design
│   ├── SPEC.md             # Domain models, API contracts, Web UI specifications
│   ├── DATA_INGESTION.md   # PDF extraction workflow (core waste + garden waste)
│   └── DEPLOYMENT.md       # Docker, k3s, and GitOps deployment guides
├── api/                    # Hono backend API service
├── web/                    # React + Vite frontend application
└── data/                   # Annual raw PDFs and generated schedule files
```

---

## Monorepo Layout & Workspaces

The repository will be structured with `pnpm` workspaces:

| Workspace Path | Package Name | Description |
|---|---|---|
| `api/` | `@bindicator/api` | Hono REST API, iCal generation, Drizzle SQLite schema & migrations |
| `web/` | `@bindicator/web` | React + Vite UI dashboard and calendar subscription view |
| `packages/types/` | `@bindicator/types` | Shared TypeScript domain models, schemas, and API request/response types |

---

## Quickstart (Local Development)

### Prerequisites
- Node.js >= 22.x LTS (Active LTS)
- `pnpm` >= 9.0.0 < 10.0.0 (e.g. `pnpm@9.15.x`)

### Setup & Run
```bash
# Clone the repository
git clone https://github.com/olivercox/bindicator.git
cd bindicator

# Install dependencies
pnpm install

# Ingest or seed schedule data
pnpm --filter @bindicator/api run db:migrate
pnpm --filter @bindicator/api run db:seed

# Start development servers (API + Web concurrently)
pnpm dev
```

---

## Documentation Links

For in-depth guides and specifications, refer to:
- [System Architecture](docs/ARCHITECTURE.md)
- [API & UI Specifications](docs/SPEC.md)
- [Data Ingestion & PDF Merging](docs/DATA_INGESTION.md)
- [Deployment & GitOps](docs/DEPLOYMENT.md)
- [Agent Context & Guidelines](AGENTS.md)
