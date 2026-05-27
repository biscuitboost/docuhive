import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "./client";

/**
 * Webhook handler for Stripe events.
 * Processes checkout.session.completed, customer.subscription.updated/deleted.
 */
export async function handleStripeWebhook(
  body: string,
  signature: string
): Promise<NextResponse> {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // TODO: Upsert tenant, link subscription, update plan
      console.log("Checkout completed:", session.id, session.customer);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      // TODO: Sync subscription status, period dates, plan changes
      console.log("Subscription updated:", subscription.id, subscription.status);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      // TODO: Mark subscription as cancelled, degrade plan
      console.log("Subscription deleted:", subscription.id);
      break;
    }

    default:
      console.log("Unhandled event type:", event.type);
  }

  return NextResponse.json({ received: true });
}
