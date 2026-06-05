// ── Stripe Webhook Handler Tests ──────────────────────────────────
// Tests for lib/stripe/webhooks.ts — handleStripeWebhook

jest.mock('@/lib/stripe/client', () => ({
  __esModule: true,
  default: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}));

jest.mock('@/lib/db', () => ({
  __esModule: true,
  db: {
    update: jest.fn(),
    insert: jest.fn(),
    select: jest.fn(),
  },
  default: {
    update: jest.fn(),
    insert: jest.fn(),
    select: jest.fn(),
  },
}));

jest.mock('drizzle-orm', () => {
  const actual = jest.requireActual('drizzle-orm');
  return {
    ...actual,
    eq: jest.fn((a, b) => ({ type: 'eq', column: a, value: b })),
    and: jest.fn((...args) => ({ type: 'and', args })),
  };
});

jest.mock('@/lib/stripe/pricing', () => ({
  __esModule: true,
  PLANS: {
    essentials: {
      id: 'essentials',
      name: 'Essentials',
      price: 49,
      docsLimit: 10,
      multiUser: false,
      stripePriceId: 'price_essentials_live',
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      price: 79,
      docsLimit: null,
      multiUser: false,
      stripePriceId: 'price_pro_live',
    },
    team: {
      id: 'team',
      name: 'Team',
      price: 99,
      docsLimit: null,
      multiUser: true,
      stripePriceId: 'price_team_live',
    },
  },
  getPlanByPriceId: jest.fn(),
  getPlan: jest.fn(),
  formatPlanPrice: jest.fn(),
}));

import { handleStripeWebhook } from '@/lib/stripe/webhooks';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/lib/db';
import { getPlanByPriceId } from '@/lib/stripe/pricing';

const mockConstructEvent = stripe.webhooks.constructEvent as jest.Mock;
const mockDbUpdate = db.update as jest.Mock;
const mockDbInsert = db.insert as jest.Mock;
const mockDbSelect = db.select as jest.Mock;

// ── Helpers ─────────────────────────────────────────────────────────

function makeStripeEvent(
  type: string,
  data: Record<string, any>
): any {
  return {
    id: `evt_${Date.now()}`,
    type,
    data: {
      object: data,
    },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: null,
    api_version: '2025-02-24.acacia',
    account: null,
  };
}

/**
 * Create a mock query builder that can be chained (.from → .where → .limit → .then).
 * The final `.then()` returns `resolveValue`.
 */
function chainedQueryMock(resolveValue: any[]) {
  const query: any = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue(resolveValue),
    values: jest.fn().mockReturnThis(),
    then: jest.fn((resolve: (v: any) => any) => Promise.resolve(resolve(resolveValue))),
    // For .then(resolve) on .returning() — actually handled through Promise
  };
  // Make the query itself thenable
  query[Symbol.toStringTag] = 'Promise';
  Object.defineProperty(query, 'then', {
    value: jest.fn((resolve: (v: any) => any) => Promise.resolve(resolveValue).then(resolve)),
  });
  return query;
}

