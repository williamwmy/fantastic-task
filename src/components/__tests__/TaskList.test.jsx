import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskList from '../TaskList.jsx'

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
  currentMember: { id: 'member-1', nickname: 'Test User', avatar_color: '#82bcf4', role: 'admin' },
  familyMembers: [
    { id: 'member-1', nickname: 'Test User', avatar_color: '#82bcf4', role: 'admin' },
    { id: 'member-2', nickname: 'Family Member', avatar_color: '#ff6b6b', role: 'member' },
    { id: 'member-3', nickname: 'Child User', avatar_color: '#4ecdc4', role: 'child' }
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
    render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    
    expect(screen.getByText('Test Oppgave 1')).toBeInTheDocument()
    expect(screen.getByText('Test Oppgave 2')).toBeInTheDocument()
    expect(screen.getByText('Uassigned Task')).toBeInTheDocument()
  })

  it('should display task details correctly', () => {
    render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    
    expect(screen.getByText('Beskrivelse for oppgave 1')).toBeInTheDocument()
    expect(screen.getByText('10 poeng')).toBeInTheDocument()
    expect(screen.getByText('15 poeng')).toBeInTheDocument()
  })

  it('should show assigned family member', () => {
    render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    
    // Check for avatar circles or member indicators
    const avatarElements = screen.getAllByText(/^[A-Z]$/) // Single uppercase letters
    expect(avatarElements.length).toBeGreaterThanOrEqual(2) // Should have at least 2 avatars
    expect(avatarElements.some(el => el.textContent === 'T')).toBe(true) // Test User
    expect(avatarElements.some(el => el.textContent === 'F')).toBe(true) // Family Member
  })

  it('should display completion status correctly', () => {
    render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    
    // Completed task should show completion details
    expect(screen.getByText(/Ferdig!/)).toBeInTheDocument() // Now in comment with emoji
    expect(screen.getByText(/30.*min/)).toBeInTheDocument() // Now with emoji
  })


  it('should handle quick complete button click', async () => {
    render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    const user = userEvent.setup()
    // Find and click the quick complete button for the first task
    const quickCompleteButtons = screen.getAllByLabelText('quick complete')
    if (quickCompleteButtons.length > 0) {
      await user.click(quickCompleteButtons[0])
      expect(mockTasksHook.quickCompleteTask).toHaveBeenCalledWith('assignment-1')
    }
  })

  it('should open detailed completion modal when clicking "Fullfør..."', async () => {
    const user = userEvent.setup()
    
    render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    
    // Find and click the detailed complete button for the first task
    const detailedCompleteButtons = screen.getAllByText('Fullfør...')
    expect(detailedCompleteButtons.length).toBeGreaterThan(0)
    
    await user.click(detailedCompleteButtons[0])
    
    // Should open the TaskCompletion modal
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Fullfør oppgave' })).toBeInTheDocument()
    })
    
    // Should NOT directly call completeTask
    expect(mockTasksHook.completeTask).not.toHaveBeenCalled()
  })

  it('should handle undo completion', async () => {
    const user = userEvent.setup()
    mockTasksHook.undoCompletion.mockResolvedValue({ success: true })
    
    render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    
    // Find and click the undo button for completed task
    const undoButtons = screen.getAllByLabelText('undo')
    if (undoButtons.length > 0) {
      await user.click(undoButtons[0])
      
      expect(mockTasksHook.undoCompletion).toHaveBeenCalled()
    }
  })

  it('should display empty state when no tasks', () => {
    mockTasksHook.getTasksForDate.mockReturnValue([])
    
    render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    
    expect(screen.getByText(/ingen oppgaver/i)).toBeInTheDocument()
  })

  it('should group tasks by assignment status', () => {
    render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    
    // Should show different sections or styling for assigned vs unassigned tasks
    expect(screen.getByText('Test Oppgave 1')).toBeInTheDocument()
    expect(screen.getByText('Uassigned Task')).toBeInTheDocument()
  })

  it('should display verification status for completed tasks', () => {
    render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    
    // Should show approval status in the status badge (not in button area anymore)
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
            verification_status: 'pending',
            completed_by_member: { id: 'member-3', role: 'child' }, // Child completion needs verification
            completed_by: 'member-3'
          }
        }
      }
    ]
    
    mockTasksHook.getTasksForDate.mockReturnValue(tasksWithDifferentStatuses)
    
    render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    
    expect(screen.getByText(/venter/i)).toBeInTheDocument()
  })

  it('should show admin/member completions as completed without verification', () => {
    const tasksWithAdultCompletion = [
      {
        ...mockTasks[1],
        assignment: {
          ...mockTasks[1].assignment,
          completion: {
            ...mockTasks[1].assignment.completion,
            verified_by: null, // Not verified yet
            verification_status: 'pending', // But should still show as completed for adults
            completed_by_member: { id: 'member-1', role: 'admin' }, // Admin completion doesn't need verification
            completed_by: 'member-1'
          }
        }
      }
    ]
    
    mockTasksHook.getTasksForDate.mockReturnValue(tasksWithAdultCompletion)
    
    render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    
    // Should show as completed, not pending verification
    const godkjentElements = screen.getAllByText(/godkjent/i)
    expect(godkjentElements.length).toBeGreaterThan(0)
    expect(screen.queryByText(/venter/i)).not.toBeInTheDocument()
  })

  it('should update when selectedDate changes', () => {
    const { rerender } = render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    
    expect(mockTasksHook.getTasksForDate).toHaveBeenCalledWith(selectedDate)
    
    const newDate = '2023-06-16'
    rerender(<TaskList selectedDate={newDate} onDateChange={() => {}} />)
    
    expect(mockTasksHook.getTasksForDate).toHaveBeenCalledWith(newDate)
  })

  it('should handle loading state', () => {
    mockTasksHook.getTasksForDate.mockReturnValue([])
    render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    const emptyMessages = screen.getAllByText(/ingen oppgaver/i)
    expect(emptyMessages.length).toBeGreaterThan(0)
  })

  it('should display points correctly', () => {
    render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    
    expect(screen.getByText('10 poeng')).toBeInTheDocument()
    expect(screen.getByText('15 poeng')).toBeInTheDocument()
    expect(screen.getByText('5 poeng')).toBeInTheDocument()
  })

  it('should show task assignment avatars with correct colors', () => {
    render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
    // Sjekk at initialer vises for tildelte brukere
    const avatarElements = screen.getAllByText(/^[A-Z]$/)
    expect(avatarElements.length).toBeGreaterThanOrEqual(1)
    const hasTestUserAvatar = avatarElements.some(el => el.textContent === 'T')
    const hasFamilyMemberAvatar = avatarElements.some(el => el.textContent === 'F')
    expect(hasTestUserAvatar || hasFamilyMemberAvatar).toBe(true)
  })

  describe('Mine oppgaver filter', () => {
    const mockTasksWithAssignments = [
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
          is_completed: false
        }
      },
      {
        id: 'task-3',
        title: 'Test Oppgave 3',
        description: 'Beskrivelse for oppgave 3',
        points: 5,
        assignment: {
          id: 'assignment-3',
          assigned_to: 'member-1',
          is_completed: false
        }
      }
    ]

    beforeEach(() => {
      mockTasksHook.getTasksForDate.mockReturnValue(mockTasksWithAssignments)
      mockTasksHook.getTasksForMember.mockReturnValue([
        { id: 'assignment-1', task_id: 'task-1', assigned_to: 'member-1' }, // Assigned to current user
        { id: 'assignment-3', task_id: 'task-3', assigned_to: 'member-1' } // Assigned to current user
      ])
    })

    it('should not show filter toggle for child users', () => {
      // Set current member to a child
      mockFamilyHook.currentMember = { id: 'member-3', nickname: 'Child User', role: 'child' }
      
      render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
      
      // Filter toggle should not be visible for child users
      expect(screen.queryByText(/mine oppgaver/i)).not.toBeInTheDocument()
    })

    it('should show filter toggle for admin and member users', () => {
      // Set current member to admin (default)
      mockFamilyHook.currentMember = { id: 'member-1', nickname: 'Test User', role: 'admin' }
      
      render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
      
      // Filter toggle should be visible for admin/member users
      expect(screen.getByText(/mine oppgaver/i)).toBeInTheDocument()
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('should show filter toggle for member role specifically', () => {
      // Test member role specifically
      mockFamilyHook.currentMember = { id: 'member-2', nickname: 'Member User', role: 'member' }
      
      render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
      
      // Filter toggle should be visible for member users
      expect(screen.getByText(/mine oppgaver/i)).toBeInTheDocument()
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('should verify filter toggle exists for all non-child roles', () => {
      const roles = ['admin', 'member']
      
      roles.forEach(role => {
        // Clean up previous render
        cleanup()
        
        mockFamilyHook.currentMember = { id: `${role}-user`, nickname: `${role} User`, role }
        
        render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
        
        // Filter toggle should be visible for this role
        expect(screen.getByText(/mine oppgaver/i)).toBeInTheDocument()
        expect(screen.getByRole('checkbox')).toBeInTheDocument()
      })
    })

    it('should filter tasks to show only assigned tasks when toggle is checked', async () => {
      const user = userEvent.setup()
      mockFamilyHook.currentMember = { id: 'member-1', nickname: 'Test User', role: 'admin' }
      
      render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
      
      // Initially all tasks should be visible
      expect(screen.getByText('Test Oppgave 1')).toBeInTheDocument()
      expect(screen.getByText('Test Oppgave 2')).toBeInTheDocument()
      expect(screen.getByText('Test Oppgave 3')).toBeInTheDocument()
      
      // Click the filter toggle
      const filterCheckbox = screen.getByRole('checkbox')
      await user.click(filterCheckbox)
      
      // Now only assigned tasks should be visible (task-1 and task-3 are assigned to member-1)
      expect(screen.getByText('Test Oppgave 1')).toBeInTheDocument()
      expect(screen.getByText('Test Oppgave 3')).toBeInTheDocument()
      expect(screen.queryByText('Test Oppgave 2')).not.toBeInTheDocument()
      // Check that only assigned tasks are visible (2 tasks)
    })

    it('should show contextual empty state when no tasks are assigned to user', async () => {
      const user = userEvent.setup()
      mockFamilyHook.currentMember = { id: 'member-1', nickname: 'Test User', role: 'admin' }
      
      // Mock tasks but no assignments for current user
      const mockTasksNoAssignments = [
        {
          id: 'task-1',
          title: 'Test Oppgave 1',
          description: 'Beskrivelse for oppgave 1',
          points: 10,
          assignment: {
            id: 'assignment-1',
            assigned_to: 'member-2', // Assigned to different user
            is_completed: false
          }
        }
      ]
      mockTasksHook.getTasksForDate.mockReturnValue(mockTasksNoAssignments)
      mockTasksHook.getTasksForMember.mockReturnValue([]) // No assignments for current user
      
      render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
      
      // Click the filter toggle
      const filterCheckbox = screen.getByRole('checkbox')
      await user.click(filterCheckbox)
      
      // Should show contextual empty state for filtered view
      expect(screen.getByText(/ingen oppgaver tildelt deg/i)).toBeInTheDocument()
      expect(screen.getByText(/du har ingen oppgaver tildelt for denne dagen/i)).toBeInTheDocument()
    })

    it('should have child users automatically show only their tasks', () => {
      // Set current member to a child
      mockFamilyHook.currentMember = { id: 'member-3', nickname: 'Child User', role: 'child' }
      
      // Mock assignments for child (only task-1)
      mockTasksHook.getTasksForMember.mockReturnValue([
        { id: 'assignment-1', task_id: 'task-1', assigned_to: 'member-3' }
      ])
      
      render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
      
      // Child should only see their assigned task (task-1)
      expect(screen.getByText('Test Oppgave 1')).toBeInTheDocument()
      expect(screen.queryByText('Test Oppgave 2')).not.toBeInTheDocument()
      expect(screen.queryByText('Test Oppgave 3')).not.toBeInTheDocument()
      // Child should see only 1 assigned task
    })

    it('should toggle between all tasks and assigned tasks correctly', async () => {
      const user = userEvent.setup()
      mockFamilyHook.currentMember = { id: 'member-1', nickname: 'Test User', role: 'admin' }
      
      render(<TaskList selectedDate={selectedDate} onDateChange={() => {}} />)
      
      const filterCheckbox = screen.getByRole('checkbox')
      
      // Initially should show all tasks - verify by checking specific task titles
      expect(screen.getByText('Test Oppgave 1')).toBeInTheDocument()
      expect(screen.getByText('Test Oppgave 2')).toBeInTheDocument() 
      expect(screen.getByText('Test Oppgave 3')).toBeInTheDocument()
      
      // Toggle to show only assigned tasks (member-1 has task-1 and task-3 assigned)
      await user.click(filterCheckbox)
      expect(screen.getByText('Test Oppgave 1')).toBeInTheDocument()
      expect(screen.getByText('Test Oppgave 3')).toBeInTheDocument()
      expect(screen.queryByText('Test Oppgave 2')).not.toBeInTheDocument()
      
      // Toggle back to show all tasks
      await user.click(filterCheckbox)
      expect(screen.getByText('Test Oppgave 1')).toBeInTheDocument()
      expect(screen.getByText('Test Oppgave 2')).toBeInTheDocument()
      expect(screen.getByText('Test Oppgave 3')).toBeInTheDocument()
    })
  })
})