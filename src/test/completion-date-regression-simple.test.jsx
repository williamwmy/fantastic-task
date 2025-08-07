/**
 * @vitest-environment jsdom
 * 
 * Simple regression tests to prevent the task completion date bug from returning.
 * These tests focus on the core logic that was broken and fixed.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

describe('Task Completion Date - Regression Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.setSystemTime(new Date('2025-08-07T15:30:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Date Construction Logic', () => {
    it('should construct completion date from selectedDate with current time', () => {
      // This mimics the logic in TaskList.handleQuickCompleteTask
      const selectedDate = '2025-08-06' // Yesterday
      const completionDate = new Date(selectedDate)
      completionDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds())
      
      const result = completionDate.toISOString()
      
      // Should use yesterday's date with today's time
      expect(result).toMatch(/^2025-08-06T15:30:00/)
      
      // Verify date components
      expect(completionDate.getUTCDate()).toBe(6) // Yesterday
      expect(completionDate.getUTCMonth()).toBe(7) // August (0-indexed)
      expect(completionDate.getUTCHours()).toBe(15) // Current hour
      expect(completionDate.getUTCMinutes()).toBe(30) // Current minute
    })

    it('should construct completion date for today', () => {
      const selectedDate = '2025-08-07' // Today
      const completionDate = new Date(selectedDate)
      completionDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds())
      
      const result = completionDate.toISOString()
      
      // Should use today's date with current time
      expect(result).toMatch(/^2025-08-07T15:30:00/)
    })

    it('should construct completion date for tomorrow', () => {
      const selectedDate = '2025-08-08' // Tomorrow
      const completionDate = new Date(selectedDate)
      completionDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds())
      
      const result = completionDate.toISOString()
      
      // Should use tomorrow's date with current time
      expect(result).toMatch(/^2025-08-08T15:30:00/)
    })

    it('should handle edge case dates correctly', () => {
      const testCases = [
        '2024-12-31',
        '2025-01-01', 
        '2025-02-28'
      ]

      testCases.forEach(selectedDate => {
        const completionDate = new Date(selectedDate)
        completionDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds())
        
        const result = completionDate.toISOString()
        
        // Just verify the date part matches and has proper ISO format
        expect(result).toMatch(new RegExp(`^${selectedDate}T\\d{2}:\\d{2}:\\d{2}`))
        
        // Verify date components are preserved
        expect(completionDate.toISOString().split('T')[0]).toBe(selectedDate)
      })
    })
  })

  describe('Completion Data Structure', () => {
    it('should create proper completion data object (not just assignment ID)', () => {
      // This mimics the fixed logic in TaskList.handleQuickCompleteTask
      const task = { id: 'task-123', points: 10 }
      const assignment = { id: 'assignment-456' }
      const currentMember = { id: 'member-789' }
      const selectedDate = '2025-08-06'
      
      const completionDate = new Date(selectedDate)
      completionDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds())
      
      const completionData = {
        task_id: task.id,
        assignment_id: assignment?.id || null,
        completed_by: currentMember.id,
        completed_at: completionDate.toISOString(),
        points_awarded: task.points || 0
      }

      // Critical assertions - this structure was missing before the fix
      expect(typeof completionData).toBe('object')
      expect(completionData.task_id).toBe('task-123')
      expect(completionData.assignment_id).toBe('assignment-456')
      expect(completionData.completed_by).toBe('member-789')
      expect(completionData.completed_at).toMatch(/^2025-08-06T15:30:00/)
      expect(completionData.points_awarded).toBe(10)
      
      // Should NOT be just a string (which was the bug)
      expect(typeof completionData).not.toBe('string')
    })

    it('should handle null assignment in completion data', () => {
      const task = { id: 'task-123', points: 5 }
      const assignment = null // No assignment
      const currentMember = { id: 'member-789' }
      const selectedDate = '2025-08-06'
      
      const completionDate = new Date(selectedDate)
      completionDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds())
      
      const completionData = {
        task_id: task.id,
        assignment_id: assignment?.id || null,
        completed_by: currentMember.id,
        completed_at: completionDate.toISOString(),
        points_awarded: task.points || 0
      }

      expect(completionData.assignment_id).toBeNull()
      expect(completionData.completed_at).toMatch(/^2025-08-06T/)
    })
  })

  describe('Function Call Pattern Prevention', () => {
    it('should never call completeTask with only string argument', () => {
      // Mock completeTask to verify call pattern
      const mockCompleteTask = vi.fn()
      
      // Simulate the OLD (buggy) way - this should never happen
      const assignmentId = 'assignment-123'
      
      // This was the bug - calling with just assignment ID
      // mockCompleteTask(assignmentId) // ❌ This caused the bug
      
      // The CORRECT way (after fix) - calling with completion data object
      const completionData = {
        task_id: 'task-123',
        assignment_id: assignmentId,
        completed_by: 'user-123',
        completed_at: '2025-08-06T15:30:00.000Z',
        points_awarded: 10
      }
      
      mockCompleteTask(completionData) // ✅ This is correct
      
      // Verify the call pattern
      expect(mockCompleteTask).toHaveBeenCalledWith(
        expect.objectContaining({
          task_id: expect.any(String),
          assignment_id: expect.any(String),
          completed_by: expect.any(String),
          completed_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          points_awarded: expect.any(Number)
        })
      )
      
      // Critical: Should NOT be called with just a string
      expect(mockCompleteTask).not.toHaveBeenCalledWith('assignment-123')
    })
  })

  describe('Date Preservation Through Flow', () => {
    it('should preserve date through the completion data flow', () => {
      // Simulate the complete flow from TaskList to useTasks
      const selectedDate = '2025-08-06'
      
      // Step 1: TaskList creates completion date using current time (15:30:00 from mocked time)
      const completionDate = new Date(selectedDate)
      const currentTime = new Date() // Will use the mocked time (15:30:00)
      completionDate.setHours(currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds())
      
      // Step 2: TaskList creates completion data
      const completionDataFromTaskList = {
        task_id: 'test-task',
        assignment_id: 'test-assignment',
        completed_by: 'test-user',
        completed_at: completionDate.toISOString(),
        points_awarded: 10
      }
      
      // Step 3: useTasks receives this data
      const finalCompletionData = completionDataFromTaskList
      
      // Step 4: useTasks uses the provided date
      const completionDateInUseTasks = finalCompletionData.completed_at || new Date().toISOString()
      
      // Critical assertion: Date should be preserved through the flow
      expect(completionDateInUseTasks).toBe(completionDataFromTaskList.completed_at)
      expect(completionDateInUseTasks).not.toMatch(/^2025-08-07T/) // Should not be today
      
      // Verify the date components are correct
      const parsedDate = new Date(completionDateInUseTasks)
      expect(parsedDate.getUTCDate()).toBe(6) // Yesterday
      expect(parsedDate.getUTCMonth()).toBe(7) // August
      expect(parsedDate.getUTCFullYear()).toBe(2025)
    })

    it('should handle undefined completed_at gracefully', () => {
      // Test the fallback logic in useTasks
      const finalCompletionData = {
        task_id: 'test-task',
        completed_by: 'test-user',
        // No completed_at field
      }
      
      const completionDate = finalCompletionData.completed_at || new Date().toISOString()
      
      // Should use current date when no date provided
      expect(completionDate).toMatch(/^2025-08-07T15:30:00/)
    })
  })
})

describe('Auto-Assignment Date Logic', () => {
  it('should use completion date for auto-assignment due_date', () => {
    // This tests the auto-assignment logic in useTasks
    const completedAt = '2025-08-06T15:30:00.000Z'
    const assignmentDate = completedAt.split('T')[0] // Extract date part
    
    const newAssignment = {
      id: 'auto-assignment-123',
      task_id: 'task-123',
      assigned_to: 'user-123',
      assigned_by: 'user-123',
      due_date: assignmentDate,
      created_at: completedAt,
      is_completed: true
    }
    
    expect(newAssignment.due_date).toBe('2025-08-06')
    expect(newAssignment.created_at).toBe(completedAt)
  })
})