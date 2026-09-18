# System Architecture

This document describes the high-level architecture, monorepo setup, component interactions, and storage design for Bindicator.

---

## 1. Architectural Philosophy

Bindicator is built on three core tenets:
1. **Zero External Runtime Dependencies for Core Data:** Rather than querying brittle council web portals in real-time, the application operates on an annual, validated local schedule stored in SQLite.
2. **End-to-End TypeScript:** Full type safety shared across backend and frontend, minimizing duplication and runtime contract bugs.
3. **Glanceable & Frictionless:** The UI should be instant, responsive, and provide immediate clarity in < 2 seconds. The iCal feed extends access to native mobile calendar widgets without even opening the app.

---

## 2. Monorepo Organization

Bindicator uses **pnpm workspaces** to manage packages with strict boundaries:

```text
bindicator/
├── package.json              # Monorepo root package.json (scripts, devDependencies)
├── pnpm-workspace.yaml       # Workspace definition: api, web, packages/*
├── tsconfig.base.json        # Shared TypeScript base configuration
├── api/                      # Backend API (Hono, Drizzle, Node)
├── web/                      # Frontend App (React, Vite, Tailwind)
├── packages/
│   └── types/                # Shared types (@bindicator/types)
└── data/                     # Schedule PDFs and annual JSON files
```

### Workspace Boundaries

- **`packages/types`**: Declares TypeScript interfaces, enums, and Zod schemas. Has zero runtime dependencies on `api` or `web`.
- **`api`**: Depends on `packages/types`. Serves JSON REST endpoints, manages SQLite persistence via Drizzle, and generates the dynamic `.ics` calendar feed.
- **`web`**: Depends on `packages/types`. Uses React 18+ and Vite. Pre-configured for consuming components from a shared Shadcn UI package.

---

## 3. Data & Storage Layer

### SQLite with Drizzle ORM
Because Bindicator serves a single household with predictable annual schedules (< 100 collections per year), SQLite is the ideal database engine:
- Zero operational overhead (no running database daemon required).
- Embedded within the container with file persistence on a mounted volume.
- Backups are as simple as copying a single `.db` file.
- Drizzle ORM provides lightweight, fully typed queries without the heavyweight memory footprint of Prisma.

### Database Schema Design

#### `bin_types` Table
Stores metadata for each waste stream.

| Column | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | Enum key: `household_waste`, `food_waste`, `paper_recycling`, `mixed_recycling`, `garden_waste` |
| `name` | `TEXT NOT NULL` | Display name (e.g. "Household Waste") |
| `description` | `TEXT NOT NULL` | Guidance on what can be placed in this bin |
| `color_hex` | `TEXT NOT NULL` | Primary color badge: Household (`#18181B`), Food (`#EA580C`), Paper (`#7C3AED`), Mixed (`#4B5563`), Garden (`#15803D`) |
| `icon_name` | `TEXT NOT NULL` | Lucide icon identifier |

#### `collections` Table
Stores each scheduled collection date.

| Column | Type | Description |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Unique identifier |
| `date` | `TEXT NOT NULL` | ISO date string (`YYYY-MM-DD`), indexed |
| `notes` | `TEXT` | Optional notes (e.g., "Bank holiday delay") |

#### `collection_bins` Junction Table
Maps collections to bin types (one collection day can have multiple bins).

| Column | Type | Description |
|---|---|---|
| `collection_id` | `INTEGER NOT NULL` | Foreign key referencing `collections.id` (CASCADE) |
| `bin_type_id` | `TEXT NOT NULL` | Foreign key referencing `bin_types.id` |
| `PRIMARY KEY` | `(collection_id, bin_type_id)` | Compound primary key |

---

## 4. API Layer (Hono)

[Hono](https://hono.dev/) is selected for its high performance, zero-dependency philosophy, and native adherence to Web standard APIs.

```text
Client (Web / Mobile / Calendar)
            │
            ▼
┌───────────────────────────────────────┐
│              Hono Server              │
│                                       │
│  GET /api/v1/bins/next                │
│  GET /api/v1/bins/schedule            │
│  GET /api/v1/bins/types               │
│  GET /api/v1/calendar.ics             │
│  GET /health                          │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│        Drizzle ORM / SQLite           │
│        (bindicator.db)                │
└───────────────────────────────────────┘
```

---

## 5. Calendar Integration Architecture

Calendar synchronization is delivered using standard **iCalendar (RFC 5545)** rather than OAuth-heavy Google Calendar APIs.

### Why RFC 5545 (`.ics`)?
1. **Zero Authentication:** No Google Cloud Console setup, client secrets, token expiration, or OAuth consent screens.
2. **Universal Compatibility:** Works out of the box with Apple Calendar (iOS/macOS), Google Calendar (Web/Android), Outlook, and Thunderbird.
3. **Automatic Background Sync:** Calendars poll the subscription URL automatically.
4. **Alarms/Notifications:** The generated iCal feed embeds pre-configured alarms (e.g., alert at 7:00 PM the evening before collection).
