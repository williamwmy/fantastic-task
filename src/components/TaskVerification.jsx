import React, { useState } from 'react'
import { useTasks } from '../hooks/useTasks.jsx'
import { useFamily } from '../hooks/useFamily.jsx'
import { FaCheck, FaTimes, FaChild, FaClock, FaStar, FaCog } from 'react-icons/fa'
import Modal from './Modal'

const TaskVerification = ({ open, onClose }) => {
  const { getPendingVerifications, verifyTaskCompletion } = useTasks()
  const { hasPermission, family, updateFamilySetting } = useFamily()
  const [loading, setLoading] = useState(false)
  const [updatingSettings, setUpdatingSettings] = useState(false)

  const pendingVerifications = getPendingVerifications()

  const canVerify = hasPermission('manage_family') || hasPermission('view_all_stats')

  const handleVerify = async (completionId, approved = true) => {
    setLoading(true)
    
    const { error } = await verifyTaskCompletion(completionId, approved)
    
    if (error) {
      alert('Feil ved verifisering: ' + error.message)
    }
    
    setLoading(false)
  }

  const handleToggleVerificationSetting = async () => {
    if (!hasPermission('manage_family')) return
    
    setUpdatingSettings(true)
    const newSetting = !family?.require_child_verification
    
    const { error } = await updateFamilySetting('require_child_verification', newSetting)
    
    if (error) {
      alert('Feil ved endring av innstilling: ' + error.message)
    }
    
    setUpdatingSettings(false)
  }

  const formatTime = (minutes) => {
    if (!minutes) return 'Ikke oppgitt'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}t ${mins}min`
    }
    return `${mins}min`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!canVerify) {
    return (
      <Modal 
        open={open} 
        onClose={onClose}
        title="Ingen tilgang"
        icon={<FaTimes />}
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Du har ikke tillatelse til å verifisere oppgaver.</p>
        </div>
      </Modal>
    )
  }

  const titleWithBadge = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      Verifiser barns oppgaver
      <span style={{
        backgroundColor: pendingVerifications.length > 0 ? '#dc3545' : '#28a745',
        color: 'white',
        borderRadius: '50%',
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8rem',
        fontWeight: 700
      }}>
        {pendingVerifications.length}
      </span>
    </div>
  )

  return (
    <Modal 
      open={open} 
      onClose={onClose}
      title={titleWithBadge}
      subtitle="Godkjenn eller avvis oppgaver fullført av barn"
      icon={<FaChild />}
    >
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        {/* Settings Section for Admins */}
        {hasPermission('manage_family') && (
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <FaCog style={{ color: '#6c757d' }} />
              <h4 style={{ margin: 0, color: '#495057' }}>Innstillinger for verifikasjon</h4>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>
                  Krever verifikasjon for barns oppgaver
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
                  Når dette er aktivert, må alle oppgaver utført av barn godkjennes av en administrator før poeng tildeles.
                </p>
              </div>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: updatingSettings ? 'not-allowed' : 'pointer',
                opacity: updatingSettings ? 0.6 : 1
              }}>
                <input
                  type="checkbox"
                  checked={family?.require_child_verification !== false} // Default to true if not set
                  onChange={handleToggleVerificationSetting}
                  disabled={updatingSettings}
                  style={{
                    width: '1.2rem',
                    height: '1.2rem',
                    cursor: updatingSettings ? 'not-allowed' : 'pointer'
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {pendingVerifications.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: '#d4edda',
            borderRadius: '0.5rem',
            border: '1px solid #c3e6cb'
          }}>
            <FaCheck size={48} style={{ color: '#28a745', marginBottom: '1rem' }} />
            <h3 style={{ color: '#155724', margin: '0 0 0.5rem 0' }}>
              Alle oppgaver er verifisert!
            </h3>
            <p style={{ color: '#155724', margin: 0 }}>
              Det er ingen oppgaver som venter på godkjenning.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingVerifications.map(completion => (
              <div
                key={completion.id}
                style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '0.5rem',
                  padding: '1.5rem'
                }}
              >
                {/* Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      margin: '0 0 0.5rem 0', 
                      color: '#856404',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <FaStar />
                      {completion.tasks?.title || 'Ukjent oppgave'}
                    </h4>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem',
                      fontSize: '0.9rem',
                      color: '#856404'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: completion.completed_by_member?.avatar_color || '#82bcf4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.7rem',
                          fontWeight: 700
                        }}>
                          {completion.completed_by_member?.nickname?.[0]?.toUpperCase()}
                        </div>
                        <span>{completion.completed_by_member?.nickname}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FaClock />
                        <span>{formatDate(completion.completed_at)}</span>
                      </div>
                      
                      <div>
                        <strong>{completion.points_awarded || 0} poeng</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div style={{ marginBottom: '1rem' }}>
                  {completion.time_spent_minutes && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Tid brukt:</strong> {formatTime(completion.time_spent_minutes)}
                    </div>
                  )}
                  
                  {completion.comment && (
                    <div>
                      <strong>Kommentar:</strong>
                      <div style={{
                        backgroundColor: 'white',
                        padding: '0.75rem',
                        borderRadius: '0.25rem',
                        marginTop: '0.25rem',
                        border: '1px solid #ffeaa7',
                        fontStyle: 'italic'
                      }}>
                        "{completion.comment}"
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => handleVerify(completion.id, false)}
                    disabled={loading}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#dc3545',
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
                    <FaTimes />
                    Avvis
                  </button>
                  
                  <button
                    onClick={() => handleVerify(completion.id, true)}
                    disabled={loading}
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
                    Godkjenn
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </Modal>
  )
}

export default TaskVerification