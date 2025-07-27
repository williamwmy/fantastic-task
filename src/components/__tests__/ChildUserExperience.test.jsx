import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App.jsx'

// Mock the hooks
const mockAuthHook = {
  user: { id: 'test-user-id', email: 'test@example.com' },
  isLoading: false,
  signOut: vi.fn()
}

const mockChildMember = {
  id: 'child-member-id', 
  nickname: 'Barn Bruker', 
  avatar_color: '#4ecdc4', 
  role: 'child',
  points_balance: 50,
  family_id: 'test-family-id'
}

const mockFamilyHook = {
  family: { id: 'test-family-id', name: 'Test Familie' },
  currentMember: mockChildMember,
  familyMembers: [
    { id: 'admin-member-id', nickname: 'Admin User', avatar_color: '#82bcf4', role: 'admin' },
    mockChildMember
  ],
  hasPermission: vi.fn((permission) => {
    // Child users should not have these permissions
    const childPermissions = ['complete_own_tasks', 'view_points', 'edit_own_profile']
    return childPermissions.includes(permission)
  }),
  setCurrentMember: vi.fn()
}

const mockTasksHook = {
  tasks: [],
  getTasksForDate: vi.fn(() => []),
  getTasksForMember: vi.fn(() => []),
  getCompletionsForMember: vi.fn(() => []),
  getPendingVerifications: vi.fn(() => []),
  getTasks: vi.fn(() => []),
  loadTaskData: vi.fn(),
  completeTask: vi.fn(),
  quickCompleteTask: vi.fn(),
  undoCompletion: vi.fn(),
  getPointsTransactionsForMember: vi.fn(() => []),
  getTasksAndCompletions: vi.fn(() => ({ tasks: [], completions: [] }))
}

vi.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: () => mockAuthHook
}))

vi.mock('../../hooks/useFamily.jsx', () => ({
  useFamily: () => mockFamilyHook
}))

vi.mock('../../hooks/useTasks.jsx', () => ({
  useTasks: () => mockTasksHook
}))

describe('Child User Experience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not show any "Ingen tilgang til denne funksjonen" messages for child users', async () => {
    render(<App />)
    
    // Child user should be logged in and see the main app
    // Note: nickname is only the first letter "B" in the avatar, full name not shown in main UI
    expect(screen.getByText('50 poeng')).toBeInTheDocument()
    
    // Should NOT see any access denied messages
    expect(screen.queryByText(/ingen tilgang til denne funksjonen/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/ingen tilgang/i)).not.toBeInTheDocument()
    
    // Should not see admin-only buttons in header
    expect(screen.queryByTitle('Alle oppgaver')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Verifiser barns oppgaver')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Admin-panel')).not.toBeInTheDocument()
  })

  it('should not show task assignment buttons for child users', async () => {
    // Mock some tasks to show
    const mockTasks = [
      {
        id: 'task-1',
        title: 'Test Oppgave',
        description: 'Test beskrivelse',
        points: 10,
        assignment: {
          id: 'assignment-1',
          assigned_to: 'child-member-id',
          is_completed: false
        }
      }
    ]
    
    mockTasksHook.getTasksForDate.mockReturnValue(mockTasks)
    
    render(<App />)
    
    // Should show the task
    expect(screen.getByText('Test Oppgave')).toBeInTheDocument()
    
    // Should NOT show assignment button
    expect(screen.queryByText('Tildel')).not.toBeInTheDocument()
  })

  it('should not allow child users to access task verification modal', async () => {
    render(<App />)
    
    // Child verification button should not be visible
    expect(screen.queryByTitle('Verifiser barns oppgaver')).not.toBeInTheDocument()
    
    // Even if we try to find it by icon or other means, it should not exist
    const verificationButtons = screen.queryAllByRole('button')
    const hasVerificationButton = verificationButtons.some(button => 
      button.getAttribute('title') === 'Verifiser barns oppgaver' ||
      button.textContent?.includes('Verifiser') ||
      button.textContent?.includes('Child')
    )
    
    expect(hasVerificationButton).toBe(false)
  })

  it('should not show create task functionality for child users', async () => {
    render(<App />)
    
    // Should not see add task button
    expect(screen.queryByLabelText('Legg til oppgave')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Legg til oppgave')).not.toBeInTheDocument()
  })

  it('should show child-appropriate UI elements only', async () => {
    render(<App />)
    
    // Should see basic functionality
    expect(screen.getByText('50 poeng')).toBeInTheDocument()
    
    // Should see profile and stats buttons (these are allowed)
    expect(screen.getByTitle('Bytt profil')).toBeInTheDocument()
    expect(screen.getByTitle('Statistikk')).toBeInTheDocument()
    expect(screen.getByTitle('Poenghistorikk')).toBeInTheDocument()
    
    // Should see date navigation
    expect(screen.getByLabelText('Forrige dag')).toBeInTheDocument()
    expect(screen.getByLabelText('Neste dag')).toBeInTheDocument()
  })

  it('should handle clicking on allowed buttons without showing error messages', async () => {
    const user = userEvent.setup()
    
    render(<App />)
    
    // Click on profile button - should work fine
    const profileButton = screen.getByTitle('Bytt profil')
    await user.click(profileButton)
    
    // Should open profile modal, not show error
    expect(screen.queryByText(/ingen tilgang/i)).not.toBeInTheDocument()
    
    // Should see profile selector
    expect(screen.getByText('Familiemedlemmer')).toBeInTheDocument()
  })
})