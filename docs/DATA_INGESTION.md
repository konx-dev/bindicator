# Data Ingestion: Dual-PDF Merging & Schedule Validation

This document outlines the pipeline for converting council PDF calendars into normalized collection schedules.

---

## 1. Problem Statement

UK councils publish visual PDF collection calendars annually. For the target address, there are **two distinct PDFs**:
1. **Core Waste Calendar:** Covers Household Waste, Food Waste, Paper Recycling, and Mixed Recycling.
2. **Garden Waste Calendar:** Covers the paid annual garden waste subscription stream (runs on alternate weeks or specific seasonal intervals).

Scraping council web portals is fragile because layouts change frequently. However, because new PDFs are only issued **once per year**, an annual ingestion pipeline that produces a validated, version-controlled JSON file offers 100% runtime uptime.

---

## 2. Directory Layout for Annual Data

Raw scanned assets and normalized output are organized under `data/<year>/`:

```text
data/
├── sample/                         # Committed to git: lightweight test fixture
│   ├── raw/
│   │   └── README.md
│   └── schedule.json               # Sample schedule fixture for CI and testing
├── 2026/
│   ├── raw/                        # Local only (.gitignored, holds high-res scans)
│   │   ├── core-waste-schedule.png
│   │   └── garden-waste-schedule.png
│   └── schedule.json               # Committed to git: auditable JSON (~10 KB)
```

### Git Storage Policy: Option C (Local Raw Assets Ignored)
- High-resolution council image scans (~7 MB each) are `.gitignore`d under `data/**/raw/*`.
- Only the normalized, human-auditable **`schedule.json`** is committed to git.
- This keeps the repository featherweight (< 100 KB over a decade of use) while keeping raw images preserved locally for ingestion and re-runs.
- A committed `data/sample/` fixture ensures any new clone or CI runner can immediately validate schemas without downloading personal council scans.

---

## 3. Normalized Schedule Schema (`schedule.json`)

The target output format of the ingestion script is a clean, human-verifiable JSON file.

> **Note on Date Formats:**
> - In `schedule.json` and SQLite storage, collection dates strictly use the **ISO 8601** format (`YYYY-MM-DD`). This is required so database indexing, query sorting (`ORDER BY date ASC`), and JS string comparisons naturally sort chronologically without date-parsing overhead or day/month inversion bugs.
> - When displayed to the user in the Web UI, API display helpers, or calendar reminders, dates are consistently formatted to **UK standard** (`DD/MM/YYYY` or `Monday 6 January 2025`).

```json
{
  "year": 2025,
  "council": "Local Council Name",
  "generatedAt": "2025-01-10T12:00:00Z",
  "collections": [
    {
      "date": "2025-01-06",
      "binTypes": ["household_waste", "food_waste"],
      "notes": "Post-holiday collection adjustment"
    },
    {
      "date": "2025-01-13",
      "binTypes": ["mixed_recycling", "paper_recycling", "food_waste", "garden_waste"],
      "notes": null
    }
  ]
}
```

---

## 4. Ingestion & Merging Pipeline

### Merging Logic
When merging `core-waste-schedule.pdf` and `garden-waste-schedule.pdf`:
1. Dates are keyed by `YYYY-MM-DD`.
2. Core collections populate the base `binTypes` array for a given date.
3. Garden waste collections matching the same date append `"garden_waste"` into `binTypes`.
4. If garden waste is collected on a separate day entirely, a new date entry is inserted.
5. Entries are sorted chronologically.

### CLI Workflow
When new PDFs arrive once a year:

```bash
# Place PDFs into data/<year>/raw/
# Run ingestion script
pnpm --filter @bindicator/api run ingest:schedule --year 2025

# Inspect the generated data/2025/schedule.json in git diff
git diff data/2025/schedule.json

# Seed the database
pnpm --filter @bindicator/api run db:seed --year 2025
```

---

## 5. Resilience & Fallback

- **Manual Verification:** Because `schedule.json` is committed to git, you can visually review the dates or manually adjust a bank holiday override in seconds if a PDF layout was misread.
- **Offline / GitOps Boot:** The production container seeds from `schedule.json` on startup if the database is uninitialized, requiring zero internet access or PDF parsing in production.
