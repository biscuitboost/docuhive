import Stripe from "stripe";

/**
 * Stripe client initialised with the secret key.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  typescript: true,
});

export default stripe;
