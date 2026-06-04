import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Check your environment variables."
    );
  }
  _stripe = new Stripe(secretKey, {
    typescript: true,
  });
  return _stripe;
}

/**
 * Lazy-initialising Stripe client.
 *
 * The Proxy defers initialisation until a property is accessed, so this
 * module can be imported at build time without STRIPE_SECRET_KEY being set.
 * Throws on first property access if the env var is missing.
 *
 * Usage stays the same:
 *   import stripe from '@/lib/stripe/client';
 *   await stripe.checkout.sessions.create({ ... });
 */
const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

export default stripe;
export { stripe };
