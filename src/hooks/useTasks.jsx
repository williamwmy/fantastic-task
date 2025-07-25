import { useState, useEffect, createContext, useContext } from 'react'
import { useAuth } from './useAuth.jsx'
import { useFamily } from './useFamily.jsx'
import { supabase } from '../lib/supabase'

const TasksContext = createContext({})

export const useTasks = () => {
  const context = useContext(TasksContext)
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider')
  }
  return context
}

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
      loadTaskData()
      setupSubscriptions()
    } else {
      setTasks([])
      setTaskAssignments([])
      setTaskCompletions([])
      setPointsTransactions([])
      cleanupSubscriptions()
    }

    return () => cleanupSubscriptions()
  }, [family, currentMember])

  const loadTaskData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadTasks(),
        loadTaskAssignments(),
        loadTaskCompletions(),
        loadPointsTransactions()
      ])
    } catch (error) {
      console.error('Error loading task data:', error)
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
  const getTasks = () => tasks

  const createTask = async (taskData) => {
    try {
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

  const completeTask = async (completionData) => {
    try {
      const { data: completion, error: completionError } = await supabase
        .from('task_completions')
        .insert(completionData)
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
      const pointsAwarded = completionData.points_awarded || task.points || 0

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
      // Create points transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          family_member_id: memberId,
          points,
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

      const newBalance = (currentMember.points_balance || 0) + points
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
    let assignments = taskAssignments.filter(a => a.assigned_to === memberId)
    
    if (date) {
      assignments = assignments.filter(a => a.due_date === date)
    }
    
    return assignments
  }

  const getCompletionsForMember = (memberId, date = null) => {
    let completions = taskCompletions.filter(c => c.completed_by === memberId)
    
    if (date) {
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
      completions = completions.filter(c => 
        c.completed_at.startsWith(dateStr)
      )
    }
    
    return completions
  }

  const getPendingVerifications = () => {
    return taskCompletions.filter(c => 
      !c.verified_by && 
      c.completed_by_member?.role === 'child'
    )
  }

  const getPointsTransactionsForMember = (memberId) => {
    return pointsTransactions.filter(t => t.family_member_id === memberId)
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
    verifyTaskCompletion,
    awardPoints,
    spendPoints,
    // Helper functions
    getTasksForMember,
    getCompletionsForMember,
    getPendingVerifications,
    getPointsTransactionsForMember,
    // Data refresh
    loadTaskData
  }

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  )
}