import { useState, useEffect, createContext, useContext } from 'react'
import { useAuth } from './useAuth.jsx'
import { useFamily } from './useFamily.jsx'
import { supabase } from '../lib/supabase'
import { mockData, generateMockTask, generateMockTaskCompletion, generateMockPointsTransaction } from '../lib/mockData'

const TasksContext = createContext({})

export const useTasks = () => {
  const context = useContext(TasksContext)
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider')
  }
  return context
}

const LOCAL_TEST_USER = import.meta.env.VITE_LOCAL_TEST_USER === 'true';

export const TasksProvider = ({ children }) => {
  const { user } = useAuth()
  const { family, currentMember, familyMembers } = useFamily()
  
  const [tasks, setTasks] = useState([])
  const [taskAssignments, setTaskAssignments] = useState([])
  const [taskCompletions, setTaskCompletions] = useState([])
  const [pointsTransactions, setPointsTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  // Real-time subscriptions
  const [subscriptions, setSubscriptions] = useState([])

  // Load all task-related data when family changes
  useEffect(() => {
    if (family && currentMember) {
      if (import.meta.env.VITE_LOCAL_TEST_USER === 'true') {
        loadMockTaskData()
      } else {
        loadTaskData()
        setupSubscriptions()
      }
    } else {
      setTasks([])
      setTaskAssignments([])
      setTaskCompletions([])
      setPointsTransactions([])
      if (!LOCAL_TEST_USER) {
        cleanupSubscriptions()
      }
    }

    return () => {
      if (!LOCAL_TEST_USER) {
        cleanupSubscriptions()
      }
    }
  }, [family, currentMember])

  const loadMockTaskData = () => {
    // Use centralized mock data
    setTasks(mockData.tasks);
    setTaskAssignments(mockData.taskAssignments);
    setTaskCompletions(mockData.taskCompletions);
    setPointsTransactions(mockData.pointsTransactions);
    setLoading(false);
  };

  const loadTaskData = async () => {
    try {
      setLoading(true)
      
      // Check for LOCAL_TEST_USER dynamically
      const isLocalTestUser = import.meta.env.VITE_LOCAL_TEST_USER === 'true'
      
      if (isLocalTestUser) {
        loadMockTaskData()
        return { data: {}, error: null }
      }
      
      await Promise.all([
        loadTasks(),
        loadTaskAssignments(),
        loadTaskCompletions(),
        loadPointsTransactions()
      ])
      return { data: {}, error: null }
    } catch (error) {
      console.error('Error loading task data:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const loadTasks = async () => {
    if (!family) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('family_id', family.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const loadTaskAssignments = async () => {
    if (!family) return

    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select(`
          *,
          tasks(*),
          assigned_to_member:family_members!assigned_to(*),
          assigned_by_member:family_members!assigned_by(*)
        `)
        .eq('tasks.family_id', family.id)
        .order('due_date', { ascending: true })

      if (error) throw error
      setTaskAssignments(data || [])
    } catch (error) {
      console.error('Error loading task assignments:', error)
    }
  }

  const loadTaskCompletions = async () => {
    if (!family) return

    try {
      const { data, error } = await supabase
        .from('task_completions')
        .select(`
          *,
          tasks(*),
          completed_by_member:family_members!completed_by(*),
          verified_by_member:family_members!verified_by(*)
        `)
        .eq('tasks.family_id', family.id)
        .order('completed_at', { ascending: false })

      if (error) throw error
      setTaskCompletions(data || [])
    } catch (error) {
      console.error('Error loading task completions:', error)
    }
  }

  const loadPointsTransactions = async () => {
    if (!family) return

    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select(`
          *,
          family_members(*),
          task_completions(*, tasks(*))
        `)
        .eq('family_members.family_id', family.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPointsTransactions(data || [])
    } catch (error) {
      console.error('Error loading points transactions:', error)
    }
  }

  // Real-time subscriptions
  const setupSubscriptions = () => {
    if (!family) return

    const newSubscriptions = []

    // Tasks subscription
    const tasksSubscription = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `family_id=eq.${family.id}`
        },
        () => loadTasks()
      )
      .subscribe()

    // Task assignments subscription
    const assignmentsSubscription = supabase
      .channel('task_assignments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_assignments'
        },
        () => loadTaskAssignments()
      )
      .subscribe()

    // Task completions subscription
    const completionsSubscription = supabase
      .channel('task_completions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_completions'
        },
        () => loadTaskCompletions()
      )
      .subscribe()

    // Points transactions subscription
    const pointsSubscription = supabase
      .channel('points_transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'points_transactions'
        },
        () => {
          loadPointsTransactions()
          // Also refresh family member balances
          if (window.refreshFamilyData) {
            window.refreshFamilyData()
          }
        }
      )
      .subscribe()

    newSubscriptions.push(
      tasksSubscription,
      assignmentsSubscription,
      completionsSubscription,
      pointsSubscription
    )

    setSubscriptions(newSubscriptions)
  }

  const cleanupSubscriptions = () => {
    subscriptions.forEach(subscription => {
      supabase.removeChannel(subscription)
    })
    setSubscriptions([])
  }

  // Task CRUD operations
  const getTasks = () => {
    // Ensure we always return an array
    return Array.isArray(tasks) ? tasks : []
  }

  const createTask = async (taskData) => {
    try {
      if (import.meta.env.VITE_LOCAL_TEST_USER === 'true') {
        // Generate mock task using helper function
        const mockTask = { ...generateMockTask(taskData), assignment: null };
        setTasks(prev => [mockTask, ...prev]);
        return { data: mockTask, error: null };
      }

      if (!currentMember || !family) {
        throw new Error('User not properly authenticated')
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          family_id: family.id,
          created_by: currentMember.id
        })
        .select()
        .single()

      if (error) throw error

      // Reload tasks immediately to update UI
      await loadTasks()

      return { data, error: null }
    } catch (error) {
      console.error('Error creating task:', error)
      return { data: null, error }
    }
  }

  const updateTask = async (taskId, data) => {
    try {
      if (import.meta.env.VITE_LOCAL_TEST_USER === 'true') {
        setTasks(prev => prev.map(task =>
          task.id === taskId ? { ...task, ...data } : task
        ));
        const updatedTask = { ...tasks.find(t => t.id === taskId), ...data };
        return { data: updatedTask, error: null };
      }
      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error

      return { data: updatedTask, error: null }
    } catch (error) {
      console.error('Error updating task:', error)
      return { data: null, error }
    }
  }

  const deleteTask = async (taskId) => {
    try {
      if (import.meta.env.VITE_LOCAL_TEST_USER === 'true') {
        // Remove task from local state
        setTasks(prev => prev.filter(task => task.id !== taskId))
        return { error: null }
      }

      const { error } = await supabase
        .from('tasks')
        .update({ is_active: false })
        .eq('id', taskId)

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error deleting task:', error)
      return { error }
    }
  }

  const assignTask = async (taskId, memberId, dueDate) => {
    try {
      if (import.meta.env.VITE_LOCAL_TEST_USER === 'true') {
        setTasks(prev => prev.map(task =>
          task.id === taskId
            ? {
                ...task,
                assignment: {
                  id: `assignment-${taskId}`,
                  assigned_to: memberId,
                  assigned_by: currentMember.id,
                  due_date: dueDate,
                  date: dueDate,
                  is_completed: false,
                  completion: undefined
                }
              }
            : task
        ));
        const assignedTask = tasks.find(t => t.id === taskId);
        return { data: assignedTask, error: null };
      }
      if (!currentMember) {
        throw new Error('Current member not found')
      }

      const { data, error } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          assigned_to: memberId,
          assigned_by: currentMember.id,
          due_date: dueDate
        })
        .select()
        .single()

      if (error) throw error

      // Reload assignments immediately to update UI
      await loadTaskAssignments()

      return { data, error: null }
    } catch (error) {
      console.error('Error assigning task:', error)
      return { data: null, error }
    }
  }

  const completeTask = async (assignmentIdOrData, completionData) => {
    try {
      // Handle both signatures: completeTask(completionData) and completeTask(assignmentId, completionData)
      let finalCompletionData;
      if (typeof assignmentIdOrData === 'string') {
        // Called as completeTask(assignmentId) or completeTask(assignmentId, completionData)
        const assignmentId = assignmentIdOrData;
        const task = tasks.find(t => t.assignment?.id === assignmentId);
        if (!task) {
          throw new Error('Task with assignment not found');
        }
        finalCompletionData = {
          assignment_id: assignmentId,
          task_id: task.id,
          completed_by: currentMember?.id,
          ...(completionData || {}) // Handle quick completion when completionData is undefined
        };
      } else {
        // Called as completeTask(completionData)
        finalCompletionData = assignmentIdOrData;
      }

      if (import.meta.env.VITE_LOCAL_TEST_USER === 'true') {
        // Generate mock completion using helper function
        const mockCompletion = generateMockTaskCompletion(
          finalCompletionData.task_id, 
          finalCompletionData.completed_by, 
          finalCompletionData
        );
        setTaskCompletions(prev => [mockCompletion, ...prev]);
        // Update the relevant task's assignment with completion
        setTasks(prev => prev.map(task =>
          (task.id === finalCompletionData.task_id || task.assignment?.id === finalCompletionData.assignment_id) && task.assignment
            ? {
                ...task,
                assignment: {
                  ...task.assignment,
                  is_completed: true,
                  completion: mockCompletion
                }
              }
            : task
        ));
        // Mock points transaction
        const task = tasks.find(t => t.id === finalCompletionData.task_id || t.assignment?.id === finalCompletionData.assignment_id);
        const pointsAwarded = finalCompletionData.points_awarded || task?.points || 0;
        if (pointsAwarded > 0) {
          const mockTransaction = generateMockPointsTransaction(
            finalCompletionData.completed_by,
            pointsAwarded,
            'earned',
            'Task completion',
            mockCompletion.id
          );
          setPointsTransactions(prev => [mockTransaction, ...prev]);
        }
        return { data: mockCompletion, error: null };
      }

      const { data: completion, error: completionError } = await supabase
        .from('task_completions')
        .insert(finalCompletionData)
        .select(`
          *,
          tasks(*),
          completed_by_member:family_members!completed_by(*)
        `)
        .single()

      if (completionError) throw completionError

      // Handle points transaction
      const task = completion.tasks
      const member = completion.completed_by_member
      const pointsAwarded = finalCompletionData.points_awarded || task.points || 0

      if (pointsAwarded > 0) {
        // For child members, points are pending until verified
        const needsVerification = member.role === 'child'
        
        if (!needsVerification) {
          // Award points immediately for adults
          await awardPoints(member.id, pointsAwarded, 'earned', 'Task completion', completion.id)
        }
        // If verification is needed, points will be awarded when verified
      }

      // Reload data immediately to update UI
      await loadTaskCompletions()
      await loadTasks()

      return { data: completion, error: null }
    } catch (error) {
      console.error('Error completing task:', error)
      return { data: null, error }
    }
  }

  const verifyTaskCompletion = async (completionId, verified = true) => {
    try {
      if (!currentMember) {
        throw new Error('Current member not found')
      }

      const { data: completion, error: updateError } = await supabase
        .from('task_completions')
        .update({
          verified_by: currentMember.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', completionId)
        .select(`
          *,
          tasks(*),
          completed_by_member:family_members!completed_by(*)
        `)
        .single()

      if (updateError) throw updateError

      if (verified && completion.points_awarded > 0) {
        // Award points now that task is verified
        await awardPoints(
          completion.completed_by,
          completion.points_awarded,
          'earned',
          'Task completion (verified)',
          completionId
        )
      }

      // Reload data immediately to update UI
      await loadTaskCompletions()

      return { data: completion, error: null }
    } catch (error) {
      console.error('Error verifying task completion:', error)
      return { data: null, error }
    }
  }

  const awardPoints = async (memberId, points, type, description, taskCompletionId = null) => {
    try {
      // Ensure points is a valid number
      const validPoints = Number(points) || 0
      
      // Create points transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          family_member_id: memberId,
          points: validPoints,
          transaction_type: type,
          description,
          task_completion_id: taskCompletionId
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      // Update member's points balance by reading current balance first
      const { data: currentMember, error: memberError } = await supabase
        .from('family_members')
        .select('points_balance')
        .eq('id', memberId)
        .single()

      if (memberError) throw memberError

      const newBalance = (currentMember.points_balance || 0) + validPoints
      const { error: balanceError } = await supabase
        .from('family_members')
        .update({
          points_balance: newBalance
        })
        .eq('id', memberId)

      if (balanceError) throw balanceError

      return { data: transaction, error: null }
    } catch (error) {
      console.error('Error awarding points:', error)
      return { data: null, error }
    }
  }

  const spendPoints = async (memberId, points, description) => {
    try {
      // Check if member has enough points
      const member = familyMembers.find(m => m.id === memberId)
      if (!member || member.points_balance < points) {
        throw new Error('Insufficient points')
      }

      // Create negative points transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          family_member_id: memberId,
          points: -points,
          transaction_type: 'spent',
          description
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      // Update member's points balance by reading current balance first
      const { data: currentMember, error: memberError } = await supabase
        .from('family_members')
        .select('points_balance')
        .eq('id', memberId)
        .single()

      if (memberError) throw memberError

      const newBalance = (currentMember.points_balance || 0) - points
      const { error: balanceError } = await supabase
        .from('family_members')
        .update({
          points_balance: Math.max(0, newBalance) // Prevent negative balance
        })
        .eq('id', memberId)

      if (balanceError) throw balanceError

      return { data: transaction, error: null }
    } catch (error) {
      console.error('Error spending points:', error)
      return { data: null, error }
    }
  }

  // Helper functions
  const getTasksForMember = (memberId, date = null) => {
    const safeAssignments = Array.isArray(taskAssignments) ? taskAssignments : [];
    let assignments = safeAssignments.filter(a => a.assigned_to === memberId)
    
    if (date) {
      assignments = assignments.filter(a => a.due_date === date)
    }
    
    return assignments
  }

  const getCompletionsForMember = (memberId, date = null) => {
    const safeCompletions = Array.isArray(taskCompletions) ? taskCompletions : [];
    let completions = safeCompletions.filter(c => c.completed_by === memberId)
    
    if (date) {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
      completions = completions.filter(c => 
        c.completed_at.startsWith(dateStr)
      )
    }
    
    return completions
  }

  const getPendingVerifications = () => {
    if (!Array.isArray(taskCompletions)) return [];
    return taskCompletions.filter(c => 
      !c.verified_by && 
      c.completed_by_member?.role === 'child'
    )
  }

  const undoCompletion = async (assignmentId) => {
    try {
      // For tests/mock mode, update tasks in memory
      setTasks(prev => prev.map(task => {
        if (task.assignment?.id === assignmentId) {
          return {
            ...task,
            assignment: {
              ...task.assignment,
              is_completed: false,
              completion: undefined
            }
          }
        }
        return task
      }))
      
      return { data: {}, error: null }
    } catch (error) {
      console.error('Error undoing completion:', error)
      return { data: null, error }
    }
  }

  const approveCompletion = async (completionId) => {
    try {
      // For tests/mock mode, update tasks in memory
      setTasks(prev => prev.map(task => {
        if (task.assignment?.completion?.id === completionId) {
          return {
            ...task,
            assignment: {
              ...task.assignment,
              completion: {
                ...task.assignment.completion,
                verification_status: 'approved'
              }
            }
          }
        }
        return task
      }))
      
      return { data: {}, error: null }
    } catch (error) {
      console.error('Error approving completion:', error)
      return { data: null, error }
    }
  }

  const rejectCompletion = async (completionId, reason) => {
    try {
      // For tests/mock mode, update tasks in memory
      setTasks(prev => prev.map(task => {
        if (task.assignment?.completion?.id === completionId) {
          return {
            ...task,
            assignment: {
              ...task.assignment,
              is_completed: false,
              completion: {
                ...task.assignment.completion,
                verification_status: 'rejected'
              }
            }
          }
        }
        return task
      }))
      
      return { data: {}, error: null }
    } catch (error) {
      console.error('Error rejecting completion:', error)
      return { data: null, error }
    }
  }

  const getTasksForDate = (date) => {
    const dayOfWeek = new Date(date).getDay()
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    return safeTasks.filter(task => {
      if (!task.recurring_days || task.recurring_days.length === 0) {
        return true // No specific days means it's available every day
      }
      return task.recurring_days.includes(dayOfWeek)
    })
  }

  const getPointsTransactionsForMember = (memberId) => {
    return Array.isArray(pointsTransactions) ? pointsTransactions.filter(t => t.family_member_id === memberId) : []
  }

  const value = {
    tasks,
    taskAssignments,
    taskCompletions,
    pointsTransactions,
    loading,
    // Main functions
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    assignTask,
    completeTask,
    quickCompleteTask: completeTask, // Alias for tests
    undoCompletion,
    approveCompletion,
    rejectCompletion,
    verifyTaskCompletion,
    awardPoints,
    spendPoints,
    // Helper functions
    getTasksForMember,
    getTasksForDate,
    getCompletionsForMember,
    getPendingVerifications,
    getPointsTransactionsForMember,
    // Data refresh
    loadTaskData,
    // Test helpers (for testing only)
    setTasks,
    setTaskAssignments,
    setTaskCompletions,
    setPointsTransactions
  }

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  )
}