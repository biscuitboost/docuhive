import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, AuthError } from "@/lib/auth/tenant";
import stripe from "@/lib/stripe/client";

/**
 * GET /api/billing/invoices
 * Returns the last 20 Stripe invoices for the authenticated tenant's customer.
 */
export async function GET() {
  try {
    const { tenantId } = await requireAuth();

    // Get the tenant's Stripe customer ID
    const tenant = await db
      .select({ stripeCustomerId: tenants.stripeCustomerId })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1)
      .then((r) => r[0]);

    if (!tenant?.stripeCustomerId) {
      return NextResponse.json({ invoices: [] });
    }

    const invoices = await stripe.invoices.list({
      customer: tenant.stripeCustomerId,
      limit: 20,
    });

    return NextResponse.json({
      invoices: invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        amountPaid: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        pdfUrl: inv.invoice_pdf,
        hostedUrl: inv.hosted_invoice_url,
        createdAt: new Date(inv.created * 1000).toISOString(),
        periodStart: new Date(inv.period_start * 1000).toISOString(),
        periodEnd: new Date(inv.period_end * 1000).toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to get invoices";
    console.error("[billing/invoices]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
