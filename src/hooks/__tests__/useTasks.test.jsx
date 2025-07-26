import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTasks, TasksProvider } from '../useTasks.jsx'
import { mockTask, mockTaskAssignment, mockTaskCompletion, mockUser, mockFamily, mockFamilyMember } from '../../test/utils.jsx'
import { AuthProvider } from '../useAuth.jsx'
import { FamilyProvider } from '../useFamily.jsx'

describe('useTasks', () => {
  const wrapper = ({ children }) => (
    <AuthProvider initialUser={mockUser}>
      <FamilyProvider initialFamily={mockFamily} initialMember={mockFamilyMember}>
        <TasksProvider>
          {children}
        </TasksProvider>
      </FamilyProvider>
    </AuthProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_LOCAL_TEST_USER', 'true')
  })

  describe('Task Data Loading', () => {
    it('should initialize with empty task data', () => {
      // Use wrapper without initial family/member to prevent auto-loading
      const emptyWrapper = ({ children }) => (
        <AuthProvider initialUser={mockUser}>
          <FamilyProvider>
            <TasksProvider>
              {children}
            </TasksProvider>
          </FamilyProvider>
        </AuthProvider>
      )
      const { result } = renderHook(() => useTasks(), { wrapper: emptyWrapper })
      
      expect(result.current.getTasks()).toEqual([])
      expect(result.current.getTasksForDate('2023-06-15')).toEqual([])
    })

    it('should load mock data in test mode', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      await act(async () => {
        await result.current.loadTaskData()
      })
      
      // Should load mock tasks
      const tasks = result.current.getTasks()
      expect(tasks.length).toBeGreaterThan(0)
    })

    it('should filter tasks by date correctly', () => {
      const testTasks = [
        {
          ...mockTask,
          id: 'task-1',
          days: [1, 2, 3], // Mon, Tue, Wed
          assignment: {
            ...mockTaskAssignment,
            date: '2023-06-15' // Thursday
          }
        },
        {
          ...mockTask,
          id: 'task-2',
          days: [4], // Thursday
          assignment: {
            ...mockTaskAssignment,
            date: '2023-06-15'
          }
        }
      ]

      const { result } = renderHook(() => useTasks(), { wrapper })
      
      act(() => {
        result.current.setTasks(testTasks)
      })

      const tasksForDate = result.current.getTasksForDate('2023-06-15')
      
      // Should include task-2 (Thursday task) but may also include task-1 if assigned
      expect(tasksForDate.length).toBeGreaterThan(0)
      expect(tasksForDate.some(t => t.id === 'task-2')).toBe(true)
    })
  })

  describe('Task Operations', () => {
    it('should create a new task', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const newTask = {
        title: 'New Test Task',
        description: 'A new task for testing',
        points: 15,
        days: [1, 2, 3, 4, 5],
        recurring_type: 'daily'
      }

      await act(async () => {
        await result.current.createTask(newTask)
      })

      // In mock mode, task should be added locally
      const tasks = result.current.getTasks()
      const createdTask = tasks.find(t => t.title === 'New Test Task')
      expect(createdTask).toBeDefined()
    })

    it('should update an existing task', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      // First create a task
      const initialTask = {
        id: 'task-update-test',
        title: 'Original Title',
        description: 'Original description',
        points: 10
      }

      act(() => {
        result.current.setTasks([initialTask])
      })

      // Then update it
      const updates = {
        title: 'Updated Title',
        points: 20
      }

      await act(async () => {
        await result.current.updateTask('task-update-test', updates)
      })

      const tasks = result.current.getTasks()
      const updatedTask = tasks.find(t => t.id === 'task-update-test')
      
      expect(updatedTask).toBeDefined()
      expect(updatedTask.title).toBe('Updated Title')
      expect(updatedTask.points).toBe(20)
      expect(updatedTask.description).toBe('Original description') // Should preserve unchanged fields
    })

    it('should delete a task', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const testTask = { ...mockTask, id: 'task-to-delete' }
      
      act(() => {
        result.current.setTasks([testTask])
      })

      expect(result.current.getTasks().length).toBe(1)

      await act(async () => {
        await result.current.deleteTask('task-to-delete')
      })

      expect(result.current.getTasks().length).toBe(0)
    })
  })

  describe('Task Completion', () => {
    it('should complete a task assignment', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const taskWithAssignment = {
        ...mockTask,
        id: 'test-task-completion',
        assignment: {
          ...mockTaskAssignment,
          is_completed: false
        }
      }

      act(() => {
        result.current.setTasks([taskWithAssignment])
      })

      const completionData = {
        time_spent_minutes: 45,
        comment: 'Task completed successfully!',
        verification_status: 'pending'
      }

      await act(async () => {
        await result.current.completeTask(taskWithAssignment.assignment.id, completionData)
      })

      const tasks = result.current.getTasks()
      const completedTask = tasks.find(t => t.id === 'test-task-completion')
      
      expect(completedTask.assignment.is_completed).toBe(true)
      expect(completedTask.assignment.completion).toBeDefined()
      expect(completedTask.assignment.completion.comment).toBe('Task completed successfully!')
    })

    it('should handle quick task completion', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const taskWithAssignment = {
        ...mockTask,
        id: 'test-task-quick',
        assignment: {
          ...mockTaskAssignment,
          is_completed: false
        }
      }

      act(() => {
        result.current.setTasks([taskWithAssignment])
      })

      await act(async () => {
        await result.current.completeTask(taskWithAssignment.assignment.id)
      })

      const tasks = result.current.getTasks()
      const completedTask = tasks.find(t => t.id === 'test-task-quick')
      
      expect(completedTask.assignment.is_completed).toBe(true)
      expect(completedTask.assignment.completion).toBeDefined()
    })

    it('should undo task completion', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const completedTask = {
        ...mockTask,
        id: 'test-task-undo',
        assignment: {
          ...mockTaskAssignment,
          is_completed: true,
          completion: mockTaskCompletion
        }
      }

      act(() => {
        result.current.setTasks([completedTask])
      })

      await act(async () => {
        await result.current.undoCompletion(completedTask.assignment.id)
      })

      const tasks = result.current.getTasks()
      const uncompletedTask = tasks.find(t => t.id === 'test-task-undo')
      
      expect(uncompletedTask.assignment.is_completed).toBe(false)
      expect(uncompletedTask.assignment.completion).toBeUndefined()
    })
  })

  describe('Task Assignment', () => {
    it('should assign task to family member', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const unassignedTask = { 
        ...mockTask, 
        id: 'test-task-assign',
        assignment: null 
      }
      
      act(() => {
        result.current.setTasks([unassignedTask])
      })

      await act(async () => {
        await result.current.assignTask('test-task-assign', 'member-456', '2023-06-15')
      })

      const tasks = result.current.getTasks()
      const assignedTask = tasks.find(t => t.id === 'test-task-assign')
      
      expect(assignedTask.assignment).toBeDefined()
      expect(assignedTask.assignment.assigned_to).toBe('member-456')
      expect(assignedTask.assignment.date).toBe('2023-06-15')
    })

    it('should reassign task to different member', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const assignedTask = {
        ...mockTask,
        id: 'test-task-reassign',
        assignment: {
          ...mockTaskAssignment,
          assigned_to: 'member-123'
        }
      }

      act(() => {
        result.current.setTasks([assignedTask])
      })

      await act(async () => {
        await result.current.assignTask('test-task-reassign', 'member-456', '2023-06-15')
      })

      const tasks = result.current.getTasks()
      const reassignedTask = tasks.find(t => t.id === 'test-task-reassign')
      
      expect(reassignedTask.assignment.assigned_to).toBe('member-456')
    })
  })

  describe('Verification and Approval', () => {
    it('should get pending verifications', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const tasksWithPendingVerifications = [
        {
          ...mockTask,
          id: 'task-1',
          assignment: {
            ...mockTaskAssignment,
            is_completed: true,
            completion: {
              ...mockTaskCompletion,
              verification_status: 'pending'
            }
          }
        },
        {
          ...mockTask,
          id: 'task-2',
          assignment: {
            ...mockTaskAssignment,
            is_completed: true,
            completion: {
              ...mockTaskCompletion,
              verification_status: 'approved'
            }
          }
        }
      ]

      act(() => {
        result.current.setTasks(tasksWithPendingVerifications)
        result.current.setTaskCompletions([
          {
            ...mockTaskCompletion,
            verification_status: 'pending',
            completed_by_member: { role: 'child' },
            verified_by: null
          }
        ])
      })

      const pendingVerifications = result.current.getPendingVerifications()
      
      expect(pendingVerifications.length).toBe(1)
    })

    it('should approve task completion', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const taskWithPendingCompletion = {
        ...mockTask,
        id: 'test-task-approve',
        assignment: {
          ...mockTaskAssignment,
          is_completed: true,
          completion: {
            ...mockTaskCompletion,
            verification_status: 'pending'
          }
        }
      }

      act(() => {
        result.current.setTasks([taskWithPendingCompletion])
      })

      await act(async () => {
        await result.current.approveCompletion(taskWithPendingCompletion.assignment.completion.id)
      })

      const tasks = result.current.getTasks()
      const approvedTask = tasks.find(t => t.id === 'test-task-approve')
      
      expect(approvedTask.assignment.completion.verification_status).toBe('approved')
    })

    it('should reject task completion', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const taskWithPendingCompletion = {
        ...mockTask,
        id: 'test-task-reject',
        assignment: {
          ...mockTaskAssignment,
          is_completed: true,
          completion: {
            ...mockTaskCompletion,
            verification_status: 'pending'
          }
        }
      }

      act(() => {
        result.current.setTasks([taskWithPendingCompletion])
      })

      await act(async () => {
        await result.current.rejectCompletion(taskWithPendingCompletion.assignment.completion.id, 'Not done properly')
      })

      const tasks = result.current.getTasks()
      const rejectedTask = tasks.find(t => t.id === 'test-task-reject')
      
      expect(rejectedTask.assignment.completion.verification_status).toBe('rejected')
      expect(rejectedTask.assignment.is_completed).toBe(false) // Should mark as incomplete again
    })
  })

  describe('Flexible Recurring Tasks', () => {
    it('should handle weekly flexible tasks', () => {
      const weeklyFlexibleTask = {
        ...mockTask,
        recurring_type: 'weekly_flexible',
        flexible_interval: 7,
        days: [] // No specific days for flexible tasks
      }

      const { result } = renderHook(() => useTasks(), { wrapper })
      
      act(() => {
        result.current.setTasks([weeklyFlexibleTask])
      })

      // Should be available for any date when not completed recently
      const tasksForToday = result.current.getTasksForDate(new Date().toISOString().slice(0, 10))
      
      expect(tasksForToday.some(t => t.id === weeklyFlexibleTask.id)).toBe(true)
    })

    it('should handle monthly flexible tasks', () => {
      const monthlyFlexibleTask = {
        ...mockTask,
        recurring_type: 'monthly_flexible',
        flexible_interval: 30,
        days: []
      }

      const { result } = renderHook(() => useTasks(), { wrapper })
      
      act(() => {
        result.current.setTasks([monthlyFlexibleTask])
      })

      const tasksForToday = result.current.getTasksForDate(new Date().toISOString().slice(0, 10))
      
      expect(tasksForToday.some(t => t.id === monthlyFlexibleTask.id)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle task creation errors gracefully', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      // Mock a task creation that would fail validation
      const invalidTask = {
        title: '', // Empty title should fail validation
        points: -5 // Negative points should fail validation
      }

      await act(async () => {
        const response = await result.current.createTask(invalidTask)
        expect(response.error).toBeDefined()
      })
    })

    it('should handle completion errors gracefully', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      // Try to complete non-existent assignment
      await act(async () => {
        const response = await result.current.completeTask('non-existent-assignment-id')
        expect(response.error).toBeDefined()
      })
    })

    it('should handle network errors in real mode', async () => {
      vi.stubEnv('VITE_LOCAL_TEST_USER', 'false')
      
      // Mock network failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      await act(async () => {
        const response = await result.current.loadTaskData()
        expect(response.error).toBeDefined()
      })
    })
  })
})