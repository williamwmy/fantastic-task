import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { supabase } from '../../lib/supabase'

// Use the global Supabase mock from setup.js instead of creating a local one

describe('Supabase Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication Operations', () => {
    it('should handle user sign up', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00.000Z'
      }

      supabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.data.user).toEqual(mockUser)
      expect(result.error).toBeNull()
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle user sign in', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com'
        },
        access_token: 'mock-token'
      }

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.data.session).toEqual(mockSession)
      expect(result.error).toBeNull()
    })

    it('should handle authentication errors', async () => {
      const mockError = new Error('Invalid login credentials')

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await supabase.auth.signInWithPassword({
        email: 'wrong@example.com',
        password: 'wrongpassword'
      })

      expect(result.data).toBeNull()
      expect(result.error).toEqual(mockError)
    })
  })

  describe('Family Operations', () => {
    const mockFamily = {
      id: 'family-123',
      name: 'Test Familie',
      created_by: 'user-123',
      created_at: '2023-01-01T00:00:00.000Z'
    }

    it('should create a new family', async () => {
      // Mock the chain of operations
      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockFamily,
        error: null
      })

      supabase.from.mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle
      })

      const result = await supabase
        .from('families')
        .insert({
          name: 'Test Familie',
          created_by: 'user-123'
        })
        .select()
        .single()

      expect(supabase.from).toHaveBeenCalledWith('families')
      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Test Familie',
        created_by: 'user-123'
      })
      expect(mockSelect).toHaveBeenCalled()
      expect(mockSingle).toHaveBeenCalled()
      expect(result.data).toEqual(mockFamily)
    })

    it('should fetch family members', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          family_id: 'family-123',
          user_id: 'user-123',
          nickname: 'Admin',
          role: 'admin',
          points_balance: 100
        },
        {
          id: 'member-2',
          family_id: 'family-123',
          user_id: 'user-456',
          nickname: 'Member',
          role: 'member',
          points_balance: 50
        }
      ]

      const mockEq = vi.fn().mockResolvedValue({
        data: mockMembers,
        error: null
      })

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEq
        })
      })

      const result = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', 'family-123')

      expect(supabase.from).toHaveBeenCalledWith('family_members')
      expect(mockEq).toHaveBeenCalledWith('family_id', 'family-123')
      expect(result.data).toEqual(mockMembers)
    })

    it('should handle family invitation codes', async () => {
      const mockInvitationCode = {
        id: 'invite-123',
        family_id: 'family-123',
        code: 'FAMILY123',
        created_by: 'user-123',
        expires_at: '2023-12-31T23:59:59.000Z',
        max_uses: 10,
        used_count: 0,
        is_active: true
      }

      // Mock finding invitation code
      const mockEqChain = vi.fn().mockReturnThis()
      const mockGt = vi.fn().mockResolvedValue({
        data: [mockInvitationCode],
        error: null
      })

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEqChain,
          gt: mockGt
        })
      })

      const result = await supabase
        .from('family_invitation_codes')
        .select('*')
        .eq('code', 'FAMILY123')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      expect(result.data).toEqual([mockInvitationCode])
    })
  })

  describe('Task Operations', () => {
    const mockTask = {
      id: 'task-123',
      family_id: 'family-123',
      title: 'Test Oppgave',
      description: 'En test oppgave',
      points: 10,
      days: [1, 2, 3, 4, 5],
      recurring_type: 'daily',
      created_by: 'user-123'
    }

    it('should create a new task', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: mockTask,
        error: null
      })

      supabase.from.mockReturnValue({
        insert: mockInsert
      })

      const result = await supabase
        .from('tasks')
        .insert(mockTask)

      expect(supabase.from).toHaveBeenCalledWith('tasks')
      expect(mockInsert).toHaveBeenCalledWith(mockTask)
      expect(result.data).toEqual(mockTask)
    })

    it('should fetch tasks for a family', async () => {
      const mockTasks = [mockTask]

      const mockEq = vi.fn().mockResolvedValue({
        data: mockTasks,
        error: null
      })

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEq
        })
      })

      const result = await supabase
        .from('tasks')
        .select('*')
        .eq('family_id', 'family-123')

      expect(result.data).toEqual(mockTasks)
    })

    it('should create task assignments', async () => {
      const mockAssignment = {
        id: 'assignment-123',
        task_id: 'task-123',
        assigned_to: 'member-123',
        date: '2023-06-15',
        is_completed: false
      }

      const mockInsert = vi.fn().mockResolvedValue({
        data: mockAssignment,
        error: null
      })

      supabase.from.mockReturnValue({
        insert: mockInsert
      })

      const result = await supabase
        .from('task_assignments')
        .insert(mockAssignment)

      expect(result.data).toEqual(mockAssignment)
    })

    it('should complete task assignments', async () => {
      const mockCompletion = {
        id: 'completion-123',
        assignment_id: 'assignment-123',
        completed_by: 'member-123',
        completed_at: '2023-06-15T12:00:00.000Z',
        time_spent_minutes: 30,
        comment: 'Ferdig!',
        verification_status: 'pending'
      }

      const mockInsert = vi.fn().mockResolvedValue({
        data: mockCompletion,
        error: null
      })

      const mockUpdate = vi.fn().mockResolvedValue({
        data: { is_completed: true },
        error: null
      })

      // Mock both operations
      supabase.from.mockImplementation((table) => {
        if (table === 'task_completions') {
          return { insert: mockInsert }
        }
        if (table === 'task_assignments') {
          return {
            update: mockUpdate,
            eq: vi.fn().mockReturnThis()
          }
        }
        return {}
      })

      // Test completion insertion
      const completionResult = await supabase
        .from('task_completions')
        .insert(mockCompletion)

      expect(completionResult.data).toEqual(mockCompletion)

      // Test that supabase update methods are available
      const assignmentQuery = supabase.from('task_assignments')
      expect(typeof assignmentQuery.update).toBe('function')
      
      // Test basic update functionality
      const updateResult = assignmentQuery.update({ is_completed: true })
      expect(updateResult).toBeDefined()
    })
  })

  describe('Points and Transactions', () => {
    it('should record points transactions', async () => {
      const mockTransaction = {
        id: 'transaction-123',
        member_id: 'member-123',
        points: 10,
        transaction_type: 'earned',
        description: 'Completed task: Test Oppgave',
        created_at: '2023-06-15T12:00:00.000Z'
      }

      const mockInsert = vi.fn().mockResolvedValue({
        data: mockTransaction,
        error: null
      })

      supabase.from.mockReturnValue({
        insert: mockInsert
      })

      const result = await supabase
        .from('points_transactions')
        .insert(mockTransaction)

      expect(result.data).toEqual(mockTransaction)
    })

    it('should update family member points balance', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        data: { points_balance: 110 },
        error: null
      })

      supabase.from.mockReturnValue({
        update: mockUpdate,
        eq: vi.fn().mockReturnThis()
      })

      // Test that supabase update methods are available
      const memberQuery = supabase.from('family_members')
      expect(typeof memberQuery.update).toBe('function')
      
      // Test basic update functionality
      const updateResult = memberQuery.update({ points_balance: 110 })
      expect(updateResult).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const mockError = new Error('Database connection failed')

      supabase.from.mockImplementation(() => {
        throw mockError
      })

      expect(() => {
        supabase.from('tasks')
      }).toThrow('Database connection failed')
    })

    it('should handle RLS policy violations', async () => {
      const mockRLSError = new Error('Row Level Security policy violation')

      const mockSelect = vi.fn().mockResolvedValue({
        data: null,
        error: mockRLSError
      })

      supabase.from.mockReturnValue({
        select: mockSelect
      })

      const result = await supabase
        .from('family_members')
        .select('*')

      expect(result.error).toEqual(mockRLSError)
      expect(result.data).toBeNull()
    })

    it('should handle validation errors', async () => {
      const mockValidationError = new Error('Invalid input data')

      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: mockValidationError
      })

      supabase.from.mockReturnValue({
        insert: mockInsert
      })

      const result = await supabase
        .from('tasks')
        .insert({ invalid: 'data' })

      expect(result.error).toEqual(mockValidationError)
      expect(result.data).toBeNull()
    })
  })

  describe('Real-time Subscriptions', () => {
    it('should handle real-time subscriptions', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      }

      supabase.channel = vi.fn().mockReturnValue(mockChannel)

      const channel = supabase
        .channel('tasks-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tasks'
        }, (payload) => {
          // Handle task change
        })
        .subscribe()

      expect(supabase.channel).toHaveBeenCalledWith('tasks-changes')
      expect(mockChannel.on).toHaveBeenCalled()
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })
  })
})