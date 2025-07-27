import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useFamily } from '../hooks/useFamily.jsx'
import { FaUser, FaKey, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa'
import Modal from './Modal'

const CreateLocalUserModal = ({ onClose, onSuccess }) => {
  const { createLocalUser } = useAuth()
  const { currentMember, familyMembers, loadFamilyData } = useFamily()
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    role: 'member'
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!formData.username.trim()) {
      setError('Brukernavn er påkrevd')
      return
    }
    
    if (formData.username.includes('@')) {
      setError('Brukernavn kan ikke inneholde @')
      return
    }
    
    if (!formData.password) {
      setError('Passord er påkrevd')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passordene stemmer ikke overens')
      return
    }
    
    if (formData.password.length < 6) {
      setError('Passord må være minst 6 tegn')
      return
    }
    
    if (!formData.nickname.trim()) {
      setError('Visningsnavn er påkrevd')
      return
    }

    // Check if username already exists
    const existingUser = familyMembers.find(member => 
      member.username === formData.username.toLowerCase()
    )
    if (existingUser) {
      setError('Dette brukernavnet er allerede i bruk')
      return
    }

    setLoading(true)
    
    try {
      const { data, error } = await createLocalUser(
        currentMember.family_id,
        formData.username.toLowerCase(),
        formData.password,
        formData.nickname.trim(),
        formData.role,
        currentMember.id
      )
      
      if (error) throw error
      
      // Reload family data to show new member
      await loadFamilyData()
      
      if (onSuccess) onSuccess(data)
      onClose()
    } catch (err) {
      setError(err.message || 'Feil ved opprettelse av bruker')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1rem',
        maxWidth: '500px',
        width: 'calc(100vw - 2rem)',
        position: 'relative',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaUser />
            Opprett ny profil
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

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="username" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#333'
            }}>
              Brukernavn *
            </label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="brukernavn (uten @ tegn)"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '0.25rem',
                fontSize: '1rem',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
              disabled={loading}
            />
            <small style={{ color: '#666', fontSize: '0.8rem' }}>
              Brukes for innlogging. Kun bokstaver, tall og _ tillatt.
            </small>
          </div>

          {/* Nickname */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="nickname" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#333'
            }}>
              Visningsnavn *
            </label>
            <input
              id="nickname"
              type="text"
              value={formData.nickname}
              onChange={(e) => handleInputChange('nickname', e.target.value)}
              placeholder="Navn som vises i appen"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '0.25rem',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              disabled={loading}
            />
          </div>

          {/* Role */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="role" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#333'
            }}>
              Rolle
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '0.25rem',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              disabled={loading}
            >
              <option value="member">Medlem</option>
              <option value="child">Barn</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#333'
            }}>
              Passord *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Minst 6 tegn"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: '3rem',
                  border: '2px solid #ddd',
                  borderRadius: '0.25rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
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
            <label htmlFor="confirmPassword" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: '#333'
            }}>
              Bekreft passord *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
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
                  fontSize: '1rem',
                  boxSizing: 'border-box'
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
                backgroundColor: '#28a745',
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
              <FaUser />
              {loading ? 'Oppretter...' : 'Opprett bruker'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default CreateLocalUserModal