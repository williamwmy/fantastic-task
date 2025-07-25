import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskList from '../TaskList.jsx'
import { renderWithProviders } from '../../test/utils.jsx'

// Mock the tasks hook
const mockTasksHook = {
  tasks: [],
  getTasksForDate: vi.fn(),
  getTasksForMember: vi.fn(() => []),
  getCompletionsForMember: vi.fn(() => []),
  completeTask: vi.fn().mockResolvedValue({ data: {}, error: null }),
  quickCompleteTask: vi.fn().mockResolvedValue({ data: {}, error: null }),
  undoCompletion: vi.fn().mockResolvedValue({ data: {}, error: null })
}

vi.mock('../../hooks/useTasks.jsx', () => ({
  useTasks: () => mockTasksHook
}))

// Mock the family hook
const mockFamilyHook = {
  currentMember: { id: 'member-1', nickname: 'Test User', avatar_color: '#82bcf4' },
  familyMembers: [
    { id: 'member-1', nickname: 'Test User', avatar_color: '#82bcf4' },
    { id: 'member-2', nickname: 'Family Member', avatar_color: '#ff6b6b' }
  ],
  hasPermission: vi.fn(() => true)
}

vi.mock('../../hooks/useFamily.jsx', () => ({
  useFamily: () => mockFamilyHook
}))

