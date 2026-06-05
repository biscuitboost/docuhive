/**
 * Pricing and plan configuration for DocuHive subscriptions.
 */

export type PlanId = "essentials" | "pro" | "team";
export type BillingMode = "monthly" | "annual";

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number; // in GBP (monthly)
  annualPrice: number; // in GBP (annual — 2 months free)
  docsLimit: number | null; // null = unlimited
  multiUser: boolean;
  allowBranding: boolean;
  stripePriceId?: string;
  stripeAnnualPriceId?: string;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  essentials: {
    id: "essentials",
    name: "Essentials",
    price: 49,
    annualPrice: 490, // 10 months for price of 12 (save £98)
    docsLimit: 10,
    multiUser: false,
    allowBranding: false,
    stripePriceId: process.env.STRIPE_PRICE_ESSENTIALS,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_ESSENTIALS_ANNUAL,
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 79,
    annualPrice: 790, // 10 months for price of 12 (save £158)
    docsLimit: null, // unlimited
    multiUser: false,
    allowBranding: true,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_PRO_ANNUAL,
  },
  team: {
    id: "team",
    name: "Team",
    price: 99,
    annualPrice: 990, // 10 months for price of 12 (save £198)
    docsLimit: null, // unlimited
    multiUser: true,
    allowBranding: true,
    stripePriceId: process.env.STRIPE_PRICE_TEAM,
    stripeAnnualPriceId: process.env.STRIPE_PRICE_TEAM_ANNUAL,
  },
};

/**
 * Resolve a plan ID from a Stripe price ID (checks both monthly and annual).
 * Returns undefined if no match.
 */
export function getPlanByPriceId(priceId: string): PlanId | undefined {
  for (const [id, config] of Object.entries(PLANS)) {
    if (config.stripePriceId === priceId || config.stripeAnnualPriceId === priceId) return id as PlanId;
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
 * Returns the price in GBP formatted as a string.
 */
export function formatPlanPrice(planId: PlanId, mode: BillingMode = "monthly"): string {
  const plan = PLANS[planId];
  if (mode === "annual") return `£${plan.annualPrice}/yr`;
  return `£${plan.price}/mo`;
}

/**
 * Returns the effective price ID for a given plan and billing mode.
 */
export function getPriceId(planId: PlanId, mode: BillingMode): string | undefined {
  const plan = PLANS[planId];
  return mode === "annual" ? plan.stripeAnnualPriceId : plan.stripePriceId;
}

/**
 * Returns the annual savings compared to monthly billing.
 */
export function getAnnualSavings(planId: PlanId): number {
  const plan = PLANS[planId];
  return Math.round(plan.price * 12 - plan.annualPrice);
}

/**
 * Returns the annual savings as a percentage.
 */
export function getAnnualSavingsPercent(planId: PlanId): number {
  const plan = PLANS[planId];
  return Math.round((1 - plan.annualPrice / (plan.price * 12)) * 100);
}
