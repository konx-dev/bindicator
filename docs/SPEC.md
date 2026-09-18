# Functional & Technical Specification

This document details domain models, API contracts, Web UI requirements, and iCal feed behavior.

---

## 1. Domain Models (`@bindicator/types`)

### Bin Stream Type & Configured Palette

The five household waste streams and their specific physical bin colors:

| Bin Stream ID | Bin Type Name | Bin Color | Hex Code | Badge Text | Description |
|---|---|---|---|---|---|
| `household_waste` | Household Waste | **Black** | `#18181B` | `#FFFFFF` | General non-recyclable domestic waste |
| `food_waste` | Food Waste | **Orange** | `#EA580C` | `#FFFFFF` | Food waste caddy, vegetable peelings, leftovers |
| `paper_recycling` | Paper Recycling | **Purple** | `#7C3AED` | `#FFFFFF` | Clean paper, cardboard, magazines, newspapers |
| `mixed_recycling` | Mixed Recycling | **Grey** | `#4B5563` | `#FFFFFF` | Clean plastic bottles/tins/cans, foil, glass bottles/jars |
| `garden_waste` | Garden Waste | **Green** | `#15803D` | `#FFFFFF` | Grass clippings, shrub trimmings (paid subscription) |

```typescript
export type BinTypeId =
  | 'household_waste'
  | 'food_waste'
  | 'paper_recycling'
  | 'mixed_recycling'
  | 'garden_waste';

export interface BinType {
  id: BinTypeId;
  name: string;
  description: string;
  colorHex: string;
  badgeTextColor: string;
  iconName: string;
}

export interface CollectionEvent {
  id: number;
  date: string; // ISO 8601 YYYY-MM-DD for database & JSON serialization
  displayDateUK?: string; // Formatted UK date for UI display: DD/MM/YYYY (e.g. 24/03/2025)
  bins: BinType[];
  notes?: string;
  daysUntil?: number;
  isToday?: boolean;
  isTomorrow?: boolean;
}
```

### Date Standards: Storage vs. Presentation
- **Data Layer / API Transmission:** Strict ISO 8601 string (`YYYY-MM-DD`). Guarantees correct chronological indexing, SQL `ORDER BY date ASC` sorting, and standard `Date` parsing without ambiguous locale inversion.
- **UI / Presentation Layer:** UK format (`DD/MM/YYYY` or long format like `Monday 24 March 2025`). All date displays rendered in the React UI, calendar titles, or notifications must follow UK conventions.

---

## 2. API Endpoints Contract

### Base URL: `/api/v1`

#### `GET /api/v1/bins/next`
Returns the next collection event strictly relative to today's date (or today's collection if requested before collection cutoff time, e.g. 14:00).

- **Response:** `200 OK`
```json
{
  "data": {
    "id": 14,
    "date": "2025-03-24",
    "daysUntil": 1,
    "isToday": false,
    "isTomorrow": true,
    "bins": [
      {
        "id": "mixed_recycling",
        "name": "Mixed Recycling",
        "colorHex": "#4B5563",
        "badgeTextColor": "#FFFFFF",
        "description": "Clean plastics, tins, cans, foil, glass bottles and jars",
        "iconName": "recycle"
      },
      {
        "id": "food_waste",
        "name": "Food Waste",
        "colorHex": "#EA580C",
        "badgeTextColor": "#FFFFFF",
        "description": "Food scraps, peelings, tea bags in compostable bags",
        "iconName": "apple"
      }
    ],
    "notes": null
  }
}
```

#### `GET /api/v1/bins/schedule`
Query collections across a date range.

- **Query Parameters:**
  - `from` (optional): `YYYY-MM-DD` (defaults to today)
  - `to` (optional): `YYYY-MM-DD` (defaults to 90 days from `from`)
  - `limit` (optional): Integer (default: 20)
- **Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 14,
      "date": "2025-03-24",
      "bins": [...],
      "daysUntil": 1
    },
    {
      "id": 15,
      "date": "2025-03-31",
      "bins": [...],
      "daysUntil": 8
    }
  ],
  "meta": {
    "total": 2
  }
}
```

#### `GET /api/v1/calendar.ics`
Generates a dynamic RFC 5545 `.ics` subscription calendar stream.

- **Headers:**
  - `Content-Type: text/calendar; charset=utf-8`
  - `Content-Disposition: inline; filename="bindicator-schedule.ics"`
- **Event Properties:**
  - `SUMMARY`: e.g. `Bins: Mixed Recycling, Food Waste`
  - `DTSTART`: Collection morning (e.g. `20250324T070000Z`)
  - `DTEND`: Collection morning (e.g. `20250324T120000Z`)
  - `DESCRIPTION`: Clear list of what bins need to go to the curb.
  - `VALARM`: Triggered at `-PT11H` (7:00 PM the preceding evening) with message *"Reminder: Put out Mixed Recycling and Food Waste tonight"*.

---

## 3. Web UI Specifications

The Web frontend is a single-page responsive dashboard optimized for mobile and desktop screens.

### Views & Components

1. **Header:**
   - App title ("Bindicator") with house/pin indicator.
   - Quick action link: "Subscribe to Calendar".

2. **Hero: "Next Collection" Card:**
   - Large glanceable state indicator:
     - **"TODAY"** (high urgency pulse).
     - **"TOMORROW"** (accent warning badge).
     - **"In X days"** (e.g., "In 4 days - Tuesday 25 March").
   - Distinct visual color chips/badges for every bin due on that date.
   - Expandable guide: clicking a bin reveals what items belong in it.

3. **Schedule Timeline / Upcoming List:**
   - Displays the next 4 to 8 upcoming pickups in sequential order.
   - Clear visual separation between regular collection weeks and garden waste dates.

4. **"Subscribe to Calendar" Modal / Drawer:**
   - Displays the one-click `webcal://` link for iOS / Apple Calendar.
   - "Copy Calendar Link" button for Google Calendar / Outlook web subscription.
   - Step-by-step instructions for partners/housemates/neighbors to subscribe.

5. **Shadcn Component Library Compatibility:**
   - Built to consume clean primitives: `Button`, `Card`, `Badge`, `Dialog`, `Calendar`, `Tooltip`.
   - Tailwind color tokens cleanly mapped to bin themes.
