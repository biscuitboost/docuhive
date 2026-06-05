import { render, screen } from '@testing-library/react'
import OnboardingPage from '@/app/onboarding/page'

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn().mockReturnValue({ isSignedIn: true, userId: 'user_test' }),
  useUser: jest.fn().mockReturnValue({ user: { id: 'user_test' } }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => null,
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), back: jest.fn(), forward: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/onboarding',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock DashboardShell to just render children
jest.mock('@/components/layout/DashboardShell', () => {
  return function MockShell({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-shell">{children}</div>
  }
})

describe('Onboarding Page', () => {
  it('renders the onboarding heading', () => {
    render(<OnboardingPage />)
    expect(screen.getByText(/get started/i)).toBeInTheDocument()
  })

  it('renders setup steps', () => {
    render(<OnboardingPage />)
    // Should show company setup, first document, and explore steps
    expect(screen.getByText('Set up your company')).toBeInTheDocument()
    expect(screen.getByText('Create your first document')).toBeInTheDocument()
    expect(screen.getByText('Choose your plan')).toBeInTheDocument()
  })

  it('renders a link to settings for company setup', () => {
    render(<OnboardingPage />)
    const settingsLink = screen.getByRole('link', { name: /company settings/i })
    expect(settingsLink).toBeInTheDocument()
    expect(settingsLink).toHaveAttribute('href', '/settings')
  })

  it('renders a link to create a document', () => {
    render(<OnboardingPage />)
    const createLink = screen.getByRole('link', { name: /create document/i })
    expect(createLink).toBeInTheDocument()
    expect(createLink).toHaveAttribute('href', '/documents/new')
  })

  it('renders a link to view pricing plans', () => {
    render(<OnboardingPage />)
    const pricingLink = screen.getByRole('link', { name: /view plans/i })
    expect(pricingLink).toBeInTheDocument()
    expect(pricingLink).toHaveAttribute('href', '/settings/billing')
  })

  it('renders in a dashboard shell', () => {
    render(<OnboardingPage />)
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })
})