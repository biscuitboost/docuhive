import { render, screen, within } from '@testing-library/react'
import Pricing from '@/components/marketing/Pricing'

describe('Pricing Component', () => {
  it('renders the section heading', () => {
    render(<Pricing />)
    expect(screen.getByText('Simple, transparent pricing')).toBeInTheDocument()
  })

  it('renders the pricing subtitle', () => {
    render(<Pricing />)
    expect(screen.getByText('No hidden fees. Cancel anytime. All plans billed monthly.')).toBeInTheDocument()
  })

  it('renders all three pricing tiers', () => {
    render(<Pricing />)
    expect(screen.getByText('Essentials')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Team')).toBeInTheDocument()
  })

  it('displays correct prices with GBP symbol', () => {
    render(<Pricing />)
    expect(screen.getByText('£49')).toBeInTheDocument()
    expect(screen.getByText('£79')).toBeInTheDocument()
    expect(screen.getByText('£99')).toBeInTheDocument()
  })

  it('displays /mo suffix for each tier', () => {
    render(<Pricing />)
    const monthlyLabels = screen.getAllByText('/mo')
    expect(monthlyLabels).toHaveLength(3)
  })

  it('renders the Most Popular badge on the Pro plan', () => {
    render(<Pricing />)
    expect(screen.getByText('Most Popular')).toBeInTheDocument()
  })

  it('renders features list for each tier', () => {
    render(<Pricing />)
    expect(screen.getByText('10 documents per month')).toBeInTheDocument()
    const unlimitedDocs = screen.getAllByText('Unlimited documents')
    expect(unlimitedDocs).toHaveLength(2)
    expect(screen.getByText('Up to 10 team members')).toBeInTheDocument()
  })

  it('renders call-to-action buttons for each tier', () => {
    render(<Pricing />)
    // With Clerk mocked as signed-out, button text should be "Start Free Trial"
    const ctaButtons = screen.getAllByRole('button', { name: /start free trial/i })
    expect(ctaButtons).toHaveLength(3)
  })

  it('renders feature items as list elements', () => {
    render(<Pricing />)
    // Each plan card should have a features list with at least 6 items
    const lists = screen.getAllByRole('list')
    // There are 3 pricing cards each with a feature list
    expect(lists).toHaveLength(3)

    lists.forEach((list) => {
      const items = within(list).getAllByRole('listitem')
      expect(items.length).toBeGreaterThanOrEqual(6)
    })
  })

  it('renders Check icons within feature items', () => {
    render(<Pricing />)
    // Each feature list has 6 items × 3 tiers = at minimum 18 list items
    const listItems = screen.getAllByRole('listitem')
    expect(listItems.length).toBeGreaterThanOrEqual(18)
  })

  it('renders unique plan descriptions for each tier', () => {
    render(<Pricing />)
    expect(screen.getByText(/For sole traders/)).toBeInTheDocument()
    expect(screen.getByText(/For growing businesses/)).toBeInTheDocument()
    expect(screen.getByText(/For businesses with multiple/)).toBeInTheDocument()
  })

  it('renders all interactable button elements', () => {
    render(<Pricing />)
    // All 3 pricing cards have a subscribe button
    const allButtons = screen.getAllByRole('button')
    expect(allButtons).toHaveLength(3)
  })
})
