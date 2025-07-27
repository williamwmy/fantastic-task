import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../utils.jsx'
import App from '../../App.jsx'

// Mock all hooks properly
const mockUser = { id: 'test-user', email: 'test@test.com' }
const mockCurrentMember = {
  id: 'member-1',
  nickname: 'Test Admin',
  avatar_color: '#82bcf4',
  role: 'admin',
  points_balance: 200
}
const mockFamilyMembers = [
  mockCurrentMember,
  {
    id: 'member-2',
    nickname: 'Test Member',
    avatar_color: '#ff6b6b',
    role: 'member',
    points_balance: 100
  },
  {
    id: 'member-3',
    nickname: 'Test Child',
    avatar_color: '#4ecdc4',
    role: 'child',
    points_balance: 50
  }
]

const mockFamily = {
  id: 'test-family',
  name: 'Test Familie',
  family_code: 'FAM15'
}

// Mock useAuth
vi.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    signOut: vi.fn()
  }),
  AuthProvider: ({ children }) => children
}))

// Mock useFamily
vi.mock('../../hooks/useFamily.jsx', () => ({
  useFamily: () => ({
    family: mockFamily,
    familyMembers: mockFamilyMembers,
    currentMember: mockCurrentMember,
    setCurrentMember: vi.fn(),
    hasPermission: vi.fn((permission) => {
      // Admin has all permissions
      if (mockCurrentMember.role === 'admin') return true
      return false
    }),
    removeFamilyMember: vi.fn(),
    updateMemberProfile: vi.fn(),
    resetAllPoints: vi.fn()
  }),
  FamilyProvider: ({ children }) => children
}))

// Mock useTasks
vi.mock('../../hooks/useTasks.jsx', () => ({
  useTasks: () => ({
    getPendingVerifications: vi.fn(() => []),
    getTasks: vi.fn(() => []),
    loadTaskData: vi.fn(),
    getTasksForMember: vi.fn(() => []),
    getCompletionsForMember: vi.fn(() => []),
    tasks: [],
    taskAssignments: [],
    completions: []
  }),
  TasksProvider: ({ children }) => children
}))

describe('Avatar to ProfileSelector Integration', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  it('should complete the full flow: click avatar → open ProfileSelector → see family members', async () => {
    renderWithProviders(<App />)

    // Step 1: Verify avatar is rendered with correct initials
    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveTextContent('T') // "Test Admin"

    // Step 2: Click avatar to open ProfileSelector
    await user.click(avatar)

    // Step 3: Verify ProfileSelector modal opened
    await waitFor(() => {
      expect(screen.getByText('Familiemedlemmer (3)')).toBeInTheDocument()
    })

    // Step 4: Verify all family members are displayed
    expect(screen.getByText('Test Admin')).toBeInTheDocument()
    expect(screen.getByText('Test Member')).toBeInTheDocument()
    expect(screen.getByText('Test Child')).toBeInTheDocument()

    // Step 5: Verify current member is highlighted
    const currentMemberElement = screen.getByText('DU')
    expect(currentMemberElement).toBeInTheDocument()

    // Step 6: Verify roles are displayed
    expect(screen.getByText('Administrator')).toBeInTheDocument()
    expect(screen.getByText('Medlem')).toBeInTheDocument()
    expect(screen.getByText('Barn')).toBeInTheDocument()
  })

  it('should show edit button for own profile in ProfileSelector', async () => {
    renderWithProviders(<App />)

    // Click avatar to open ProfileSelector
    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    await user.click(avatar)

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Familiemedlemmer (3)')).toBeInTheDocument()
    })

    // Should show edit button for current user's profile
    const editButtons = screen.getAllByTitle(/rediger/i)
    expect(editButtons.length).toBeGreaterThan(0)
  })

  it('should display correct points balance in both avatar area and ProfileSelector', async () => {
    renderWithProviders(<App />)

    // Check points in avatar area
    expect(screen.getByText('200 poeng')).toBeInTheDocument()

    // Click avatar to open ProfileSelector
    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    await user.click(avatar)

    // Wait for modal and check points in ProfileSelector
    await waitFor(() => {
      expect(screen.getByText('Familiemedlemmer (3)')).toBeInTheDocument()
    })

    // Should show points for all members
    expect(screen.getByText('• 200 poeng')).toBeInTheDocument() // Admin
    expect(screen.getByText('• 100 poeng')).toBeInTheDocument() // Member  
    expect(screen.getByText('• 50 poeng')).toBeInTheDocument()  // Child
  })

  it('should close ProfileSelector when close button is clicked', async () => {
    renderWithProviders(<App />)

    // Open ProfileSelector
    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    await user.click(avatar)

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Familiemedlemmer (3)')).toBeInTheDocument()
    })

    // Find and click close button (usually an X or "Lukk" button)
    const closeButton = screen.getByRole('button', { name: /lukk/i })
    await user.click(closeButton)

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Familiemedlemmer (3)')).not.toBeInTheDocument()
    })
  })

  it('should handle avatar color correctly throughout the flow', async () => {
    renderWithProviders(<App />)

    // Check avatar has correct color
    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    expect(avatar).toHaveStyle({ background: '#82bcf4' })

    // Open ProfileSelector
    await user.click(avatar)

    await waitFor(() => {
      expect(screen.getByText('Familiemedlemmer (3)')).toBeInTheDocument()
    })

    // Check that member avatars in ProfileSelector also have correct colors
    // This would require checking the avatar elements within the ProfileSelector
    // The exact implementation depends on how ProfileSelector renders avatars
  })

  it('should show logout button in ProfileSelector', async () => {
    renderWithProviders(<App />)

    // Open ProfileSelector
    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    await user.click(avatar)

    await waitFor(() => {
      expect(screen.getByText('Familiemedlemmer (3)')).toBeInTheDocument()
    })

    // Should show logout button
    expect(screen.getByText('Logg ut')).toBeInTheDocument()
  })

  it('should maintain state when ProfileSelector is opened and closed multiple times', async () => {
    renderWithProviders(<App />)

    const avatar = screen.getByTitle('Åpne profil og innstillinger')

    // Open and close multiple times
    for (let i = 0; i < 3; i++) {
      // Open
      await user.click(avatar)
      await waitFor(() => {
        expect(screen.getByText('Familiemedlemmer (3)')).toBeInTheDocument()
      })

      // Close
      const closeButton = screen.getByRole('button', { name: /lukk/i })
      await user.click(closeButton)
      await waitFor(() => {
        expect(screen.queryByText('Familiemedlemmer (3)')).not.toBeInTheDocument()
      })
    }

    // Avatar should still be functional
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveTextContent('T')
  })
})

describe('Avatar Accessibility', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
  })

  it('should be keyboard accessible', async () => {
    renderWithProviders(<App />)

    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    
    // Should be focusable
    avatar.focus()
    expect(document.activeElement).toBe(avatar)

    // Should open ProfileSelector on Enter
    await user.keyboard('[Enter]')
    await waitFor(() => {
      expect(screen.getByText('Familiemedlemmer (3)')).toBeInTheDocument()
    })
  })

  it('should have proper ARIA attributes', () => {
    renderWithProviders(<App />)

    const avatar = screen.getByTitle('Åpne profil og innstillinger')
    
    // Should be a button
    expect(avatar.tagName).toBe('BUTTON')
    
    // Should have descriptive title
    expect(avatar).toHaveAttribute('title', 'Åpne profil og innstillinger')
  })
})