# Functional & Technical Specification

This document details domain models, API contracts, Web UI requirements, and iCal feed behavior.

---

## 1. Domain Models (`@bindicator/types`)

### Bin Stream Type
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
  date: string; // ISO 8601 YYYY-MM-DD
  bins: BinType[];
  notes?: string;
  daysUntil?: number;
  isToday?: boolean;
  isTomorrow?: boolean;
}
```

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
        "colorHex": "#2563EB",
        "badgeTextColor": "#FFFFFF",
        "description": "Clean plastics, tins, cans, foil, glass bottles and jars",
        "iconName": "recycle"
      },
      {
        "id": "food_waste",
        "name": "Food Waste",
        "colorHex": "#15803D",
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
