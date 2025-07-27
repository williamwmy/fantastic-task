import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App.jsx'
import { renderWithProviders } from '../../test/utils.jsx'

// Mock the hooks
const mockAuthHook = {
  user: { id: 'test-user-id', email: 'test@test.com' },
  isLoading: false
}

const mockFamilyHook = {
  family: { id: 'test-family-id', name: 'Test Familie', family_code: 'FAM15' },
  familyMembers: [
    { 
      id: 'member-1', 
      nickname: 'Test User', 
      avatar_color: '#82bcf4', 
      role: 'admin', 
      points_balance: 150 
    },
    { 
      id: 'member-2', 
      nickname: 'Familie Medlem', 
      avatar_color: '#ff6b6b', 
      role: 'member', 
      points_balance: 75 
    }
  ],
  currentMember: { 
    id: 'member-1', 
    nickname: 'Test User', 
    avatar_color: '#82bcf4', 
    role: 'admin', 
    points_balance: 150 
  },
  hasPermission: vi.fn(() => true)
}

const mockTasksHook = {
  getPendingVerifications: vi.fn(() => []),
  getTasks: vi.fn(() => []),
  loadTaskData: vi.fn(),
  getTasksForMember: vi.fn(() => []),
  getCompletionsForMember: vi.fn(() => [])
}

// Mock the hooks
vi.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: () => mockAuthHook,
  AuthProvider: ({ children }) => children
}))

vi.mock('../../hooks/useFamily.jsx', () => ({
  useFamily: () => mockFamilyHook,
  FamilyProvider: ({ children }) => children
}))

vi.mock('../../hooks/useTasks.jsx', () => ({
  useTasks: () => mockTasksHook,
  TasksProvider: ({ children }) => children
}))

describe('App Component - Avatar Click Functionality', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  it('should render avatar with user initials', () => {
    renderWithProviders(<App />)
    
    // Should show avatar with first letter of nickname
    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveTextContent('T') // First letter of "Test User"
  })

  it('should display correct avatar styling', () => {
    renderWithProviders(<App />)
    
    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    const avatarStyles = window.getComputedStyle(avatar)
    
    // Check that it's styled as a circular button
    expect(avatar).toHaveStyle({
      borderRadius: '50%',
      cursor: 'pointer',
      border: 'none'
    })
  })

  it('should open ProfileSelector modal when avatar is clicked', async () => {
    renderWithProviders(<App />)
    
    // Find and click the avatar
    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    await user.click(avatar)
    
    // ProfileSelector modal should be visible
    await waitFor(() => {
      expect(screen.getByText('Familiemedlemmer (2)')).toBeInTheDocument()
    })
    
    // Should show the current user's profile
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Familie Medlem')).toBeInTheDocument()
  })

  it('should show points balance next to avatar', () => {
    renderWithProviders(<App />)
    
    // Should display current member's points
    expect(screen.getByText('150 poeng')).toBeInTheDocument()
  })

  it('should close ProfileSelector modal when close button is clicked', async () => {
    renderWithProviders(<App />)
    
    // Open the modal
    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    await user.click(avatar)
    
    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Familiemedlemmer (2)')).toBeInTheDocument()
    })
    
    // Find and click close button (×)
    const closeButton = screen.getByRole('button', { name: /lukk/i })
    await user.click(closeButton)
    
    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('Familiemedlemmer (2)')).not.toBeInTheDocument()
    })
  })

  it('should handle avatar hover effects', async () => {
    renderWithProviders(<App />)
    
    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    
    // Simulate hover
    fireEvent.mouseOver(avatar)
    
    // Check for transform scale (hover effect)
    await waitFor(() => {
      expect(avatar.style.transform).toBe('scale(1.05)')
    })
    
    // Simulate mouse out
    fireEvent.mouseOut(avatar)
    
    // Transform should reset
    await waitFor(() => {
      expect(avatar.style.transform).toBe('scale(1)')
    })
  })

  it('should use correct avatar color from currentMember', () => {
    renderWithProviders(<App />)
    
    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    
    // Should use the avatar_color from currentMember
    expect(avatar).toHaveStyle({
      background: '#82bcf4'
    })
  })

  it('should fall back to default color if avatar_color is not set', () => {
    // Mock currentMember without avatar_color
    const mockFamilyHookNoColor = {
      ...mockFamilyHook,
      currentMember: { 
        ...mockFamilyHook.currentMember,
        avatar_color: null 
      }
    }
    
    vi.mocked(vi.importActual('../../hooks/useFamily.jsx')).useFamily = () => mockFamilyHookNoColor
    
    renderWithProviders(<App />)
    
    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    
    // Should use default color
    expect(avatar).toHaveStyle({
      background: '#82bcf4' // default color
    })
  })

  it('should show ProfileSelector with correct family members', async () => {
    renderWithProviders(<App />)
    
    // Click avatar to open modal
    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    await user.click(avatar)
    
    // Wait for modal and check family members are displayed
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('Familie Medlem')).toBeInTheDocument()
    })
    
    // Should show member count
    expect(screen.getByText('Familiemedlemmer (2)')).toBeInTheDocument()
  })

  it('should prevent event bubbling when avatar is clicked', async () => {
    const parentClickHandler = vi.fn()
    
    const TestWrapper = () => (
      <div onClick={parentClickHandler}>
        <App />
      </div>
    )
    
    renderWithProviders(<TestWrapper />)
    
    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    await user.click(avatar)
    
    // Parent click handler should not be called due to stopPropagation
    // Note: This test might need adjustment based on actual implementation
    expect(parentClickHandler).not.toHaveBeenCalled()
  })
})

describe('App Component - Authentication States', () => {
  it('should show loading state when auth is loading', () => {
    const loadingAuthHook = { ...mockAuthHook, isLoading: true }
    
    vi.mocked(vi.importActual('../../hooks/useAuth.jsx')).useAuth = () => loadingAuthHook
    
    renderWithProviders(<App />)
    
    // Should show loading indicator (based on the loading div in App.jsx)
    expect(screen.getByText(/laster/i)).toBeInTheDocument()
  })

  it('should show login page when user is not authenticated', () => {
    const unauthenticatedAuthHook = { ...mockAuthHook, user: null }
    
    vi.mocked(vi.importActual('../../hooks/useAuth.jsx')).useAuth = () => unauthenticatedAuthHook
    
    renderWithProviders(<App />)
    
    // Should not show avatar when not authenticated
    expect(screen.queryByTitle('Åpne profil og innstillinger')).not.toBeInTheDocument()
  })
})