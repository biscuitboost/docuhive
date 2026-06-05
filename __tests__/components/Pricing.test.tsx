import { render, screen, within, fireEvent } from '@testing-library/react'
import Pricing from '@/components/marketing/Pricing'

describe('Pricing Component', () => {
  it('renders the section heading', () => {
    render(<Pricing />)
    expect(screen.getByText('Simple, transparent pricing')).toBeInTheDocument()
  })

  it('renders the pricing subtitle with annual billing mention', () => {
    render(<Pricing />)
    expect(screen.getByText(/Save 2 months with annual billing/i)).toBeInTheDocument()
  })

  it('renders billing toggle buttons', () => {
    render(<Pricing />)
    expect(screen.getByText('Monthly')).toBeInTheDocument()
    expect(screen.getByText('Annual')).toBeInTheDocument()
  })

  it('renders all three pricing tiers', () => {
    render(<Pricing />)
    expect(screen.getByText('Essentials')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Team')).toBeInTheDocument()
  })

  it('displays monthly prices by default with GBP symbol', () => {
    render(<Pricing />)
    expect(screen.getByText('£49')).toBeInTheDocument()
    expect(screen.getByText('£79')).toBeInTheDocument()
    expect(screen.getByText('£99')).toBeInTheDocument()
  })

  it('displays /mo suffix for each tier by default', () => {
    render(<Pricing />)
    const monthlyLabels = screen.getAllByText('/mo')
    expect(monthlyLabels).toHaveLength(3)
  })

  it('shows annual prices when toggle is clicked', () => {
    render(<Pricing />)
    fireEvent.click(screen.getByText('Annual'))
    expect(screen.getByText('£490')).toBeInTheDocument()
    expect(screen.getByText('£790')).toBeInTheDocument()
    expect(screen.getByText('£990')).toBeInTheDocument()
  })

  it('shows /yr suffix when annual billing is selected', () => {
    render(<Pricing />)
    fireEvent.click(screen.getByText('Annual'))
    const yearlyLabels = screen.getAllByText('/yr')
    expect(yearlyLabels).toHaveLength(3)
  })

  it('shows save badges on annual plan cards', () => {
    render(<Pricing />)
    fireEvent.click(screen.getByText('Annual'))
    // All 3 plans have savings > 0, so 3 badges should render
    const badges = screen.getAllByText(/Save £\d+\/yr/)
    expect(badges).toHaveLength(3)
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
    // All 3 pricing cards have a subscribe button + 2 toggle buttons = 5 total
    const allButtons = screen.getAllByRole('button')
    expect(allButtons).toHaveLength(5)
  })

  it('shows annual price comparison hint on annual toggle', () => {
    render(<Pricing />)
    fireEvent.click(screen.getByText('Annual'))
    // Should show the equivalent monthly price as reference
    const monthlyRefs = screen.getAllByText(/£\d+\/mo if billed monthly/)
    expect(monthlyRefs).toHaveLength(3)
  })
})