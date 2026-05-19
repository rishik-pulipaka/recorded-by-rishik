// Local pricing constants — mirrors seed data in backend/app/seed.py
// Used for optimistic quote computation before the backend responds.

export const SHOOT_TYPES = [
  {
    id: "portraits",
    name: "Portraits",
    description: "Individual & group portrait sessions",
    emoji: "🎭",
  },
  {
    id: "events",
    name: "Events",
    description: "Birthdays, corporate, social events",
    emoji: "🎉",
  },
  {
    id: "headshots",
    name: "Headshots",
    description: "Professional headshots for LinkedIn & resumes",
    emoji: "💼",
  },
  {
    id: "products",
    name: "Products",
    description: "Product & commercial photography",
    emoji: "📦",
  },
  {
    id: "real_estate",
    name: "Real Estate",
    description: "Interior & exterior property photography",
    emoji: "🏠",
  },
] as const;

export const PACKAGES = [
  {
    id: "30min",
    name: "30 Minutes",
    price: 65,
    photos: "3–5",
    description: "Quick session, perfect for headshots",
    durationHours: 0.5,
  },
  {
    id: "1hr",
    name: "1 Hour",
    price: 100,
    photos: "8–12",
    description: "Standard session for most needs",
    durationHours: 1,
  },
  {
    id: "2hr",
    name: "2 Hours",
    price: 175,
    photos: "15–20",
    description: "Extended session with multiple looks",
    durationHours: 2,
    popular: true,
  },
  {
    id: "half-day",
    name: "Half Day",
    price: 300,
    photos: "30–40",
    description: "4 hours of deep coverage",
    durationHours: 4,
  },
  {
    id: "full-day",
    name: "Full Day",
    price: 500,
    photos: "60+",
    description: "8 hours — the complete experience",
    durationHours: 8,
  },
] as const;

export const ADDONS = [
  {
    id: "extra-edits",
    name: "Extra Edits",
    detail: "+5 fully edited photos",
    price: 25,
  },
  {
    id: "rush",
    name: "Rush Delivery",
    detail: "Receive photos in 48 hours",
    price: 50,
  },
  {
    id: "second-location",
    name: "Second Location",
    detail: "Shoot at two different spots",
    price: 40,
  },
  {
    id: "prints",
    name: "Print Package",
    detail: "Set of 4×6 prints (20 photos)",
    price: 75,
  },
] as const;

export const WEEKEND_SURCHARGE_PCT = 15;

export interface QuoteLineItem {
  label: string;
  amount: number;
}

export interface QuoteResult {
  lineItems: QuoteLineItem[];
  modifiers: QuoteLineItem[];
  subtotal: number;
  total: number;
}

export function computeQuote(
  packageId: string,
  addonIds: string[],
  dateStr: string
): QuoteResult | null {
  const pkg = PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return null;

  const lineItems: QuoteLineItem[] = [{ label: pkg.name, amount: pkg.price }];

  for (const id of addonIds) {
    const addon = ADDONS.find((a) => a.id === id);
    if (addon) lineItems.push({ label: addon.name, amount: addon.price });
  }

  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const modifiers: QuoteLineItem[] = [];

  if (dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    if (d.getDay() === 0 || d.getDay() === 6) {
      modifiers.push({
        label: `Weekend surcharge (${WEEKEND_SURCHARGE_PCT}%)`,
        amount: Math.round(subtotal * (WEEKEND_SURCHARGE_PCT / 100)),
      });
    }
  }

  const total = subtotal + modifiers.reduce((s, m) => s + m.amount, 0);
  return { lineItems, modifiers, subtotal, total };
}