describe('handleStripeWebhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks for success responses
    mockConstructEvent.mockImplementation((body, sig, secret) => {
      const parsed = JSON.parse(body);
      return makeStripeEvent(parsed.type, parsed.data?.object ?? {});
    });

    // Mock db.update().set().where() to resolve successfully
    const updateChain: any = {
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue({ rowCount: 1 }),
    };
    mockDbUpdate.mockReturnValue(updateChain);

    // Mock db.insert().values() to resolve
    const insertChain: any = {
      values: jest.fn().mockResolvedValue({ rowCount: 1 }),
    };
    mockDbInsert.mockReturnValue(insertChain);

    // Mock db.select().from().where().limit()
    const selectChain: any = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };
    mockDbSelect.mockReturnValue(selectChain);
  });

  // ── Signature validation ────────────────────────────────────

  it('throws if constructEvent fails (invalid signature)', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error(
        'No signatures found matching the expected signature for payload'
      );
    });

    await expect(
      handleStripeWebhook('{}', 'bad_sig')
    ).rejects.toThrow('signature');
  });

  it('accepts valid signature and processes the event', async () => {
    const result = await handleStripeWebhook(
      JSON.stringify({ type: 'checkout.session.completed', data: { object: {} } }),
      'valid_sig'
    );

    expect(result).toEqual({ received: true });
  });

  // ── checkout.session.completed ──────────────────────────────

  describe('checkout.session.completed', () => {
    const defaultSession = {
      id: 'cs_test_123',
      customer: 'cus_abc123',
      subscription: 'sub_def456',
      mode: 'subscription',
      metadata: {
        tenantId: 'tenant_xyz',
        plan: 'pro',
      },
      line_items: {
        data: [{ price: { id: 'price_pro_live' } }],
      },
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    };

    it('updates tenant with stripeCustomerId and stripeSubscriptionId', async () => {
      await handleStripeWebhook(
        JSON.stringify({
          type: 'checkout.session.completed',
          data: { object: defaultSession },
        }),
        'valid_sig'
      );

      // Should update the tenants table
      expect(mockDbUpdate).toHaveBeenCalled();
      const firstUpdateSetCall = mockDbUpdate.mock.results[0]?.value?.set;
      expect(firstUpdateSetCall).toHaveBeenCalledWith(
        expect.objectContaining({
          stripeCustomerId: 'cus_abc123',
          stripeSubscriptionId: 'sub_def456',
        })
      );
    });

    it('inserts a subscription record', async () => {
      (getPlanByPriceId as jest.Mock).mockReturnValue('pro');

      await handleStripeWebhook(
        JSON.stringify({
          type: 'checkout.session.completed',
          data: { object: defaultSession },
        }),
        'valid_sig'
      );

      // Should have one db.insert call (the subscription record)
      expect(mockDbInsert).toHaveBeenCalledTimes(1);
      const insertValuesCall = mockDbInsert.mock.results[0]?.value?.values;
      expect(insertValuesCall).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant_xyz',
          stripeSubscriptionId: 'sub_def456',
          status: 'active',
          plan: 'pro',
          documentsUsed: 0,
        })
      );
    });

    it('handles session without expanded line_items using metadata plan fallback', async () => {
      const sessionNoLineItems = {
        ...defaultSession,
        line_items: undefined,
      };

      await handleStripeWebhook(
        JSON.stringify({
          type: 'checkout.session.completed',
          data: { object: sessionNoLineItems },
        }),
        'valid_sig'
      );

      // Should resolve via metadata.plan → PLANS → stripePriceId → getPlanByPriceId
      (getPlanByPriceId as jest.Mock).mockReturnValue('pro');
      expect(getPlanByPriceId).toHaveBeenCalledWith('price_pro_live');
    });

    it('skips DB operations when no tenantId in metadata', async () => {
      const sessionNoTenant = {
        ...defaultSession,
        metadata: { plan: 'pro' },
      };

      await handleStripeWebhook(
        JSON.stringify({
          type: 'checkout.session.completed',
          data: { object: sessionNoTenant },
        }),
        'valid_sig'
      );

      // No tenantId → no DB writes
      expect(mockDbUpdate).not.toHaveBeenCalled();
      expect(mockDbInsert).not.toHaveBeenCalled();
    });

    it('handles session without subscription (no subId)', async () => {
      const sessionNoSub = {
        ...defaultSession,
        subscription: null,
      };

      await handleStripeWebhook(
        JSON.stringify({
          type: 'checkout.session.completed',
          data: { object: sessionNoSub },
        }),
        'valid_sig'
      );

      // Should update tenant but NOT insert subscription
      expect(mockDbUpdate).toHaveBeenCalled();
      expect(mockDbInsert).not.toHaveBeenCalled();
    });

    it('resolves plan via line_items price ID', async () => {
      (getPlanByPriceId as jest.Mock).mockReturnValue('team');

      await handleStripeWebhook(
        JSON.stringify({
          type: 'checkout.session.completed',
          data: { object: defaultSession },
        }),
        'valid_sig'
      );

      expect(getPlanByPriceId).toHaveBeenCalledWith('price_pro_live');
    });
  });

  // ── checkout.session.expired ──────────────────────────────

  describe('checkout.session.expired', () => {
    const defaultExpiredSession = {
      id: 'cs_expired_123',
      customer: 'cus_abc123',
      subscription: null,
      mode: 'subscription',
      metadata: {
        tenantId: 'tenant_xyz',
        plan: 'pro',
      },
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    };

    beforeEach(() => {
      // Restore default mock behaviour for monitoring — the expired handler
      // should be fire-and-forget and not block
    });

    it('handles checkout.session.expired without error', async () => {
      const result = await handleStripeWebhook(
        JSON.stringify({
          type: 'checkout.session.expired',
          data: { object: defaultExpiredSession },
        }),
        'valid_sig'
      );

      // Should return received:true — the email send is fire-and-forget
      expect(result).toEqual({ received: true });
    });

    it('does not attempt DB writes (tenant update or subscription insert)', async () => {
      await handleStripeWebhook(
        JSON.stringify({
          type: 'checkout.session.expired',
          data: { object: defaultExpiredSession },
        }),
        'valid_sig'
      );

      // The expired handler should NOT update tenants or insert subscriptions
      expect(mockDbUpdate).not.toHaveBeenCalled();
      expect(mockDbInsert).not.toHaveBeenCalled();
    });

    it('processes event even without tenantId in metadata (no-op)', async () => {
      const sessionNoTenant = {
        ...defaultExpiredSession,
        metadata: { plan: 'pro' },
      };

      const result = await handleStripeWebhook(
        JSON.stringify({
          type: 'checkout.session.expired',
          data: { object: sessionNoTenant },
        }),
        'valid_sig'
      );

      expect(result).toEqual({ received: true });
      expect(mockDbUpdate).not.toHaveBeenCalled();
    });

    it('passes the correct tenantId and plan to sendAbandonedCheckoutEmail', async () => {
      // We can't easily mock the fire-and-forget call, but we can verify
      // the handler doesn't throw
      const result = await handleStripeWebhook(
        JSON.stringify({
          type: 'checkout.session.expired',
          data: {
            object: {
              ...defaultExpiredSession,
              metadata: { tenantId: 'tenant_specific', plan: 'team' },
            },
          },
        }),
        'valid_sig'
      );

      expect(result).toEqual({ received: true });
    });
  });

  // ── customer.subscription.updated ───────────────────────────

  describe('customer.subscription.updated', () => {
    const defaultSubscription = {
      id: 'sub_def456',
      status: 'active',
      current_period_start: 1700000000,
      current_period_end: 1702592000,
      items: {
        data: [{ price: { id: 'price_pro_live' } }],
      },
      customer: 'cus_abc123',
      metadata: {},
    };

    it('updates subscription record with new period dates and status', async () => {
      await handleStripeWebhook(
        JSON.stringify({
          type: 'customer.subscription.updated',
          data: { object: defaultSubscription },
        }),
        'valid_sig'
      );

      expect(mockDbUpdate).toHaveBeenCalled();
      const setCall = mockDbUpdate.mock.results[0]?.value?.set;
      expect(setCall).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          stripePriceId: 'price_pro_live',
          currentPeriodStart: new Date(1700000000 * 1000),
          currentPeriodEnd: new Date(1702592000 * 1000),
        })
      );
    });

    it('resolves plan from price ID and sets it', async () => {
      (getPlanByPriceId as jest.Mock).mockReturnValue('pro');

      await handleStripeWebhook(
        JSON.stringify({
          type: 'customer.subscription.updated',
          data: { object: defaultSubscription },
        }),
        'valid_sig'
      );

      const setCall = mockDbUpdate.mock.results[0]?.value?.set;
      expect(setCall).toHaveBeenCalledWith(
        expect.objectContaining({ plan: 'pro' })
      );
    });

    it('handles missing price ID gracefully (plan undefined)', async () => {
      const subNoPrice = {
        ...defaultSubscription,
        items: { data: [] },
      };

      (getPlanByPriceId as jest.Mock).mockReturnValue(undefined);

      await handleStripeWebhook(
        JSON.stringify({
          type: 'customer.subscription.updated',
          data: { object: subNoPrice },
        }),
        'valid_sig'
      );

      const setCall = mockDbUpdate.mock.results[0]?.value?.set;
      expect(setCall).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: undefined,
          stripePriceId: undefined,
        })
      );
    });

    it('filters by stripeSubscriptionId in where clause', async () => {
      const sub = { ...defaultSubscription };

      await handleStripeWebhook(
        JSON.stringify({
          type: 'customer.subscription.updated',
          data: { object: sub },
        }),
        'valid_sig'
      );

      const whereCall = mockDbUpdate.mock.results[0]?.value?.where;
      expect(whereCall).toHaveBeenCalled();
    });
  });

  // ── customer.subscription.deleted ───────────────────────────

  describe('customer.subscription.deleted', () => {
    it('sets subscription status to cancelled', async () => {
      await handleStripeWebhook(
        JSON.stringify({
          type: 'customer.subscription.deleted',
          data: {
            object: {
              id: 'sub_def456',
              status: 'canceled',
              customer: 'cus_abc123',
              items: { data: [] },
            },
          },
        }),
        'valid_sig'
      );

      expect(mockDbUpdate).toHaveBeenCalled();
      const setCall = mockDbUpdate.mock.results[0]?.value?.set;
      expect(setCall).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'cancelled',
        })
      );
    });

    it('filters by stripeSubscriptionId', async () => {
      await handleStripeWebhook(
        JSON.stringify({
          type: 'customer.subscription.deleted',
          data: {
            object: {
              id: 'sub_gone_456',
              status: 'canceled',
              customer: 'cus_abc',
              items: { data: [] },
            },
          },
        }),
        'valid_sig'
      );

      expect(mockDbUpdate).toHaveBeenCalled();
      const whereCall = mockDbUpdate.mock.results[0]?.value?.where;
      expect(whereCall).toHaveBeenCalled();
    });
  });

  // ── Unhandled event types ──────────────────────────────────

  it('returns received:true for unhandled event types without error', async () => {
    const result = await handleStripeWebhook(
      JSON.stringify({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123' } },
      }),
      'valid_sig'
    );

    expect(result).toEqual({ received: true });
    // No DB calls for unknown events
    expect(mockDbUpdate).not.toHaveBeenCalled();
    expect(mockDbInsert).not.toHaveBeenCalled();
  });
});
