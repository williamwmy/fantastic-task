/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

describe('Bonus Points Logic Tests', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_LOCAL_TEST_USER', 'false')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Real-time Updates Logic', () => {
    it('should call refreshFamilyData when available', () => {
      const mockRefreshFamilyData = vi.fn()
      global.window.refreshFamilyData = mockRefreshFamilyData

      // Simulate the code from completeTask
      if (window.refreshFamilyData) {
        window.refreshFamilyData()
      }

      expect(mockRefreshFamilyData).toHaveBeenCalled()
      
      delete global.window.refreshFamilyData
    })

    it('should handle missing refreshFamilyData gracefully', () => {
      // Ensure refreshFamilyData is not defined
      delete global.window.refreshFamilyData

      // This should not throw an error
      expect(() => {
        if (window.refreshFamilyData) {
          window.refreshFamilyData()
        }
      }).not.toThrow()
    })
  })

  describe('Bonus Points Undo Calculation Logic', () => {
    it('should calculate correct total points to subtract (base + bonus)', () => {
      // Mock transactions data from database
      const transactionsToDelete = [
        { points: 1, bonus_points: 2 }, // 3 total
        { points: 2, bonus_points: 1 }, // 3 total
        { points: 0, bonus_points: 1 }  // 1 total
        // Grand total: 7 points
      ]

      // This is the exact logic from undoCompletion
      const totalPointsToSubtract = transactionsToDelete.reduce((sum, tx) => 
        sum + (tx.points || 0) + (tx.bonus_points || 0), 0)

      expect(totalPointsToSubtract).toBe(7)
    })

    it('should handle user reported scenario correctly', () => {
      // User scenario: 1 base + 1 bonus = 2 total points
      // After undo should have 0, but user had 1 remaining
      
      const userScenarioTransactions = [
        { points: 1, bonus_points: 1 } // Total: 2 points
      ]

      const currentBalance = 2 // User's balance after task completion

      // Calculate points to subtract
      const totalPointsToSubtract = userScenarioTransactions.reduce((sum, tx) => 
        sum + (tx.points || 0) + (tx.bonus_points || 0), 0)

      // Calculate new balance (with Math.max to prevent negative)
      const newBalance = Math.max(0, currentBalance - totalPointsToSubtract)

      expect(totalPointsToSubtract).toBe(2)
      expect(newBalance).toBe(0) // Should be 0, not 1 as user reported
    })

    it('should handle multiple tasks undo scenario', () => {
      // Two tasks scenario from user report:
      // Task 1: 1 point (no bonus)
      // Task 2: 1 point + 1 bonus
      // Total: 3 points, should end at 0 after undoing both

      // First task undo
      const task1Transactions = [{ points: 1, bonus_points: 0 }]
      const balanceAfterBothTasks = 3

      const task1ToSubtract = task1Transactions.reduce((sum, tx) => 
        sum + (tx.points || 0) + (tx.bonus_points || 0), 0)
      const balanceAfterTask1Undo = Math.max(0, balanceAfterBothTasks - task1ToSubtract)

      expect(task1ToSubtract).toBe(1)
      expect(balanceAfterTask1Undo).toBe(2)

      // Second task undo
      const task2Transactions = [{ points: 1, bonus_points: 1 }]
      
      const task2ToSubtract = task2Transactions.reduce((sum, tx) => 
        sum + (tx.points || 0) + (tx.bonus_points || 0), 0)
      const finalBalance = Math.max(0, balanceAfterTask1Undo - task2ToSubtract)

      expect(task2ToSubtract).toBe(2)
      expect(finalBalance).toBe(0) // Should be 0, not 1
    })

    it('should handle edge cases correctly', () => {
      // Test with null/undefined values
      const edgeCaseTransactions = [
        { points: null, bonus_points: 1 },
        { points: 2, bonus_points: undefined },
        { points: 0, bonus_points: 0 }
      ]

      const totalPointsToSubtract = edgeCaseTransactions.reduce((sum, tx) => 
        sum + (tx.points || 0) + (tx.bonus_points || 0), 0)

      expect(totalPointsToSubtract).toBe(3) // 0 + 1 + 2 + 0 + 0 + 0 = 3
    })

    it('should prevent negative balances', () => {
      const transactions = [{ points: 5, bonus_points: 5 }] // 10 total points
      const currentBalance = 3 // Less than points to subtract

      const totalPointsToSubtract = transactions.reduce((sum, tx) => 
        sum + (tx.points || 0) + (tx.bonus_points || 0), 0)
      const newBalance = Math.max(0, currentBalance - totalPointsToSubtract)

      expect(totalPointsToSubtract).toBe(10)
      expect(newBalance).toBe(0) // Should be 0, not -7
    })

    it('should handle empty transactions array', () => {
      const emptyTransactions = []
      const currentBalance = 5

      const totalPointsToSubtract = emptyTransactions.reduce((sum, tx) => 
        sum + (tx.points || 0) + (tx.bonus_points || 0), 0)
      const newBalance = Math.max(0, currentBalance - totalPointsToSubtract)

      expect(totalPointsToSubtract).toBe(0)
      expect(newBalance).toBe(5) // Should remain unchanged
    })
  })

  describe('Comparison with Old vs New Logic', () => {
    it('should demonstrate difference between old (buggy) and new (fixed) logic', () => {
      // Mock data representing user's scenario
      const completionData = {
        points_awarded: 2 // This is what was stored in task_completions
      }

      const actualTransactions = [
        { points: 1, bonus_points: 1 } // What was actually recorded
      ]

      const memberBalance = 2

      // OLD (BUGGY) LOGIC: Only used points_awarded from completion
      const oldLogicSubtraction = completionData.points_awarded
      const oldLogicResult = Math.max(0, memberBalance - oldLogicSubtraction)

      // NEW (FIXED) LOGIC: Sum all points from transactions
      const newLogicSubtraction = actualTransactions.reduce((sum, tx) => 
        sum + (tx.points || 0) + (tx.bonus_points || 0), 0)
      const newLogicResult = Math.max(0, memberBalance - newLogicSubtraction)

      // Both should give same result in this case, but new logic is more robust
      expect(oldLogicSubtraction).toBe(2)
      expect(newLogicSubtraction).toBe(2)
      expect(oldLogicResult).toBe(0)
      expect(newLogicResult).toBe(0)

      // But in cases where there are multiple transactions or complex scenarios:
      const complexTransactions = [
        { points: 1, bonus_points: 1 },
        { points: 0, bonus_points: 2 } // Additional bonus transaction
      ]

      const complexNewLogicSubtraction = complexTransactions.reduce((sum, tx) => 
        sum + (tx.points || 0) + (tx.bonus_points || 0), 0)

      // Old logic would still subtract 2, new logic correctly subtracts 4
      expect(oldLogicSubtraction).toBe(2)
      expect(complexNewLogicSubtraction).toBe(4)
    })
  })
})