import React, { useState } from 'react'
import { useTasks } from '../hooks/useTasks.jsx'
import { useFamily } from '../hooks/useFamily.jsx'
import { FaPlus, FaCalendarAlt, FaUser, FaCoins } from 'react-icons/fa'
import Modal from './Modal'

const TaskAssignment = ({ task, open, onClose }) => {
  const { assignTask } = useTasks()
  const { familyMembers, hasPermission } = useFamily()
  const [selectedMember, setSelectedMember] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)

  const canAssign = hasPermission('assign_tasks')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedMember || !dueDate) {
      alert('Vennligst fyll ut alle feltene')
      return
    }

    setLoading(true)
    
    const { error } = await assignTask(task.id, selectedMember, dueDate)
    
    if (error) {
      alert('Feil ved tildeling av oppgave: ' + error.message)
    } else {
      onClose()
      setSelectedMember('')
      setDueDate('')
    }
    
    setLoading(false)
  }

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  if (!canAssign) {
    return (
      <Modal open={open} onClose={onClose}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>Ingen tilgang</h3>
          <p>Du har ikke tillatelse til å tildele oppgaver.</p>
          <button onClick={onClose} style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: 600
          }}>
            Lukk
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          marginBottom: '1.5rem' 
        }}>
          <FaPlus style={{ color: '#82bcf4' }} />
          <h2 style={{ margin: 0 }}>Tildel oppgave</h2>
        </div>

        {/* Task info */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>
            {task?.title}
          </h4>
          
          {task?.description && (
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
            gap: '1rem',
            fontSize: '0.9rem',
            color: '#6c757d'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FaCoins />
              <span>{task?.points || 0} poeng</span>
            </div>
            
            {task?.estimated_minutes && (
              <div>
                <span>~{task.estimated_minutes} min</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Member selection */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600, 
              marginBottom: '0.5rem'
            }}>
              <FaUser />
              Tildel til:
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                backgroundColor: 'white'
              }}
            >
              <option value="">Velg familiemedlem</option>
              {familyMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.nickname} ({member.role === 'admin' ? 'Administrator' : 
                                   member.role === 'child' ? 'Barn' : 'Medlem'})
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600, 
              marginBottom: '0.5rem'
            }}>
              <FaCalendarAlt />
              Forfallsdato:
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={getTodayDate()}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Recurring pattern info */}
          {task?.recurring_days && task.recurring_days.length > 0 && (
            <div style={{
              backgroundColor: '#d1ecf1',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}>
              <strong>Gjentakende oppgave:</strong>
              <div style={{ marginTop: '0.25rem' }}>
                Denne oppgaven gjentas på: {
                  task.recurring_days.map(day => {
                    const days = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag']
                    return days[day]
                  }).join(', ')
                }
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Avbryt
            </button>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#82bcf4',
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
              <FaPlus />
              {loading ? 'Tildeler...' : 'Tildel oppgave'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default TaskAssignment