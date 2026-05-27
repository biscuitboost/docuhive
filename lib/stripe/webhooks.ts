import Stripe from "stripe";
import { stripe } from "./client";
import { db } from "@/lib/db";
import { tenants, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPlanByPriceId } from "./pricing";

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

      // Update tenant with Stripe customer + subscription IDs
      await db
        .update(tenants)
        .set({
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId));

      // Create subscription record
      const priceId = session.line_items?.data[0]?.price?.id;
      if (priceId) {
        const plan = getPlanByPriceId(priceId);
        const subscription = event.data.object as Stripe.Checkout.Session;
        await db.insert(subscriptions).values({
          tenantId,
          stripeSubscriptionId: subscription.subscription as string,
          stripePriceId: priceId,
          status: "active",
          plan: plan ?? "essentials",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ),
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
          status: sub.status as any,
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
