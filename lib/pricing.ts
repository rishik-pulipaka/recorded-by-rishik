// Local pricing constants — mirrors seed data in backend/app/seed.py
// Used for optimistic quote computation before the backend responds.

export const SHOOT_TYPES = [
  {
    id: "headshots",
    name: "Headshots",
    description: "Professional headshots for LinkedIn, acting portfolios & directories",
    emoji: "💼",
  },
  {
    id: "group_headshots",
    name: "Group Headshots",
    description: "Team & organization headshot sessions — priced per person",
    emoji: "👥",
  },
  {
    id: "modeling",
    name: "Modeling",
    description: "Individual modeling & portfolio sessions",
    emoji: "✨",
  },
  {
    id: "group_modeling",
    name: "Group Modeling",
    description: "Group modeling sessions — priced per person",
    emoji: "🌟",
  },
] as const;

export const PACKAGES = [
  // ── Headshots ────────────────────────────────────────────────────────────
  {
    id: "headshot-basic",
    shootType: "headshots",
    name: "Basic",
    price: 65,
    photos: "3",
    description: "Quick professional update",
    durationHours: 0.5,
  },
  {
    id: "headshot-standard",
    shootType: "headshots",
    name: "Standard",
    price: 100,
    photos: "5",
    description: "Covers all the bases — the most popular choice",
    durationHours: 0.75,
    popular: true,
  },
  {
    id: "headshot-pro",
    shootType: "headshots",
    name: "Pro",
    price: 175,
    photos: "10",
    description: "Full coverage with multiple looks",
    durationHours: 1,
  },
  // ── Group Headshots ───────────────────────────────────────────────────────
  {
    id: "group-headshot-sm",
    shootType: "group_headshots",
    name: "Small Group (2–4)",
    price: 55,
    photos: "3 per person",
    pricePerPerson: true,
    description: "$55 per person — 3 photos each",
    durationHours: 1,
  },
  {
    id: "group-headshot-md",
    shootType: "group_headshots",
    name: "Medium Group (5–9)",
    price: 45,
    photos: "3 per person",
    pricePerPerson: true,
    description: "$45 per person — 3 photos each",
    durationHours: 1.5,
  },
  {
    id: "group-headshot-lg",
    shootType: "group_headshots",
    name: "Large Group (10+)",
    price: 40,
    photos: "3 per person",
    pricePerPerson: true,
    description: "$40 per person — 3 photos each",
    durationHours: 2,
  },
  // ── Modeling ─────────────────────────────────────────────────────────────
  {
    id: "modeling-basic",
    shootType: "modeling",
    name: "Basic",
    price: 85,
    photos: "6",
    description: "Essential portfolio starter",
    durationHours: 1,
  },
  {
    id: "modeling-standard",
    shootType: "modeling",
    name: "Standard",
    price: 130,
    photos: "10–12",
    description: "Strong portfolio coverage",
    durationHours: 1.5,
  },
  {
    id: "modeling-pro",
    shootType: "modeling",
    name: "Pro",
    price: 200,
    photos: "15–18",
    description: "Full portfolio build with multiple looks",
    durationHours: 2,
  },
  // ── Group Modeling ────────────────────────────────────────────────────────
  {
    id: "group-modeling-sm",
    shootType: "group_modeling",
    name: "Small Group (2–4)",
    price: 70,
    photos: "6 per person",
    pricePerPerson: true,
    description: "$70 per person — 6 photos each",
    durationHours: 1.5,
  },
  {
    id: "group-modeling-md",
    shootType: "group_modeling",
    name: "Medium Group (5–9)",
    price: 60,
    photos: "6 per person",
    pricePerPerson: true,
    description: "$60 per person — 6 photos each",
    durationHours: 2,
  },
  {
    id: "group-modeling-lg",
    shootType: "group_modeling",
    name: "Large Group (10+)",
    price: 55,
    photos: "6 per person",
    pricePerPerson: true,
    description: "$55 per person — 6 photos each",
    durationHours: 2.5,
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
] as const;

export interface QuoteLineItem {
  label: string;
  amount: number;
}

export interface QuoteResult {
  lineItems: QuoteLineItem[];
  modifiers: QuoteLineItem[];
  subtotal: number;
  total: number;
  isPerPerson: boolean;
}

export function computeQuote(
  packageId: string,
  addonIds: string[]
): QuoteResult | null {
  const pkg = PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return null;

  const isPerPerson = "pricePerPerson" in pkg && pkg.pricePerPerson === true;
  const label = pkg.name + (isPerPerson ? " (per person)" : "");
  const lineItems: QuoteLineItem[] = [{ label, amount: pkg.price }];

  for (const id of addonIds) {
    const addon = ADDONS.find((a) => a.id === id);
    if (addon) lineItems.push({ label: addon.name, amount: addon.price });
  }

  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const modifiers: QuoteLineItem[] = [];
  const total = subtotal;

  return { lineItems, modifiers, subtotal, total, isPerPerson };
}
