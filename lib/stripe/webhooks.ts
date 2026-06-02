import Stripe from "stripe";
import { stripe } from "./client";
import { db } from "@/lib/db";
import { tenants, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPlanByPriceId, PLANS, type PlanId } from "./pricing";

/**
 * Maps Stripe subscription statuses to our enum.
 * Stripe sends: incomplete, incomplete_expired, trialing, active,
 *   past_due, canceled, unpaid, paused.
 * We normalize to our subset: active, past_due, cancelled, trialing.
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
 * Webhook handler for Stripe events.
 * Processes checkout.session.completed, customer.subscription.updated/deleted.
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

      // Determine price ID: expanded line_items if available, or metadata fallback
      const priceId =
        session.line_items?.data[0]?.price?.id ??
        (session.metadata?.plan
          ? PLANS[session.metadata.plan as PlanId]?.stripePriceId
          : undefined);

      // Resolve subscription data — either from the expanded subscription
      // or from the session-level subscription string (we'll fetch in the
      // customer.subscription.updated webhook which fires right after).
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

      // Create initial subscription record (the .updated webhook refines
      // period dates later).
      if (subId) {
        const plan = priceId ? getPlanByPriceId(priceId) : undefined;
        await db.insert(subscriptions).values({
          tenantId,
          stripeSubscriptionId: subId,
          stripePriceId: priceId ?? "",
          status: "active",
          plan: plan ?? "essentials",
          documentsUsed: 0,
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price?.id;
      const plan = priceId ? getPlanByPriceId(priceId) : undefined;

      await db
        .update(subscriptions)
        .set({
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
        })
        .where(
          eq(subscriptions.stripeSubscriptionId, sub.id)
        );
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
