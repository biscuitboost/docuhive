import Stripe from "stripe";
import { stripe } from "./client";
import { db } from "@/lib/db";
import { tenants, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPlanByPriceId, PLANS, type PlanId } from "./pricing";

/**
 * Maps Stripe subscription statuses to our enum.
 */
const STATUS_MAP: Record<string, "active" | "past_due" | "cancelled" | "trialing"> = {
  active: "active",
  past_due: "past_due",
  canceled: "cancelled",
  trialing: "trialing",
  incomplete: "past_due",
  incomplete_expired: "cancelled",
  unpaid: "past_due",
  paused: "active",
};

/**
 * Shared logic for creating or updating a subscription record from a Stripe Subscription object.
 */
async function upsertSubscription(sub: Stripe.Subscription, tenantId?: string) {
  const priceId = sub.items.data[0]?.price?.id;
  const plan = priceId ? getPlanByPriceId(priceId) : undefined;

  const values = {
    status: STATUS_MAP[sub.status] ?? "past_due",
    stripePriceId: priceId,
    plan: plan ?? undefined,
    currentPeriodStart: sub.current_period_start
      ? new Date(sub.current_period_start * 1000)
      : undefined,
    currentPeriodEnd: sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : undefined,
    updatedAt: new Date(),
  };

  // Try update first — then check if the subscription record exists
  await db
    .update(subscriptions)
    .set(values)
    .where(eq(subscriptions.stripeSubscriptionId, sub.id));

  // Check if subscription record exists (handles race: .created/.updated arriving before .completed)
  const existing = await db
    .select({ tenantId: subscriptions.tenantId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))
    .limit(1);

  if (existing.length === 0) {
    // Subscription record doesn't exist yet — insert it
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId && sub.metadata?.tenantId) {
      resolvedTenantId = sub.metadata.tenantId;
    }
    if (!resolvedTenantId && sub.customer) {
      const tenantLookup = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.stripeCustomerId, sub.customer as string))
        .limit(1);
      if (tenantLookup.length > 0) {
        resolvedTenantId = tenantLookup[0].id;
      }
    }

    if (resolvedTenantId) {
      const insertPlan = plan ?? ("essentials" as const);
      await db.insert(subscriptions).values({
        tenantId: resolvedTenantId,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId ?? "",
        status: STATUS_MAP[sub.status] ?? "active",
        plan: insertPlan,
        documentsUsed: 0,
        currentPeriodStart: values.currentPeriodStart,
        currentPeriodEnd: values.currentPeriodEnd,
        updatedAt: values.updatedAt,
      });
    }
  }
}

/**
 * Webhook handler for Stripe events.
 * Processes checkout.session.completed, customer.subscription.created/updated/deleted.
 */
export async function handleStripeWebhook(
  body: string,
  signature: string
): Promise<{ received: boolean }> {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch (err) {
    throw err;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenantId;
      if (!tenantId) break;

      const priceId =
        session.metadata?.plan
          ? PLANS[session.metadata.plan as PlanId]?.stripePriceId
          : undefined;

      const subId = session.subscription as string | undefined;
      const customerId = session.customer as string | undefined;

      // Update tenant with Stripe customer + subscription IDs
      await db
        .update(tenants)
        .set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subId,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId));

      // Create initial subscription record (the .updated webhook refines period dates later)
      if (subId) {
        const plan = priceId ? getPlanByPriceId(priceId) : undefined;

        // Only insert if not already created by .created / .updated webhook
        const existing = await db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, subId))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(subscriptions).values({
            tenantId,
            stripeSubscriptionId: subId,
            stripePriceId: priceId ?? "",
            status: "active",
            plan: plan ?? "essentials",
            documentsUsed: 0,
          });
        }
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;

      // Try to resolve tenantId from the subscription's metadata or Stripe customer
      let tenantId = sub.metadata?.tenantId;
      if (!tenantId && sub.customer) {
        const tenantLookup = await db
          .select({ id: tenants.id })
          .from(tenants)
          .where(eq(tenants.stripeCustomerId, sub.customer as string))
          .limit(1);
        if (tenantLookup.length > 0) {
          tenantId = tenantLookup[0].id;
        }
      }

      await upsertSubscription(sub, tenantId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await db
        .update(subscriptions)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(
          eq(subscriptions.stripeSubscriptionId, sub.id)
        );
      break;
    }

    default:
      console.log("Unhandled event type:", event.type);
  }

  return { received: true };
}