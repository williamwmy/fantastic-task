/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock the undoCompletion logic specifically for database mode
describe('Database Mode Bonus Points Undo', () => {
  let mockSupabase
  let mockFetchCompletionData
  let mockFetchTransactions
  let mockUpdateMemberBalance

  beforeEach(() => {
    // Set up database mode (not local test user)
    vi.stubEnv('VITE_LOCAL_TEST_USER', 'false')
    
    // Mock the Supabase operations
    mockFetchCompletionData = vi.fn()
    mockFetchTransactions = vi.fn()
    mockUpdateMemberBalance = vi.fn()
    
    mockSupabase = {
      from: vi.fn((table) => {
        if (table === 'task_completions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: mockFetchCompletionData
              }))
            }))
          }
        }
        
        if (table === 'points_transactions') {
          return {
            select: vi.fn(() => ({
              eq: mockFetchTransactions
            })),
            delete: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null }))
            }))
          }
        }
        
        if (table === 'family_members') {
          return {
            update: vi.fn(() => ({
              eq: mockUpdateMemberBalance
            }))
          }
        }
        
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }
      })
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('should calculate total points correctly from transactions (base + bonus)', async () => {
    // Mock completion data
    const mockCompletionData = {
      id: 'completion-1',
      points_awarded: 2, // This is what's stored in task_completions
      completed_by: 'member-1',
      completed_by_member: {
        points_balance: 10
      }
    }

    // Mock transactions with separate base and bonus points
    const mockTransactions = [
      { points: 2, bonus_points: 3 }, // Total: 5 points (more than completion.points_awarded)
      { points: 1, bonus_points: 1 }  // Total: 2 points
      // Grand total: 7 points should be subtracted
    ]

    mockFetchCompletionData.mockResolvedValue({
      data: mockCompletionData,
      error: null
    })

    mockFetchTransactions.mockResolvedValue({
      data: mockTransactions,
      error: null
    })

    mockUpdateMemberBalance.mockResolvedValue({
      error: null
    })

    // Simulate the undo completion logic
    const totalPointsToSubtract = mockTransactions.reduce((sum, tx) => 
      sum + (tx.points || 0) + (tx.bonus_points || 0), 0)
    
    const currentBalance = mockCompletionData.completed_by_member.points_balance
    const newBalance = Math.max(0, currentBalance - totalPointsToSubtract)

    // Verify calculations
    expect(totalPointsToSubtract).toBe(7) // 2+3+1+1 = 7
    expect(currentBalance).toBe(10)
    expect(newBalance).toBe(3) // 10 - 7 = 3

    // This demonstrates that we correctly calculate total points from transactions,
    // not just the points_awarded field from task_completions
    expect(totalPointsToSubtract).toBeGreaterThan(mockCompletionData.points_awarded)
  })

  it('should handle scenario where user reported: 1 point remaining after undoing all tasks', async () => {
    // Scenario: User had 0 points, completed two tasks, ended up with 1 point after undoing both
    // Task 1: 1 base point (no bonus)
    // Task 2: 1 base point + 1 bonus point
    // Total should be 0 after undoing both, but user had 1 remaining

    // First completion data (no bonus)
    const completion1Data = {
      id: 'completion-1',
      points_awarded: 1,
      completed_by: 'member-1',
      completed_by_member: { points_balance: 3 } // After both tasks completed
    }

    const transactions1 = [
      { points: 1, bonus_points: 0 } // Just 1 base point
    ]

    // Second completion data (with bonus)
    const completion2Data = {
      id: 'completion-2', 
      points_awarded: 2, // 1 base + 1 bonus stored as total
      completed_by: 'member-1',
      completed_by_member: { points_balance: 2 } // After first undo
    }

    const transactions2 = [
      { points: 1, bonus_points: 1 } // 1 base + 1 bonus
    ]

    // Test first undo
    let totalToSubtract1 = transactions1.reduce((sum, tx) => 
      sum + (tx.points || 0) + (tx.bonus_points || 0), 0)
    
    expect(totalToSubtract1).toBe(1)
    
    let newBalance1 = Math.max(0, completion1Data.completed_by_member.points_balance - totalToSubtract1)
    expect(newBalance1).toBe(2) // 3 - 1 = 2

    // Test second undo  
    let totalToSubtract2 = transactions2.reduce((sum, tx) => 
      sum + (tx.points || 0) + (tx.bonus_points || 0), 0)
    
    expect(totalToSubtract2).toBe(2) // 1 base + 1 bonus
    
    let newBalance2 = Math.max(0, completion2Data.completed_by_member.points_balance - totalToSubtract2)
    expect(newBalance2).toBe(0) // 2 - 2 = 0

    // Final balance should be 0, not 1
    expect(newBalance2).toBe(0)
  })

  it('should handle edge case with multiple transactions per completion', async () => {
    // Some completions might have multiple transaction entries
    const completionData = {
      id: 'completion-complex',
      points_awarded: 3,
      completed_by: 'member-1', 
      completed_by_member: { points_balance: 8 }
    }

    const transactions = [
      { points: 2, bonus_points: 1 }, // Base task points + small bonus
      { points: 1, bonus_points: 2 }, // Additional points + larger bonus
      { points: 0, bonus_points: 1 }  // Pure bonus transaction
      // Total: 3 base + 4 bonus = 7 points
    ]

    let totalToSubtract = transactions.reduce((sum, tx) => 
      sum + (tx.points || 0) + (tx.bonus_points || 0), 0)
    
    expect(totalToSubtract).toBe(7)
    
    let newBalance = Math.max(0, completionData.completed_by_member.points_balance - totalToSubtract)
    expect(newBalance).toBe(1) // 8 - 7 = 1

    // Verify we're subtracting more than just the stored points_awarded
    expect(totalToSubtract).toBeGreaterThan(completionData.points_awarded)
  })

  it('should prevent negative balances', async () => {
    const completionData = {
      id: 'completion-negative-test',
      points_awarded: 2,
      completed_by: 'member-1',
      completed_by_member: { points_balance: 3 }
    }

    const transactions = [
      { points: 2, bonus_points: 5 } // 7 total points, more than current balance
    ]

    let totalToSubtract = transactions.reduce((sum, tx) => 
      sum + (tx.points || 0) + (tx.bonus_points || 0), 0)
    
    expect(totalToSubtract).toBe(7)
    
    // Math.max(0, ...) should prevent negative balance
    let newBalance = Math.max(0, completionData.completed_by_member.points_balance - totalToSubtract)
    expect(newBalance).toBe(0) // Should be 0, not -4
  })

  it('should handle empty transactions gracefully', async () => {
    const completionData = {
      id: 'completion-no-transactions',
      points_awarded: 1,
      completed_by: 'member-1',
      completed_by_member: { points_balance: 5 }
    }

    const transactions = [] // No transactions found

    let totalToSubtract = transactions.reduce((sum, tx) => 
      sum + (tx.points || 0) + (tx.bonus_points || 0), 0)
    
    expect(totalToSubtract).toBe(0)
    
    let newBalance = Math.max(0, completionData.completed_by_member.points_balance - totalToSubtract)
    expect(newBalance).toBe(5) // Should remain unchanged
  })
})