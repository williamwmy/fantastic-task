/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { generateMockTaskCompletion } from '../lib/mockData.js'

describe('Task Completion Date Bug', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_LOCAL_TEST_USER', 'true')
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should generate mock completion with provided completion date', () => {
    const testDate = '2024-06-15T14:30:00.000Z'
    const taskId = 'test-task-1'
    const completedBy = 'test-user-1'
    
    const completionData = {
      completed_at: testDate,
      comment: 'Test completion',
      points_awarded: 10
    }

    const mockCompletion = generateMockTaskCompletion(taskId, completedBy, completionData)

    expect(mockCompletion.completed_at).toBe(testDate)
    expect(mockCompletion.task_id).toBe(taskId)
    expect(mockCompletion.completed_by).toBe(completedBy)
    expect(mockCompletion.comment).toBe('Test completion')
    expect(mockCompletion.points_awarded).toBe(10)
  })

  it('should use current date when no completion date provided', () => {
    const taskId = 'test-task-2'
    const completedBy = 'test-user-2'
    const completionData = { comment: 'No date test' }

    const beforeTime = new Date().getTime()
    const mockCompletion = generateMockTaskCompletion(taskId, completedBy, completionData)
    const afterTime = new Date().getTime()

    const completionTime = new Date(mockCompletion.completed_at).getTime()
    
    // Check that completion time is between before and after times (within reasonable range)
    expect(completionTime).toBeGreaterThanOrEqual(beforeTime - 1000) // Allow 1 second tolerance
    expect(completionTime).toBeLessThanOrEqual(afterTime + 1000)
  })

  it('should handle yesterday date correctly', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(10, 30, 45) // Set specific time
    const yesterdayISO = yesterday.toISOString()
    
    const mockCompletion = generateMockTaskCompletion('task-3', 'user-3', {
      completed_at: yesterdayISO
    })

    expect(mockCompletion.completed_at).toBe(yesterdayISO)
    
    // Verify the date part matches yesterday
    const completionDate = new Date(mockCompletion.completed_at)
    const expectedDateStr = yesterday.toISOString().split('T')[0]
    const actualDateStr = completionDate.toISOString().split('T')[0]
    
    expect(actualDateStr).toBe(expectedDateStr)
  })

  it('should handle tomorrow date correctly', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(16, 45, 30) // Set specific time
    const tomorrowISO = tomorrow.toISOString()
    
    const mockCompletion = generateMockTaskCompletion('task-4', 'user-4', {
      completed_at: tomorrowISO
    })

    expect(mockCompletion.completed_at).toBe(tomorrowISO)
    
    // Verify the date part matches tomorrow
    const completionDate = new Date(mockCompletion.completed_at)
    const expectedDateStr = tomorrow.toISOString().split('T')[0]
    const actualDateStr = completionDate.toISOString().split('T')[0]
    
    expect(actualDateStr).toBe(expectedDateStr)
  })

  it('should preserve time while using different date', () => {
    const testDate = '2024-12-25T09:15:30.123Z' // Christmas with specific time
    
    const mockCompletion = generateMockTaskCompletion('christmas-task', 'santa', {
      completed_at: testDate,
      comment: 'Ho ho ho!'
    })

    expect(mockCompletion.completed_at).toBe(testDate)
    
    // Verify both date and time are preserved using UTC methods
    const completionDateTime = new Date(mockCompletion.completed_at)
    expect(completionDateTime.getUTCFullYear()).toBe(2024)
    expect(completionDateTime.getUTCMonth()).toBe(11) // December is month 11 (0-indexed)
    expect(completionDateTime.getUTCDate()).toBe(25)
    expect(completionDateTime.getUTCHours()).toBe(9)
    expect(completionDateTime.getUTCMinutes()).toBe(15)
    expect(completionDateTime.getUTCSeconds()).toBe(30)
  })
})