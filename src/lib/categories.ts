export const CATEGORIES = [
  "meals",
  "travel_airfare",
  "travel_ground",
  "lodging",
  "office_supplies",
  "software_subscriptions",
  "professional_services",
  "telecommunications",
  "postage_shipping",
  "printing_reproduction",
  "equipment",
  "conferences_training",
  "dues_memberships",
  "marketing_advertising",
  "client_gifts",
  "insurance",
  "bank_fees",
  "taxes_licenses",
  "repairs_maintenance",
  "utilities",
  "rent",
  "charitable_contributions",
  "miscellaneous",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c, c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())])
) as Record<Category, string>;

export const CATEGORY_SET = new Set<string>(CATEGORIES);
