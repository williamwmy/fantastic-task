import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTasks, TasksProvider } from '../useTasks.jsx'
import { mockUser, mockFamily, mockFamilyMember } from '../../test/utils.jsx'
import { AuthProvider } from '../useAuth.jsx'
import { FamilyProvider } from '../useFamily.jsx'

describe('useTasks - Simple Tests', () => {
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
    vi.stubEnv('VITE_LOCAL_TEST_USER', 'false')
  })

  describe('Hook Initialization', () => {
    it('should provide useTasks hook without errors', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      expect(result.current).toBeDefined()
    })

    it('should initialize with empty data', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      expect(result.current.getTasks()).toEqual([])
      expect(result.current.taskAssignments).toEqual([])
      expect(result.current.taskCompletions).toEqual([])
      expect(result.current.pointsTransactions).toEqual([])
    })

    it('should expose all expected methods', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const expectedMethods = [
        'getTasks',
        'getTasksForDate',
        'createTask',
        'updateTask',
        'deleteTask',
        'assignTask',
        'completeTask',
        'verifyTaskCompletion',
        'awardPoints',
        'spendPoints',
        'getTasksForMember',
        'getCompletionsForMember',
        'getPendingVerifications',
        'getPointsTransactionsForMember',
        'loadTaskData'
      ]

      expectedMethods.forEach(method => {
        expect(typeof result.current[method]).toBe('function')
      })
    })

    it('should have loading state', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      expect(typeof result.current.loading).toBe('boolean')
    })
  })

  describe('Date Filtering', () => {
    it('should handle getTasksForDate with empty tasks', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const tasksForDate = result.current.getTasksForDate('2023-06-15')
      expect(Array.isArray(tasksForDate)).toBe(true)
      expect(tasksForDate).toHaveLength(0)
    })

    it('should handle different date formats', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const testDates = [
        '2023-06-15',
        '2023-12-25',
        new Date().toISOString().slice(0, 10)
      ]

      testDates.forEach(date => {
        const tasksForDate = result.current.getTasksForDate(date)
        expect(Array.isArray(tasksForDate)).toBe(true)
      })
    })
  })

  describe('Member Filtering', () => {
    it('should handle getTasksForMember with empty data', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const tasksForMember = result.current.getTasksForMember('member-123')
      expect(Array.isArray(tasksForMember)).toBe(true)
      expect(tasksForMember).toHaveLength(0)
    })

    it('should handle getCompletionsForMember with empty data', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const completions = result.current.getCompletionsForMember('member-123')
      expect(Array.isArray(completions)).toBe(true)
      expect(completions).toHaveLength(0)
    })

    it('should handle getPendingVerifications with empty data', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const pending = result.current.getPendingVerifications()
      expect(Array.isArray(pending)).toBe(true)
      expect(pending).toHaveLength(0)
    })

    it('should handle getPointsTransactionsForMember with empty data', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      const transactions = result.current.getPointsTransactionsForMember('member-123')
      expect(Array.isArray(transactions)).toBe(true)
      expect(transactions).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle loadTaskData without throwing', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      await act(async () => {
        // This should not throw even if Supabase operations fail
        await result.current.loadTaskData()
      })

      // Should still have empty arrays after failed load
      expect(result.current.getTasks()).toEqual([])
    })

    it('should handle createTask gracefully with invalid data', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      await act(async () => {
        try {
          await result.current.createTask({})
        } catch (error) {
          // Expected to throw due to validation or auth issues
          expect(error).toBeDefined()
        }
      })
    })

    it('should handle completeTask gracefully with invalid data', async () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      await act(async () => {
        try {
          await result.current.completeTask('invalid-assignment-id', {})
        } catch (error) {
          // Expected to throw due to validation or auth issues
          expect(error).toBeDefined()
        }
      })
    })
  })

  describe('Context Requirements', () => {
    it('should work properly when TasksProvider is present', () => {
      // Test that the hook works when context is available
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      expect(result.current).toBeDefined()
      expect(typeof result.current.getTasks).toBe('function')
    })
  })

  describe('State Management', () => {
    it('should maintain state consistency', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      // State should be consistent on multiple calls
      const tasks1 = result.current.getTasks()
      const tasks2 = result.current.getTasks()
      
      expect(tasks1).toBe(tasks2) // Should be same reference
    })

    it('should provide function references', () => {
      const { result } = renderHook(() => useTasks(), { wrapper })
      
      // Functions should be available and callable
      expect(typeof result.current.getTasks).toBe('function')
      expect(typeof result.current.createTask).toBe('function')
      
      // Functions should return consistent results
      const tasks1 = result.current.getTasks()
      const tasks2 = result.current.getTasks()
      expect(tasks1).toEqual(tasks2)
    })
  })
})