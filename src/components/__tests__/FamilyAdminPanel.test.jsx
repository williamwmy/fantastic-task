import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FamilyAdminPanel from '../FamilyAdminPanel.jsx'
import { renderWithProviders } from '../../test/utils.jsx'

// Mock the family hook
const mockFamilyHook = {
  family: { id: 'test-family-id', name: 'Test Familie' },
  familyMembers: [
    { id: 'admin-1', nickname: 'Admin User', avatar_color: '#82bcf4', role: 'admin', points_balance: 150 },
    { id: 'member-1', nickname: 'Family Member', avatar_color: '#ff6b6b', role: 'member', points_balance: 75 },
    { id: 'child-1', nickname: 'Child User', avatar_color: '#4ecdc4', role: 'child', points_balance: 50 }
  ],
  currentMember: { id: 'admin-1', nickname: 'Admin User', role: 'admin', points_balance: 150 },
  hasPermission: vi.fn((permission) => {
    // Admin has all permissions
    return true
  }),
  updateFamilyName: vi.fn(),
  removeFamilyMember: vi.fn(),
  resetAllPoints: vi.fn()
}

const mockAuthHook = {
  signOut: vi.fn()
}

vi.mock('../../hooks/useFamily.jsx', () => ({
  useFamily: () => mockFamilyHook,
  FamilyProvider: ({ children }) => children
}))

vi.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: () => mockAuthHook,
  AuthProvider: ({ children }) => children
}))

vi.mock('../../hooks/useTasks.jsx', () => ({
  useTasks: () => ({}),
  TasksProvider: ({ children }) => children
}))

// Mock the confirmation dialogs
global.confirm = vi.fn()
global.alert = vi.fn()

describe('FamilyAdminPanel - Reset Points Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.confirm.mockReturnValue(true) // Auto-confirm dialogs in tests
    mockFamilyHook.resetAllPoints.mockResolvedValue({ error: null })
  })

  it('should render reset points button in danger zone', () => {
    renderWithProviders(<FamilyAdminPanel />)
    
    expect(screen.getByText('Farlig sone')).toBeInTheDocument()
    expect(screen.getByText('Nullstill alle poeng')).toBeInTheDocument()
  })

  it('should show current points balances for all members', () => {
    renderWithProviders(<FamilyAdminPanel />)
    
    // Just check that the points are displayed somewhere, don't care about count
    expect(screen.getByText(/Administrator.*150 poeng/)).toBeInTheDocument() // Admin
    expect(screen.getByText(/Medlem.*75 poeng/)).toBeInTheDocument()  // Member  
    expect(screen.getByText(/Barn.*50 poeng/)).toBeInTheDocument()  // Child
  })

  it('should call resetAllPoints when button is clicked and confirmed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FamilyAdminPanel />)
    
    const resetButton = screen.getByText('Nullstill alle poeng')
    await user.click(resetButton)
    
    expect(global.confirm).toHaveBeenCalledWith(
      'Er du sikker på at du vil nullstille alle familiemedlemmers poeng? Dette kan ikke angres.'
    )
    expect(mockFamilyHook.resetAllPoints).toHaveBeenCalledTimes(1)
    expect(global.alert).toHaveBeenCalledWith('Alle poeng har blitt nullstilt!')
  })

  it('should not reset points if user cancels confirmation', async () => {
    global.confirm.mockReturnValue(false) // User cancels
    const user = userEvent.setup()
    renderWithProviders(<FamilyAdminPanel />)
    
    const resetButton = screen.getByText('Nullstill alle poeng')
    await user.click(resetButton)
    
    expect(global.confirm).toHaveBeenCalled()
    expect(mockFamilyHook.resetAllPoints).not.toHaveBeenCalled()
  })

  it('should handle errors when resetting points', async () => {
    mockFamilyHook.resetAllPoints.mockResolvedValue({ 
      error: { message: 'Database error' } 
    })
    
    const user = userEvent.setup()
    renderWithProviders(<FamilyAdminPanel />)
    
    const resetButton = screen.getByText('Nullstill alle poeng')
    await user.click(resetButton)
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Feil ved nullstilling av poeng: Database error')
    })
  })

  it('should show loading state while resetting points', async () => {
    // Mock a delayed response
    let resolvePromise
    const resetPromise = new Promise(resolve => {
      resolvePromise = resolve
    })
    mockFamilyHook.resetAllPoints.mockReturnValue(resetPromise)
    
    const user = userEvent.setup()
    renderWithProviders(<FamilyAdminPanel />)
    
    const resetButton = screen.getByText('Nullstill alle poeng')
    await user.click(resetButton)
    
    // Should show loading state
    expect(screen.getByText('Nullstiller...')).toBeInTheDocument()
    expect(resetButton).toBeDisabled()
    
    // Resolve the promise to restore normal state
    resolvePromise({ error: null })
    await waitFor(() => {
      expect(screen.getByText('Nullstill alle poeng')).toBeInTheDocument()
    })
  })

  it('should place reset points button in danger zone with warning styling', () => {
    renderWithProviders(<FamilyAdminPanel />)
    
    const dangerZone = screen.getByText('Farlig sone').closest('div')
    expect(dangerZone).toHaveStyle({ backgroundColor: '#f8d7da' })
    
    const resetButton = screen.getByText('Nullstill alle poeng')
    expect(resetButton).toHaveStyle({ backgroundColor: '#fd7e14' })
  })

  it('should display proper warning about irreversible action', () => {
    renderWithProviders(<FamilyAdminPanel />)
    
    expect(screen.getByText('Vær forsiktig med disse handlingene - de kan ikke angres.')).toBeInTheDocument()
  })
})

describe('FamilyAdminPanel - Access Control', () => {
  it('should only show admin panel for admin users', () => {
    mockFamilyHook.hasPermission.mockImplementation((permission) => {
      return permission !== 'manage_family' // Non-admin
    })
    
    renderWithProviders(<FamilyAdminPanel />)
    
    expect(screen.getByText('Kun administratorer kan få tilgang til familieinnstillinger.')).toBeInTheDocument()
    expect(screen.queryByText('Nullstill alle poeng')).not.toBeInTheDocument()
  })

  it('should show full admin panel for admin users', () => {
    mockFamilyHook.hasPermission.mockImplementation((permission) => {
      return permission === 'manage_family' // Admin
    })
    
    renderWithProviders(<FamilyAdminPanel />)
    
    expect(screen.getByText('Familieinnstillinger')).toBeInTheDocument()
    expect(screen.getByText('Nullstill alle poeng')).toBeInTheDocument()
  })
})