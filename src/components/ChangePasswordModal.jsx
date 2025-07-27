import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useFamily } from '../hooks/useFamily.jsx'
import { FaKey, FaEye, FaEyeSlash, FaTimes, FaUserShield } from 'react-icons/fa'
import Modal from './Modal'

const ChangePasswordModal = ({ member, onClose, onSuccess }) => {
  const { changeLocalUserPassword } = useAuth()
  const { currentMember } = useFamily()
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!formData.newPassword) {
      setError('Nytt passord er påkrevd')
      return
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passordene stemmer ikke overens')
      return
    }
    
    if (formData.newPassword.length < 6) {
      setError('Passord må være minst 6 tegn')
      return
    }

    setLoading(true)
    
    try {
      const { error } = await changeLocalUserPassword(
        member.id,
        formData.newPassword,
        currentMember.id
      )
      
      if (error) throw error
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setError(err.message || 'Feil ved endring av passord')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  if (!member.is_local_user) {
    return (
      <Modal open={true} onClose={onClose}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center'
        }}>
          <h3>Kan ikke endre passord</h3>
          <p style={{ color: '#666' }}>
            Dette er en e-post-basert konto. Brukeren må endre passordet sitt gjennom 
            påloggingssystemet eller e-post-tilbakestilling.
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Lukk
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        maxWidth: '450px',
        width: '100%',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaKey />
            Endre passord
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Member info */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '1rem',
          borderRadius: '0.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: member.avatar_color || '#82bcf4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 16
          }}>
            {member.nickname[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{member.nickname}</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Brukernavn: {member.username}
            </div>
          </div>
        </div>

        {/* Admin warning */}
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '0.25rem',
          padding: '0.75rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          color: '#856404'
        }}>
          <FaUserShield />
          Du endrer passord som administrator. Brukeren får ikke beskjed om endringen.
        </div>

        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#333'
            }}>
              Nytt passord *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Minst 6 tegn"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: '3rem',
                  border: '2px solid #ddd',
                  borderRadius: '0.25rem',
                  fontSize: '1rem'
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#333'
            }}>
              Bekreft nytt passord *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Skriv inn passord igjen"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: '3rem',
                  border: '2px solid #ddd',
                  borderRadius: '0.25rem',
                  fontSize: '1rem'
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              color: '#dc3545',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '0.25rem',
              padding: '0.75rem',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FaKey />
              {loading ? 'Endrer...' : 'Endre passord'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default ChangePasswordModal