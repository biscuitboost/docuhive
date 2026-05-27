/**
 * Pricing and plan configuration for DocuHive subscriptions.
 */

export type PlanId = "essentials" | "pro" | "team";

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number; // in GBP (pounds)
  docsLimit: number | null; // null = unlimited
  multiUser: boolean;
  stripePriceId?: string;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  essentials: {
    id: "essentials",
    name: "Essentials",
    price: 49,
    docsLimit: 10,
    multiUser: false,
    stripePriceId: process.env.STRIPE_PRICE_ESSENTIALS,
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 79,
    docsLimit: null, // unlimited
    multiUser: false,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
  team: {
    id: "team",
    name: "Team",
    price: 99,
    docsLimit: null, // unlimited
    multiUser: true,
    stripePriceId: process.env.STRIPE_PRICE_TEAM,
  },
};

/**
 * Resolve a plan ID from a Stripe price ID.
 * Returns undefined if no match.
 */
export function getPlanByPriceId(priceId: string): PlanId | undefined {
  for (const [id, config] of Object.entries(PLANS)) {
    if (config.stripePriceId === priceId) return id as PlanId;
  }
  return undefined;
}

/**
 * Returns the plan config for a given plan ID.
 */
export function getPlan(planId: PlanId): PlanConfig {
  return PLANS[planId];
}

/**
 * Returns the monthly price in GBP formatted as a string.
 */
export function formatPlanPrice(planId: PlanId): string {
  const plan = PLANS[planId];
  return `£${plan.price}/mo`;
}
