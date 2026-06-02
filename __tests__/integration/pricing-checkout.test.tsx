// ── Pricing → Checkout Integration Tests ───────────────────────────
// Tests the frontend-backend interaction: clicking Subscribe on the
// Pricing component should call POST /api/stripe/checkout and redirect.
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the API call — we test the component's behaviour, not fetch itself
const mockFetch = jest.fn()
global.fetch = mockFetch as any

// Mock next/navigation directly (overrides __mocks__/next/navigation.js manual mock)
// with jest.fn() so we can set return values per-test
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: (url: string) => { throw new Error(`redirect: ${url}`) },
  notFound: () => { throw new Error('notFound') },
  RedirectType: { push: 'push', replace: 'replace' },
}))

// Mock @clerk/nextjs
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
  useUser: jest.fn().mockReturnValue({ user: null }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => null,
}))

import Pricing from '@/components/marketing/Pricing'

// ── Setup ─────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  // Default: user is signed in
  const { useAuth } = require('@clerk/nextjs')
  useAuth.mockReturnValue({ isSignedIn: true })
  // useRouter is already set up by the factory mock at the top of the file
})

// ── Tests ─────────────────────────────────────────────────────────

describe('Pricing → Checkout integration', () => {
  describe('Authenticated user', () => {
    it('calls POST /api/stripe/checkout with correct plan on Subscribe click', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          url: 'https://checkout.stripe.com/c/pay/cs_test_xyz',
          sessionId: 'cs_test_xyz',
        }),
      })

      render(<Pricing />)
      const user = userEvent.setup()

      // Click "Subscribe Now" button on the Pro plan (second card)
      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe now/i })
      await user.click(subscribeButtons[1])

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      })
    })

    it('redirects to the Stripe Checkout URL on success', async () => {
      // @ts-expect-error — jsdom location type gymnastics for test
      delete window.location
      // @ts-expect-error — reassign location for test
      window.location = { href: '' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          url: 'https://checkout.stripe.com/c/pay/cs_test_xyz',
          sessionId: 'cs_test_xyz',
        }),
      })

      render(<Pricing />)
      const user = userEvent.setup()

      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe now/i })
      await user.click(subscribeButtons[0])

      await waitFor(() => {
        expect(window.location.href).toBe('https://checkout.stripe.com/c/pay/cs_test_xyz')
      })
    })

    it('shows an error when the API returns an error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid plan selected' }),
      })

      render(<Pricing />)
      const user = userEvent.setup()

      expect(screen.queryByText('Invalid plan selected')).not.toBeInTheDocument()

      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe now/i })
      await user.click(subscribeButtons[2])

      await waitFor(() => {
        expect(screen.getByText('Invalid plan selected')).toBeInTheDocument()
      })
    })

    it('shows an error when the API returns no URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          url: null,
          sessionId: 'cs_test_incomplete',
        }),
      })

      render(<Pricing />)
      const user = userEvent.setup()

      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe now/i })
      await user.click(subscribeButtons[0])

      await waitFor(() => {
        expect(screen.getByText('No checkout URL returned')).toBeInTheDocument()
      })
    })

    it('shows a network error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('NetworkError: Failed to fetch'))

      render(<Pricing />)
      const user = userEvent.setup()

      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe now/i })
      await user.click(subscribeButtons[0])

      await waitFor(() => {
        expect(screen.getByText('NetworkError: Failed to fetch')).toBeInTheDocument()
      })
    })

    it('disables button and shows loading state during checkout', async () => {
      // Don't resolve the fetch — keep it pending to test loading state
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))

      render(<Pricing />)
      const user = userEvent.setup()

      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe now/i })
      await user.click(subscribeButtons[0])

      // Button should now show "Redirecting..." and be disabled
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const redirectingBtn = buttons.find(b => b.textContent?.includes('Redirecting'))
        expect(redirectingBtn).toBeDefined()
        expect(redirectingBtn).toBeDisabled()
      })
    })
  })

  describe('Unauthenticated user', () => {
    it('redirects to sign-up page when user is not signed in', async () => {
      const { useAuth } = require('@clerk/nextjs')
      useAuth.mockReturnValue({ isSignedIn: false })

      render(<Pricing />)
      const user = userEvent.setup()

      // Button text is "Start Free Trial" when not signed in
      const ctaButtons = screen.getAllByRole('button', { name: /start free trial/i })
      await user.click(ctaButtons[0])

      expect(mockPush).toHaveBeenCalledWith('/sign-up?redirect=pricing')
      // Should NOT attempt API call when not signed in
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})
