import React, { useState } from 'react'
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
  FaHourglassHalf
} from 'react-icons/fa'
import TaskCompletion from './TaskCompletion'
import TaskAssignment from './TaskAssignment'
import { PermissionGate, RoleButton } from './RoleBasedAccess'

export const filterTasksForDay = (tasks, date) => {
  const dayOfWeek = new Date(date).getDay()
  
  return tasks.filter(task => {
    if (!task.recurring_days || task.recurring_days.length === 0) {
      return true // No specific days means it's available every day
    }
    return task.recurring_days.includes(dayOfWeek)
  })
}

const TaskList = ({ selectedDate }) => {
  const { 
    tasks, 
    getTasksForMember, 
    getCompletionsForMember
  } = useTasks()
  
  const { currentMember, familyMembers } = useFamily()
  
  const [completingTask, setCompletingTask] = useState(null)
  const [assigningTask, setAssigningTask] = useState(null)

  // Get tasks available for today
  const todayTasks = filterTasksForDay(tasks, selectedDate)
  
  // Get assignments for current member for selected date
  const myAssignments = getTasksForMember(currentMember?.id, selectedDate)
  
  // Get completions for current member for selected date
  const myCompletions = getCompletionsForMember(currentMember?.id, selectedDate)

  const isTaskCompleted = (taskId) => {
    return myCompletions.some(completion => completion.task_id === taskId)
  }

  const getTaskAssignment = (taskId) => {
    return myAssignments.find(assignment => assignment.task_id === taskId)
  }

  const getTaskCompletion = (taskId) => {
    return myCompletions.find(completion => completion.task_id === taskId)
  }

  const isTaskOverdue = (assignment) => {
    if (!assignment?.due_date) return false
    return new Date(assignment.due_date) < new Date(selectedDate)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('no-NO')
  }

  const getTaskStatus = (task) => {
    const assignment = getTaskAssignment(task.id)
    const completion = getTaskCompletion(task.id)
    
    if (completion) {
      if (completion.verified_by || currentMember?.role !== 'child') {
        return { status: 'completed', color: '#28a745', icon: FaCheckCircle }
      } else {
        return { status: 'pending_verification', color: '#ffc107', icon: FaHourglassHalf }
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
        return 'Fullført'
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

  const handleCompleteTask = (task, assignment) => {
    setCompletingTask({ task, assignment })
  }

  const handleAssignTask = (task) => {
    setAssigningTask(task)
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
        <h3 style={{ margin: 0 }}>
          Oppgaver for {formatDate(selectedDate)}
        </h3>
        <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
          {todayTasks.length} oppgaver tilgjengelig
        </div>
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
            Ingen oppgaver i dag
          </h4>
          <p style={{ color: '#6c757d', margin: 0 }}>
            Det er ingen oppgaver planlagt for denne dagen.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {todayTasks.map(task => {
            const assignment = getTaskAssignment(task.id)
            const completion = getTaskCompletion(task.id)
            const { status, color, icon: StatusIcon } = getTaskStatus(task)
            
            return (
              <div
                key={task.id}
                style={{
                  backgroundColor: 'white',
                  border: `2px solid ${color}20`,
                  borderLeft: `4px solid ${color}`,
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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
                      <div>
                        <strong>Tildelt av:</strong> {
                          familyMembers.find(m => m.id === assignment.assigned_by)?.nickname || 'Ukjent'
                        }
                      </div>
                      {assignment.due_date && (
                        <div style={{ color: isTaskOverdue(assignment) ? '#dc3545' : '#6c757d' }}>
                          <strong>Forfaller:</strong> {formatDate(assignment.due_date)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Completion info */}
                {completion && (
                  <div style={{
                    backgroundColor: completion.verified_by ? '#d4edda' : '#fff3cd',
                    padding: '0.75rem',
                    borderRadius: '0.25rem',
                    marginBottom: '0.75rem',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Fullført:</strong> {formatDate(completion.completed_at)}
                      {completion.time_spent_minutes && (
                        <span> • Tid brukt: {completion.time_spent_minutes} min</span>
                      )}
                    </div>
                    
                    {completion.comment && (
                      <div style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>
                        "{completion.comment}"
                      </div>
                    )}
                    
                    {!completion.verified_by && currentMember.role === 'child' && (
                      <div style={{ color: '#856404', fontWeight: 600 }}>
                        ⏳ Venter på godkjenning fra en voksen
                      </div>
                    )}
                    
                    {completion.verified_by && (
                      <div style={{ color: '#155724', fontWeight: 600 }}>
                        ✅ Godkjent • {completion.points_awarded} poeng mottatt
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem',
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap'
                }}>
                  {!completion && (
                    <button
                      onClick={() => handleCompleteTask(task, assignment)}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <FaCheck />
                      Fullfør
                    </button>
                  )}
                  
                  <PermissionGate permission="assign_tasks">
                    <RoleButton
                      permission="assign_tasks"
                      onClick={() => handleAssignTask(task)}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <FaUser />
                      Tildel
                    </RoleButton>
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
    </div>
  )
}

export default TaskList