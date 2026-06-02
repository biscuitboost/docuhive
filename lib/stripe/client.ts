import Stripe from "stripe";

/**
 * Stripe client initialised with the secret key.
 * Throws at import time if STRIPE_SECRET_KEY is missing.
 */
const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is not set. Check your environment variables."
  );
}

export const stripe = new Stripe(secretKey, {
  typescript: true,
});

export default stripe;
