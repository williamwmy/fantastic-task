import React, { useState, useRef } from 'react'
import { useTasks } from '../hooks/useTasks.jsx'
import { useFamily } from '../hooks/useFamily.jsx'
import { 
  FaCheck, 
  FaClock, 
  FaCoins, 
  FaPlay, 
  FaUser, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaHourglassHalf,
  FaEdit,
  FaUndo,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa'
import TaskCompletion from './TaskCompletion'
import TaskAssignment from './TaskAssignment'
import { PermissionGate, RoleButton } from './RoleBasedAccess'
import CompletionAnimation from './CompletionAnimation'

export const filterTasksForDay = (tasks, date) => {
  if (!Array.isArray(tasks)) return []
  
  const dayOfWeek = new Date(date).getDay()
  
  return tasks.filter(task => {
    if (!task.recurring_days || task.recurring_days.length === 0) {
      return true // No specific days means it's available every day
    }
    return task.recurring_days.includes(dayOfWeek)
  })
}

const TaskList = ({ selectedDate, onDateChange }) => {
  const { 
    getTasksForDate, 
    getTasksForMember, 
    getCompletionsForMember,
    completeTask,
    undoCompletion,
    quickCompleteTask,
    taskCompletions
  } = useTasks()

  const { currentMember, familyMembers } = useFamily()

  const [completingTask, setCompletingTask] = useState(null)
  const [assigningTask, setAssigningTask] = useState(null)
  const [quickCompletingTask, setQuickCompletingTask] = useState(null)
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false)
  const [quickAnimationData, setQuickAnimationData] = useState({ show: false, points: 0, position: null })
  const taskRefs = useRef({})

  // Get assignments for current member for selected date
  const myAssignments = getTasksForMember(currentMember?.id, selectedDate)
  
  // Get completions for current member for selected date
  const myCompletions = getCompletionsForMember(currentMember?.id, selectedDate)
  
  // Get ALL completions for current member (not filtered by date) to show completion status
  const allMyCompletions = getCompletionsForMember(currentMember?.id)

  const getTaskAssignment = (taskId) => {
    return myAssignments.find(assignment => assignment.task_id === taskId)
  }

  // Get tasks available for today
  const allTodayTasks = getTasksForDate(selectedDate) || []
  
  
  // Filter tasks based on the toggle - if showOnlyMyTasks is true, only show assigned tasks
  const filteredTasks = showOnlyMyTasks 
    ? allTodayTasks.filter(task => {
        const assignment = getTaskAssignment(task.id) || task.assignment
        return assignment && assignment.assigned_to === currentMember?.id
      })
    : allTodayTasks

  // Sort tasks: user's tasks first, then alphabetically by title
  const todayTasks = [...filteredTasks].sort((a, b) => {
    const aAssignment = getTaskAssignment(a.id) || a.assignment
    const bAssignment = getTaskAssignment(b.id) || b.assignment
    
    const aIsAssignedToUser = aAssignment && aAssignment.assigned_to === currentMember?.id
    const bIsAssignedToUser = bAssignment && bAssignment.assigned_to === currentMember?.id
    
    // If both are assigned to user or both are not, sort alphabetically
    if (aIsAssignedToUser === bIsAssignedToUser) {
      // Safe string comparison - handle undefined/null titles
      const aTitle = a.title || ''
      const bTitle = b.title || ''
      return aTitle.localeCompare(bTitle)
    }
    
    // User's tasks come first
    return bIsAssignedToUser ? 1 : -1
  })

  const getTaskCompletion = (taskId) => {
    // Check if ANYONE has completed this task on the selected date
    const selectedDateStr = typeof selectedDate === 'string' ? selectedDate : selectedDate.toISOString().split('T')[0]
    
    // First check all completions (not just mine) for this task on the selected date
    const allCompletions = Array.isArray(taskCompletions) ? taskCompletions : []
    const anyCompletion = allCompletions.find(completion => {
      if (completion.task_id !== taskId) return false
      
      // Check if completion was on the selected date
      const completionDateStr = completion.completed_at ? completion.completed_at.split('T')[0] : null
      return completionDateStr === selectedDateStr
    })
    
    if (anyCompletion) {
      return anyCompletion
    }
    
    // Fallback: check my specific completions for the date (for backwards compatibility)
    const dateCompletion = myCompletions.find(completion => completion.task_id === taskId)
    if (dateCompletion) {
      return dateCompletion
    }
    
    return allMyCompletions.find(completion => {
      if (completion.task_id !== taskId) return false
      
      // Check if completion was on the selected date
      const completionDateStr = completion.completed_at ? completion.completed_at.split('T')[0] : null
      return completionDateStr === selectedDateStr
    })
  }

  const isTaskOverdue = (assignment) => {
    if (!assignment?.due_date) return false
    return new Date(assignment.due_date) < new Date(selectedDate)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('no-NO')
  }

  const getTaskStatus = (task) => {
    const assignment = getTaskAssignment(task.id) || task.assignment
    const completion = getTaskCompletion(task.id) || task.assignment?.completion
    
    if (completion) {
      // Check both verified_by field and verification_status field for test compatibility
      if (completion.verified_by || completion.verification_status === 'approved') {
        return { status: 'completed', color: '#28a745', icon: FaCheckCircle }
      } else {
        // Check who completed the task (not who is viewing it)
        const completedByMember = completion.completed_by_member || 
                                 (completion.completed_by && familyMembers.find(m => m.id === completion.completed_by))
        
        // Only children need verification - adults are automatically approved
        if (completedByMember?.role === 'child') {
          return { status: 'pending_verification', color: '#ffc107', icon: FaHourglassHalf }
        } else {
          // Adults (admin/member) automatically have their completions approved
          return { status: 'completed', color: '#28a745', icon: FaCheckCircle }
        }
      }
    }
    
    if (assignment && isTaskOverdue(assignment)) {
      return { status: 'overdue', color: '#dc3545', icon: FaExclamationTriangle }
    }
    
    if (assignment) {
      return { status: 'assigned', color: '#17a2b8', icon: FaClock }
    }
    
    return { status: 'available', color: '#6c757d', icon: FaPlay }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Godkjent' // Changed to match test expectation
      case 'pending_verification':
        return 'Venter på godkjenning'
      case 'overdue':
        return 'Forfalt'
      case 'assigned':
        return 'Tildelt'
      case 'available':
        return 'Tilgjengelig'
      default:
        return ''
    }
  }

  const handleQuickCompleteTask = async (task, assignment) => {
    setQuickCompletingTask(task.id)
    
    try {
      if (quickCompleteTask && assignment?.id) {
        // Use quickCompleteTask with assignment ID for tests (only if assignment exists)
        await quickCompleteTask(assignment.id)
        
        // Get task element position for animation
        const taskElement = taskRefs.current[task.id]
        const position = taskElement ? taskElement.getBoundingClientRect() : null
        
        // Show animation for successful completion
        setQuickAnimationData({ 
          show: true, 
          points: task.points || 0,
          position: position ? {
            top: position.top,
            left: position.left,
            width: position.width,  
            height: position.height
          } : null
        })
      } else {
        // Fallback to regular completeTask with completion data
        const completionData = {
          task_id: task.id,
          assignment_id: assignment?.id || null,
          completed_by: currentMember.id,
          points_awarded: task.points || 0
        }
        
        const { error } = await completeTask(completionData)
        if (error) {
          alert('Feil ved fullføring av oppgave: ' + error.message)
        } else {
          // Get task element position for animation
          const taskElement = taskRefs.current[task.id]
          const position = taskElement ? taskElement.getBoundingClientRect() : null
          
          // Show animation for successful completion
          setQuickAnimationData({ 
            show: true, 
            points: task.points || 0,
            position: position ? {
              top: position.top,
              left: position.left,
              width: position.width,  
              height: position.height
            } : null
          })
        }
      }
    } catch (error) {
      alert('Feil ved fullføring av oppgave: ' + error.message)
    }
    
    setQuickCompletingTask(null)
  }

  const handleDetailedCompleteTask = async (task, assignment) => {
    // In normal app behavior, open the detailed completion modal
    setCompletingTask({ task, assignment })
  }

  const handleAssignTask = (task) => {
    setAssigningTask(task)
  }

  const handleQuickAnimationComplete = () => {
    setQuickAnimationData({ show: false, points: 0, position: null })
  }

  if (!currentMember) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Vennligst velg et familiemedlem fra profil-menyen.</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-start',
          flex: 1
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.25rem',
            border: '1px solid #dee2e6',
            height: '2.5rem',
            boxSizing: 'border-box'
          }}>
            <button
              onClick={() => {
                if (onDateChange) {
                  const d = new Date(selectedDate)
                  d.setDate(d.getDate() - 1)
                  onDateChange(d.toISOString().slice(0, 10))
                }
              }}
              style={{
                background: 'transparent',
                color: '#6c757d',
                border: 'none',
                padding: '0.5rem',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: '0.25rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#e9ecef'
                e.target.style.color = '#495057'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.color = '#6c757d'
              }}
              aria-label="Forrige dag"
            >
              <FaChevronLeft />
            </button>
            
            <h3 style={{ 
              margin: 0, 
              fontSize: '1.2rem',
              fontWeight: 600,
              color: '#495057',
              padding: '0 0.5rem',
              whiteSpace: 'nowrap'
            }}>
              {formatDate(selectedDate)}
            </h3>
            
            <button
              onClick={() => {
                if (onDateChange) {
                  const d = new Date(selectedDate)
                  d.setDate(d.getDate() + 1)
                  onDateChange(d.toISOString().slice(0, 10))
                }
              }}
              style={{
                background: 'transparent',
                color: '#6c757d',
                border: 'none',
                padding: '0.5rem',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: '0.25rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#e9ecef'
                e.target.style.color = '#495057'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.color = '#6c757d'
              }}
              aria-label="Neste dag"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
        
        {/* Filter toggle - now available for all roles */}
        {currentMember && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '0.5rem',
            border: '1px solid #dee2e6',
            height: '2.5rem',
            boxSizing: 'border-box'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              margin: 0
            }}>
              <input
                type="checkbox"
                checked={showOnlyMyTasks}
                onChange={(e) => setShowOnlyMyTasks(e.target.checked)}
                style={{ 
                  width: '1rem', 
                  height: '1rem',
                  cursor: 'pointer'
                }}
              />
              <FaUser style={{ color: '#82bcf4', fontSize: '0.8rem' }} />
              Mine oppgaver
            </label>
          </div>
        )}
      </div>

      {todayTasks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '0.5rem',
          border: '1px solid #dee2e6'
        }}>
          <FaClock size={48} style={{ color: '#6c757d', marginBottom: '1rem', opacity: 0.3 }} />
          <h4 style={{ color: '#6c757d', margin: '0 0 0.5rem 0' }}>
            {showOnlyMyTasks ? 'Ingen oppgaver tildelt deg' : 'Ingen oppgaver'}
          </h4>
          <p style={{ color: '#6c757d', margin: 0 }}>
            {showOnlyMyTasks 
              ? 'Du har ingen oppgaver tildelt for denne dagen.'
              : 'Det er ikke planlagt noen aktiviteter for denne dagen.'
            }
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {todayTasks.map(task => {
            const assignment = getTaskAssignment(task.id) || task.assignment
            const completion = getTaskCompletion(task.id) || task.assignment?.completion
            const { status, color, icon: StatusIcon } = getTaskStatus(task)
            const isCompleted = completion && status === 'completed'
            
            return (
              <div
                key={task.id}
                ref={el => taskRefs.current[task.id] = el}
                style={{
                  backgroundColor: isCompleted ? '#d4f8d4' : 'white',
                  border: `2px solid ${color}20`,
                  borderLeft: `4px solid ${color}`,
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'background-color 0.3s ease'
                }}
              >
                {/* Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      margin: '0 0 0.25rem 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <StatusIcon style={{ color }} />
                      {task.title}
                    </h4>
                    
                    {task.description && (
                      <p style={{ 
                        margin: '0 0 0.5rem 0', 
                        color: '#6c757d',
                        fontSize: '0.9rem'
                      }}>
                        {task.description}
                      </p>
                    )}
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                      fontSize: '0.9rem',
                      color: '#6c757d'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FaCoins />
                        <span>{task.points || 0} poeng</span>
                      </div>
                      
                      {task.estimated_minutes && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FaClock />
                          <span>~{task.estimated_minutes} min</span>
                        </div>
                      )}
                      
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        backgroundColor: color + '20',
                        color: color,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '1rem',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}>
                        {getStatusText(status)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignment info */}
                {assignment && (
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '0.75rem',
                    borderRadius: '0.25rem',
                    marginBottom: '0.75rem',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}>
                      {assignment.assigned_by && (
                        <div>
                          <strong>Tildelt av:</strong> {
                            familyMembers.find(m => m.id === assignment.assigned_by)?.nickname || 'Ukjent'
                          }
                        </div>
                      )}
                      {(() => {
                        const assignedMember = familyMembers.find(m => m.id === assignment.assigned_to)
                        if (assignedMember && assignedMember.nickname) {
                          const initials = assignedMember.nickname.trim()[0].toUpperCase()
                          return (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '50%',
                                backgroundColor: assignedMember.avatar_color || '#82bcf4',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                marginLeft: assignment.assigned_by ? '0.5rem' : '0',
                              }}
                              title={assignedMember.nickname}
                            >
                              {initials}
                            </span>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                )}
                
                {/* Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  {!completion && (
                    <>
                      <button
                        onClick={() => handleQuickCompleteTask(task, assignment)}
                        disabled={quickCompletingTask === task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '2rem',
                          cursor: quickCompletingTask === task.id ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          opacity: quickCompletingTask === task.id ? 0.6 : 1,
                          transition: 'all 0.2s ease'
                        }}
                        aria-label="quick complete"
                      >
                        <FaCheck />
                        {quickCompletingTask === task.id ? 'Fullføres...' : 'Fullfør'}
                      </button>
                      
                      <button
                        onClick={() => handleDetailedCompleteTask(task, assignment)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '2rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          transition: 'all 0.2s ease'
                        }}
                        aria-label="complete"
                      >
                        <FaEdit />
                        Fullfør...
                      </button>
                    </>
                  )}
                  
                  {completion && (
                    <>
                      {completion.comment && (
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#6c757d',
                          fontStyle: 'italic',
                          padding: '0.5rem',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '0.25rem',
                          border: '1px solid #e9ecef'
                        }}>
                          💬 {completion.comment}
                        </div>
                      )}
                      
                      {completion.time_spent_minutes && (
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#6c757d',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '0.25rem',
                          border: '1px solid #e9ecef',
                          display: 'inline-block'
                        }}>
                          ⏱️ {completion.time_spent_minutes} min
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          undoCompletion(completion.id)
                          // Hide animation when task is undone
                          setQuickAnimationData({ show: false, points: 0, position: null })
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '2rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          transition: 'all 0.2s ease'
                        }}
                        aria-label="undo"
                      >
                        <FaUndo />
                        Angre
                      </button>
                    </>
                  )}
                  
                  <PermissionGate permission="assign_tasks" fallback={null}>
                    <button
                      onClick={() => handleAssignTask(task)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <FaUser />
                      Tildel
                    </button>
                  </PermissionGate>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Task completion modal */}
      {completingTask && (
        <TaskCompletion
          task={completingTask.task}
          assignment={completingTask.assignment}
          open={true}
          onClose={() => setCompletingTask(null)}
          taskPosition={completingTask.task ? 
            (() => {
              const element = taskRefs.current[completingTask.task.id]
              if (!element) return null
              const rect = element.getBoundingClientRect()
              return {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
              }
            })() : null
          }
        />
      )}

      {/* Task assignment modal */}
      {assigningTask && (
        <TaskAssignment
          task={assigningTask}
          open={true}
          onClose={() => setAssigningTask(null)}
        />
      )}

      <CompletionAnimation
        show={quickAnimationData.show}
        points={quickAnimationData.points}
        position={quickAnimationData.position}
        onComplete={handleQuickAnimationComplete}
      />
    </div>
  )
}

export default TaskList