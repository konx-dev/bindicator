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

export const BIN_TYPES: Record<BinTypeId, BinType> = {
  household_waste: {
    id: 'household_waste',
    name: 'Household Waste',
    description: 'General non-recyclable domestic waste',
    colorHex: '#18181B',
    badgeTextColor: '#FFFFFF',
    iconName: 'trash',
  },
  food_waste: {
    id: 'food_waste',
    name: 'Food Waste',
    description: 'Food waste caddy collection, scraps, peelings',
    colorHex: '#EA580C',
    badgeTextColor: '#FFFFFF',
    iconName: 'apple',
  },
  paper_recycling: {
    id: 'paper_recycling',
    name: 'Paper Recycling',
    description: 'Clean paper, cardboard, magazines, newspapers',
    colorHex: '#7C3AED',
    badgeTextColor: '#FFFFFF',
    iconName: 'file-text',
  },
  mixed_recycling: {
    id: 'mixed_recycling',
    name: 'Mixed Recycling',
    description: 'Clean plastic bottles/trays, tin cans, foil, glass jars/bottles',
    colorHex: '#4B5563',
    badgeTextColor: '#FFFFFF',
    iconName: 'recycle',
  },
  garden_waste: {
    id: 'garden_waste',
    name: 'Garden Waste',
    description: 'Organic garden cuttings, lawn trimmings (paid subscription)',
    colorHex: '#15803D',
    badgeTextColor: '#FFFFFF',
    iconName: 'trees',
  },
};

export interface CollectionEvent {
  id: number;
  date: string; // ISO 8601 YYYY-MM-DD
  displayDateUK?: string; // Formatted UK date: DD/MM/YYYY or long format
  bins: BinType[];
  notes?: string | null;
  daysUntil?: number;
  isToday?: boolean;
  isTomorrow?: boolean;
}

export interface NextCollectionResponse {
  data: CollectionEvent | null;
}

export interface ScheduleResponse {
  data: CollectionEvent[];
  meta: {
    total: number;
  };
}

export interface BinTypesResponse {
  data: BinType[];
}

export interface IngestionCollectionEntry {
  date: string; // YYYY-MM-DD
  binTypes: BinTypeId[];
  notes?: string | null;
}

export interface AnnualScheduleFile {
  year: number;
  council: string;
  generatedAt: string;
  collections: IngestionCollectionEntry[];
}