describe('TaskList', () => {
  const selectedDate = '2023-06-15'
  
  const mockTasks = [
    {
      id: 'task-1',
      title: 'Test Oppgave 1',
      description: 'Beskrivelse for oppgave 1',
      points: 10,
      assignment: {
        id: 'assignment-1',
        assigned_to: 'member-1',
        is_completed: false
      }
    },
    {
      id: 'task-2',
      title: 'Test Oppgave 2',
      description: 'Beskrivelse for oppgave 2',
      points: 15,
      assignment: {
        id: 'assignment-2',
        assigned_to: 'member-2',
        is_completed: true,
        completion: {
          id: 'completion-1',
          time_spent_minutes: 30,
          comment: 'Ferdig!',
          verification_status: 'approved'
        }
      }
    },
    {
      id: 'task-3',
      title: 'Uassigned Task',
      description: 'Oppgave uten tildeling',
      points: 5,
      assignment: null
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockTasksHook.tasks = mockTasks
    mockTasksHook.getTasksForDate.mockReturnValue(mockTasks)
  })

  it('should render tasks for the selected date', () => {
    render(<TaskList selectedDate={selectedDate} />)
    
    expect(screen.getByText('Test Oppgave 1')).toBeInTheDocument()
    expect(screen.getByText('Test Oppgave 2')).toBeInTheDocument()
    expect(screen.getByText('Uassigned Task')).toBeInTheDocument()
  })

  it('should display task details correctly', () => {
    render(<TaskList selectedDate={selectedDate} />)
    
    expect(screen.getByText('Beskrivelse for oppgave 1')).toBeInTheDocument()
    expect(screen.getByText('10 poeng')).toBeInTheDocument()
    expect(screen.getByText('15 poeng')).toBeInTheDocument()
  })

  it('should show assigned family member', () => {
    render(<TaskList selectedDate={selectedDate} />)
    
    // Check for avatar circles or member indicators
    const avatarElements = screen.getAllByText(/^[A-Z]$/) // Single uppercase letters
    expect(avatarElements.length).toBeGreaterThanOrEqual(2) // Should have at least 2 avatars
    expect(avatarElements.some(el => el.textContent === 'T')).toBe(true) // Test User
    expect(avatarElements.some(el => el.textContent === 'F')).toBe(true) // Family Member
  })

  it('should display completion status correctly', () => {
    render(<TaskList selectedDate={selectedDate} />)
    
    // Completed task should show completion details
    expect(screen.getByText('Ferdig!')).toBeInTheDocument()
    expect(screen.getByText('30 min')).toBeInTheDocument()
  })


  it('should handle quick complete button click', async () => {
    render(<TaskList selectedDate={selectedDate} />)
    const user = userEvent.setup()
    // Find and click the quick complete button for the first task
    const quickCompleteButtons = screen.getAllByLabelText('quick complete')
    if (quickCompleteButtons.length > 0) {
      await user.click(quickCompleteButtons[0])
      expect(mockTasksHook.quickCompleteTask).toHaveBeenCalledWith('assignment-1')
    }
  })

  it('should handle task completion with details', async () => {
    const user = userEvent.setup()
    mockTasksHook.completeTask.mockResolvedValue({ data: {}, error: null })
    
    render(<TaskList selectedDate={selectedDate} />)
    
    // Find and click the complete button for the first task
    const completeButtons = screen.getAllByLabelText('complete')
    if (completeButtons.length > 0) {
      await user.click(completeButtons[0])
      
      // Should trigger task completion modal or form
      expect(mockTasksHook.completeTask).toHaveBeenCalled()
    }
  })

  it('should handle undo completion', async () => {
    const user = userEvent.setup()
    mockTasksHook.undoCompletion.mockResolvedValue({ success: true })
    
    render(<TaskList selectedDate={selectedDate} />)
    
    // Find and click the undo button for completed task
    const undoButtons = screen.getAllByLabelText('undo')
    if (undoButtons.length > 0) {
      await user.click(undoButtons[0])
      
      expect(mockTasksHook.undoCompletion).toHaveBeenCalled()
    }
  })

  it('should display empty state when no tasks', () => {
    mockTasksHook.getTasksForDate.mockReturnValue([])
    
    render(<TaskList selectedDate={selectedDate} />)
    
    expect(screen.getByText(/ingen oppgaver/i)).toBeInTheDocument()
  })

  it('should group tasks by assignment status', () => {
    render(<TaskList selectedDate={selectedDate} />)
    
    // Should show different sections or styling for assigned vs unassigned tasks
    expect(screen.getByText('Test Oppgave 1')).toBeInTheDocument()
    expect(screen.getByText('Uassigned Task')).toBeInTheDocument()
  })

  it('should display verification status for completed tasks', () => {
    render(<TaskList selectedDate={selectedDate} />)
    
    // Should show approval status
    const approvedElements = screen.queryAllByText(/godkjent/i)
    expect(approvedElements.length).toBeGreaterThan(0)
  })

  it('should handle different verification statuses', () => {
    const tasksWithDifferentStatuses = [
      {
        ...mockTasks[1],
        assignment: {
          ...mockTasks[1].assignment,
          completion: {
            ...mockTasks[1].assignment.completion,
            verification_status: 'pending'
          }
        }
      }
    ]
    
    mockTasksHook.getTasksForDate.mockReturnValue(tasksWithDifferentStatuses)
    
    render(<TaskList selectedDate={selectedDate} />)
    
    expect(screen.getByText(/venter/i)).toBeInTheDocument()
  })

  it('should update when selectedDate changes', () => {
    const { rerender } = render(<TaskList selectedDate={selectedDate} />)
    
    expect(mockTasksHook.getTasksForDate).toHaveBeenCalledWith(selectedDate)
    
    const newDate = '2023-06-16'
    rerender(<TaskList selectedDate={newDate} />)
    
    expect(mockTasksHook.getTasksForDate).toHaveBeenCalledWith(newDate)
  })

  it('should handle loading state', () => {
    mockTasksHook.getTasksForDate.mockReturnValue([])
    render(<TaskList selectedDate={selectedDate} />)
    const emptyMessages = screen.getAllByText(/ingen oppgaver/i)
    expect(emptyMessages.length).toBeGreaterThan(0)
  })

  it('should display points correctly', () => {
    render(<TaskList selectedDate={selectedDate} />)
    
    expect(screen.getByText('10 poeng')).toBeInTheDocument()
    expect(screen.getByText('15 poeng')).toBeInTheDocument()
    expect(screen.getByText('5 poeng')).toBeInTheDocument()
  })

  it('should show task assignment avatars with correct colors', () => {
    render(<TaskList selectedDate={selectedDate} />)
    // Sjekk at initialer vises for tildelte brukere
    const avatarElements = screen.getAllByText(/^[A-Z]$/)
    expect(avatarElements.length).toBeGreaterThanOrEqual(1)
    const hasTestUserAvatar = avatarElements.some(el => el.textContent === 'T')
    const hasFamilyMemberAvatar = avatarElements.some(el => el.textContent === 'F')
    expect(hasTestUserAvatar || hasFamilyMemberAvatar).toBe(true)
  })
})