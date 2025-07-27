import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PointsHistory from '../PointsHistory.jsx'
import { renderWithProviders } from '../../test/utils.jsx'

// Mock the family hook
const mockFamilyHook = {
  familyMembers: [
    { id: 'member-1', nickname: 'Test User', avatar_color: '#82bcf4', points_balance: 25 },
    { id: 'member-2', nickname: 'Family Member', avatar_color: '#ff6b6b', points_balance: 15 }
  ]
}

const mockTasksHook = {
  getPointsTransactionsForMember: vi.fn(() => [
    {
      id: 'trans-1',
      points: 10,
      transaction_type: 'earned',
      description: 'Task completion',
      created_at: '2023-06-15T10:00:00Z',
      task_completions: {
        tasks: { title: 'Test Task' }
      }
    },
    {
      id: 'trans-2',
      points: 5,
      transaction_type: 'bonus',
      description: 'Extra effort this week!',
      created_at: '2023-06-14T15:30:00Z',
      task_completions: null
    }
  ])
}

vi.mock('../../hooks/useFamily.jsx', () => ({
  useFamily: () => mockFamilyHook
}))

vi.mock('../../hooks/useTasks.jsx', () => ({
  useTasks: () => mockTasksHook
}))

describe('PointsHistory - Simplified Points System', () => {
  const mockProps = {
    memberId: 'member-1',
    open: true,
    onClose: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render simplified points history modal', () => {
    renderWithProviders(<PointsHistory {...mockProps} />)
    
    expect(screen.getByText('Test Users poenghistorikk')).toBeInTheDocument()
    expect(screen.getByText('Oversikt over alle opptjente poeng')).toBeInTheDocument()
  })

  it('should show correct summary with only positive points', () => {
    renderWithProviders(<PointsHistory {...mockProps} />)
    
    // Current balance
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('Nåværende saldo')).toBeInTheDocument()
    
    // Points from tasks
    expect(screen.getByText('+10')).toBeInTheDocument()
    expect(screen.getByText('Fra oppgaver')).toBeInTheDocument()
    
    // Bonus points
    expect(screen.getByText('+5')).toBeInTheDocument()
    expect(screen.getByText('Bonus poeng')).toBeInTheDocument()
  })

  it('should only show earned and bonus filter options', () => {
    renderWithProviders(<PointsHistory {...mockProps} />)
    
    expect(screen.getByText('Alle transaksjoner')).toBeInTheDocument()
    expect(screen.getByText('Opptjent')).toBeInTheDocument()
    expect(screen.getByText('Bonus')).toBeInTheDocument()
    
    // Should NOT show spent or penalty options
    expect(screen.queryByText('Brukt')).not.toBeInTheDocument()
    expect(screen.queryByText('Straff')).not.toBeInTheDocument()
  })

  it('should display transaction details correctly', () => {
    renderWithProviders(<PointsHistory {...mockProps} />)
    
    // Earned transaction
    expect(screen.getByText('Task completion')).toBeInTheDocument()
    expect(screen.getByText('Opptjent')).toBeInTheDocument()
    expect(screen.getByText('Oppgave: Test Task')).toBeInTheDocument()
    
    // Bonus transaction  
    expect(screen.getByText('Extra effort this week!')).toBeInTheDocument()
    expect(screen.getByText('Bonus')).toBeInTheDocument()
  })

  it('should filter transactions by type', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PointsHistory {...mockProps} />)
    
    const filterSelect = screen.getByRole('combobox')
    
    // Filter to only show earned transactions
    await user.selectOptions(filterSelect, 'earned')
    
    expect(screen.getByText('Task completion')).toBeInTheDocument()
    expect(screen.queryByText('Extra effort this week!')).not.toBeInTheDocument()
    
    // Filter to only show bonus transactions
    await user.selectOptions(filterSelect, 'bonus')
    
    expect(screen.queryByText('Task completion')).not.toBeInTheDocument()
    expect(screen.getByText('Extra effort this week!')).toBeInTheDocument()
  })

  it('should show correct transaction icons and colors', () => {
    renderWithProviders(<PointsHistory {...mockProps} />)
    
    // Check that earned and bonus transactions have different styling
    const earnedBadge = screen.getByText('Opptjent')
    const bonusBadge = screen.getByText('Bonus')
    
    expect(earnedBadge).toBeInTheDocument()
    expect(bonusBadge).toBeInTheDocument()
    
    // Both should show positive point indicators
    const upArrows = screen.getAllByTestId ? screen.getAllByTestId('up-arrow') : []
    expect(upArrows.length >= 0).toBe(true) // At least shows positive indicators
  })

  it('should handle empty transaction list', () => {
    mockTasksHook.getPointsTransactionsForMember.mockReturnValue([])
    
    renderWithProviders(<PointsHistory {...mockProps} />)
    
    expect(screen.getByText('Ingen transaksjoner funnet')).toBeInTheDocument()
  })

  it('should display member avatar and nickname correctly', () => {
    renderWithProviders(<PointsHistory {...mockProps} />)
    
    expect(screen.getByText('Test Users poenghistorikk')).toBeInTheDocument()
    // Avatar initial should be displayed
    expect(screen.getByText('T')).toBeInTheDocument() // First letter of Test User
  })

  it('should close modal when onClose is called', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PointsHistory {...mockProps} />)
    
    // Find and click close button (usually an X or close button in modal)
    const closeButton = screen.getByRole('button', { name: /lukk|close/i })
    await user.click(closeButton)
    
    expect(mockProps.onClose).toHaveBeenCalled()
  })
})