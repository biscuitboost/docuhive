import Stripe from "stripe";

/**
 * Stripe client initialised with the secret key.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

export default stripe;
