import React, { useState } from 'react'
import { useTasks } from '../hooks/useTasks.jsx'
import { useFamily } from '../hooks/useFamily.jsx'
import { FaCheck, FaClock, FaCoins, FaComment, FaCamera, FaTimes } from 'react-icons/fa'
import Modal from './Modal'

const TaskCompletion = ({ task, assignment, open, onClose }) => {
  const { completeTask } = useTasks()
  const { currentMember } = useFamily()
  const [timeSpent, setTimeSpent] = useState('')
  const [comment, setComment] = useState('')
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    const maxFiles = 3
    const maxSize = 5 * 1024 * 1024 // 5MB

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`Bildet "${file.name}" er for stort. Maksimal størrelse er 5MB.`)
        return false
      }
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}" er ikke et gyldig bildeformat.`)
        return false
      }
      return true
    }).slice(0, maxFiles)

    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }))

    setImages(prev => [...prev, ...newImages].slice(0, maxFiles))
  }

  const removeImage = (imageId) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview)
      }
      return prev.filter(img => img.id !== imageId)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    setLoading(true)
    
    const completionData = {
      task_id: task.id,
      assignment_id: assignment?.id || null,
      completed_by: currentMember.id,
      time_spent_minutes: timeSpent && timeSpent.trim() ? parseInt(timeSpent.trim()) : null,
      comment: comment.trim() || null,
      points_awarded: Number(task.points) || 0
      // Note: Images are included in UI but not yet stored in database
      // TODO: Implement image storage with Supabase Storage
    }
    
    const { error } = await completeTask(completionData)
    
    if (error) {
      alert('Feil ved fullføring av oppgave: ' + error.message)
    } else {
      setSuccess('Oppgave fullført!')
      
      // Close modal after showing success briefly
      setTimeout(() => {
        // Clean up image previews
        images.forEach(image => URL.revokeObjectURL(image.preview))
        
        onClose()
        setTimeSpent('')
        setComment('')
        setImages([])
        setSuccess('')
      }, 1500)
    }
    
    setLoading(false)
  }

  const formatEstimatedTime = (minutes) => {
    if (!minutes) return null
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}t ${mins}min`
    }
    return `${mins}min`
  }

  const isChildUser = currentMember?.role === 'child'
  const pointsMessage = isChildUser 
    ? 'Poeng tildeles etter godkjenning'
    : 'Poeng tildeles umiddelbart'

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          marginBottom: '1.5rem' 
        }}>
          <FaCheck style={{ color: '#28a745' }} />
          <h2 style={{ margin: 0 }}>Fullfør oppgave</h2>
        </div>

        {/* Task info */}
        <div style={{
          backgroundColor: '#d4edda',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          border: '1px solid #c3e6cb'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>
            {task?.title}
          </h4>
          
          {task?.description && (
            <p style={{ 
              margin: '0 0 0.5rem 0', 
              color: '#155724',
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
            color: '#155724'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FaCoins />
              <span>{task?.points || 0} poeng</span>
            </div>
            
            {task?.estimated_minutes && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <FaClock />
                <span>~{formatEstimatedTime(task.estimated_minutes)}</span>
              </div>
            )}
          </div>

          {assignment?.due_date && (
            <div style={{ 
              marginTop: '0.5rem',
              fontSize: '0.8rem',
              color: '#155724'
            }}>
              <strong>Forfallsdato:</strong> {new Date(assignment.due_date).toLocaleDateString('no-NO')}
            </div>
          )}
        </div>

        {success && (
          <div style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #c3e6cb',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textAlign: 'center',
            justifyContent: 'center'
          }}>
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Time spent */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600, 
              marginBottom: '0.5rem'
            }}>
              <FaClock />
              Tid brukt (minutter):
            </label>
            <input
              type="number"
              value={timeSpent}
              onChange={(e) => setTimeSpent(e.target.value)}
              min="1"
              max="480"
              placeholder={task?.estimated_minutes ? `Estimert: ${task.estimated_minutes} min` : 'Hvor lang tid tok det?'}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
            <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>
              Valgfritt - hjelper med å forbedre estimater
            </small>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600, 
              marginBottom: '0.5rem'
            }}>
              <FaComment />
              Kommentar:
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Beskriv hvordan oppgaven gikk, eventuelle utfordringer, etc..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>
              Valgfritt - del dine tanker om oppgaven
            </small>
          </div>

          {/* Image upload */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600, 
              marginBottom: '0.5rem'
            }}>
              <FaCamera />
              Bilder:
            </label>
            
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              style={{ display: 'none' }}
              id="image-upload"
            />
            
            <label
              htmlFor="image-upload"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#f8f9fa',
                border: '2px dashed #dee2e6',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                color: '#6c757d',
                fontSize: '0.9rem',
                marginBottom: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#e9ecef'
                e.target.style.borderColor = '#adb5bd'
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#f8f9fa'
                e.target.style.borderColor = '#dee2e6'
              }}
            >
              <FaCamera />
              Velg bilder (maks 3)
            </label>
            
            {images.length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: window.innerWidth < 480 ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}>
                {images.map(image => (
                  <div
                    key={image.id}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      border: '1px solid #dee2e6'
                    }}
                  >
                    <img
                      src={image.preview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      style={{
                        position: 'absolute',
                        top: '0.25rem',
                        right: '0.25rem',
                        width: '1.5rem',
                        height: '1.5rem',
                        backgroundColor: 'rgba(220, 53, 69, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem'
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <small style={{ color: '#6c757d', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
              Valgfritt - last opp bilder som viser at oppgaven er fullført (maks 3 bilder, 5MB hver)
              <br />
              <em style={{ color: '#ffc107' }}>⚠️ Bildelagring kommer i neste versjon</em>
            </small>
          </div>

          {/* Points info */}
          <div style={{
            backgroundColor: isChildUser ? '#fff3cd' : '#d1ecf1',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <FaCoins />
              <strong>Poeng: {task?.points || 0}</strong>
            </div>
            <div style={{ color: isChildUser ? '#856404' : '#0c5460' }}>
              {pointsMessage}
              {isChildUser && (
                <div style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                  En voksen må godkjenne oppgaven før du får poengene.
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem',
            justifyContent: 'flex-end',
            flexWrap: 'wrap'
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
              {loading ? 'Fullfører...' : 'Fullfør oppgave'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default TaskCompletion