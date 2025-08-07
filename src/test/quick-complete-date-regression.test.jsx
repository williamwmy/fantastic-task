/**
 * @vitest-environment jsdom
 * 
 * Regression test for the task completion date bug.
 * This test ensures that quick complete always passes completion data with the correct date,
 * not just an assignment ID which caused the original bug.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TaskList from '../components/TaskList.jsx'
import { useTasks } from '../hooks/useTasks.jsx'
import { useFamily } from '../hooks/useFamily.jsx'

// Mock the hooks
vi.mock('../hooks/useTasks.jsx')
vi.mock('../hooks/useFamily.jsx')

describe('Quick Complete Date Regression Test', () => {
  let mockCompleteTask
  let mockGetTasks
  let mockCurrentMember

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up a fixed date for consistent testing
    vi.setSystemTime(new Date('2025-08-07T15:30:00.000Z'))
    
    // Mock task data
    const mockTask = {
      id: 'test-task-1',
      title: 'Test Task',
      points: 10,
      estimated_minutes: 30
    }
    
    const mockAssignment = {
      id: 'test-assignment-1',
      task_id: 'test-task-1',
      assigned_to: 'test-user-1',
      due_date: '2025-08-06'
    }
    
    mockCurrentMember = {
      id: 'test-user-1',
      nickname: 'Test User',
      role: 'member'
    }

    // Mock functions
    mockCompleteTask = vi.fn().mockResolvedValue({ data: { id: 'completion-1' }, error: null })
    mockGetTasks = vi.fn().mockReturnValue([mockTask])
    
    // Mock useTasks hook
    useTasks.mockReturnValue({
      completeTask: mockCompleteTask,
      quickCompleteTask: mockCompleteTask, // This alias caused the original bug
      getTasks: mockGetTasks,
      taskAssignments: [mockAssignment],
      taskCompletions: [],
      getTasksForDate: vi.fn().mockReturnValue([mockTask]),
      getCompletionsForMember: vi.fn().mockReturnValue([]),
      getTasksForMember: vi.fn().mockReturnValue([mockAssignment])
    })
    
    // Mock useFamily hook
    useFamily.mockReturnValue({
      currentMember: mockCurrentMember,
      familyMembers: [mockCurrentMember],
      family: { id: 'test-family-1' },
      hasPermission: vi.fn().mockReturnValue(true)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call completeTask with completion data object when completing task on yesterday', async () => {
    const yesterdayStr = '2025-08-06' // One day before mocked "today"
    
    render(
      <TaskList 
        selectedDate={yesterdayStr} 
        onDateChange={() => {}} 
      />
    )

    // Find and click the quick complete button
    await waitFor(() => {
      const quickCompleteButton = screen.getByLabelText('quick complete')
      expect(quickCompleteButton).toBeInTheDocument()
    })

    const quickCompleteButton = screen.getByLabelText('quick complete')
    fireEvent.click(quickCompleteButton)

    // Wait for the completion to be called
    await waitFor(() => {
      expect(mockCompleteTask).toHaveBeenCalledTimes(1)
    })

    // CRITICAL TEST: Verify that completeTask was called with completion data object,
    // not just an assignment ID (which was the bug)
    const callArgs = mockCompleteTask.mock.calls[0]
    const completionData = callArgs[0]

    // Should be an object with completion data, not a string (assignment ID)
    expect(typeof completionData).toBe('object')
    expect(completionData).not.toBeNull()

    // Should have all required completion fields
    expect(completionData).toHaveProperty('task_id', 'test-task-1')
    expect(completionData).toHaveProperty('completed_by', 'test-user-1')
    expect(completionData).toHaveProperty('completed_at')
    expect(completionData).toHaveProperty('points_awarded', 10)

    // MOST IMPORTANT: The completed_at should start with yesterday's date (2025-08-06)
    // This is the core of the bug - ensuring the selected date is preserved
    expect(completionData.completed_at).toMatch(/^2025-08-06T/)
    
    // Verify it's a valid ISO timestamp
    expect(new Date(completionData.completed_at)).toBeInstanceOf(Date)
    expect(isNaN(new Date(completionData.completed_at).getTime())).toBe(false)
  })

  it('should call completeTask with today\'s date when selected date is today', async () => {
    const todayStr = '2025-08-07' // Same as mocked "today"
    
    render(
      <TaskList 
        selectedDate={todayStr} 
        onDateChange={() => {}} 
      />
    )

    const quickCompleteButton = screen.getByLabelText('quick complete')
    fireEvent.click(quickCompleteButton)

    await waitFor(() => {
      expect(mockCompleteTask).toHaveBeenCalledTimes(1)
    })

    const completionData = mockCompleteTask.mock.calls[0][0]

    // Should contain today's date
    expect(completionData.completed_at).toMatch(/^2025-08-07T/)
  })

  it('should call completeTask with future date when selected date is in future', async () => {
    const tomorrowStr = '2025-08-08' // One day after mocked "today"
    
    render(
      <TaskList 
        selectedDate={tomorrowStr} 
        onDateChange={() => {}} 
      />
    )

    const quickCompleteButton = screen.getByLabelText('quick complete')
    fireEvent.click(quickCompleteButton)

    await waitFor(() => {
      expect(mockCompleteTask).toHaveBeenCalledTimes(1)
    })

    const completionData = mockCompleteTask.mock.calls[0][0]

    // Should contain tomorrow's date
    expect(completionData.completed_at).toMatch(/^2025-08-08T/)
  })

  it('should never call completeTask with only assignment ID (regression protection)', async () => {
    const customDateStr = '2025-08-05'
    
    render(
      <TaskList 
        selectedDate={customDateStr} 
        onDateChange={() => {}} 
      />
    )

    const quickCompleteButton = screen.getByLabelText('quick complete')
    fireEvent.click(quickCompleteButton)

    await waitFor(() => {
      expect(mockCompleteTask).toHaveBeenCalledTimes(1)
    })

    const callArgs = mockCompleteTask.mock.calls[0]
    
    // Should NOT be called with just a string (assignment ID)
    expect(typeof callArgs[0]).not.toBe('string')
    
    // Should be called with exactly one argument (the completion data object)
    expect(callArgs.length).toBe(1)
    
    // The argument should be a completion data object
    expect(typeof callArgs[0]).toBe('object')
    expect(callArgs[0]).toHaveProperty('completed_at')
  })

  it('should preserve time of day while using selected date', async () => {
    const selectedDateStr = '2025-08-06'
    
    // Set a specific time for the test
    vi.setSystemTime(new Date('2025-08-07T14:25:33.123Z'))
    
    render(
      <TaskList 
        selectedDate={selectedDateStr} 
        onDateChange={() => {}} 
      />
    )

    const quickCompleteButton = screen.getByLabelText('quick complete')
    fireEvent.click(quickCompleteButton)

    await waitFor(() => {
      expect(mockCompleteTask).toHaveBeenCalledTimes(1)
    })

    const completionData = mockCompleteTask.mock.calls[0][0]
    const completionDate = new Date(completionData.completed_at)
    
    // Should use selected date (2025-08-06) but current time (14:25:33)
    expect(completionData.completed_at).toMatch(/^2025-08-06T14:25:33/)
    
    // Verify the date components
    expect(completionDate.getUTCFullYear()).toBe(2025)
    expect(completionDate.getUTCMonth()).toBe(7) // August = 7 (0-indexed)
    expect(completionDate.getUTCDate()).toBe(6)
    expect(completionDate.getUTCHours()).toBe(14)
    expect(completionDate.getUTCMinutes()).toBe(25)
    expect(completionDate.getUTCSeconds()).toBe(33)
  })
})