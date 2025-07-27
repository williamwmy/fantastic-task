import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { FaTasks, FaUsers, FaStar, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'
import packageJson from '../../package.json'

const LoginPage = ({ initialMode = 'signin' }) => {
  const { signUp, signIn, resetPassword, createFamily, joinFamilyWithCode } = useAuth()
  const [mode, setMode] = useState(initialMode) // 'signin', 'signup', 'reset', 'create-family', 'join-family'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    familyCode: '',
    familyName: '',
    nickname: ''
  })

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError('')
    setMessage('')
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(formData.email, formData.password)
    
    if (error) {
      setError(error.message)
    }
    
    setLoading(false)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passordene stemmer ikke overens')
      setLoading(false)
      return
    }

    const { error } = await signUp(formData.email, formData.password, formData.familyCode || null)
    
    if (error) {
      setError(error.message)
    } else {
      setMessage('Registrering vellykket! Du kan nå logge inn.')
      setMode('signin')
    }
    
    setLoading(false)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await resetPassword(formData.email)
    
    if (error) {
      setError(error.message)
    } else {
      setMessage('Passord-reset link sendt til din e-post!')
    }
    
    setLoading(false)
  }

  const handleCreateFamily = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await createFamily(formData.familyName, formData.nickname)
    
    if (error) {
      setError(error.message)
    } else {
      setMessage('Familie opprettet! Du kan nå invitere andre medlemmer.')
    }
    
    setLoading(false)
  }

  const handleJoinFamily = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await joinFamilyWithCode(formData.familyCode)
    
    if (error) {
      setError(error.message)
    } else {
      setMessage('Du har blitt lagt til i familien!')
    }
    
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #d0e6fa 0%, #f8e8ee 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      {/* Header Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem',
        maxWidth: '600px'
      }}>
        {/* App Logo/Icon */}
        <div style={{
          width: '120px',
          height: '120px',
          backgroundColor: '#82bcf4',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem auto',
          boxShadow: '0 8px 32px rgba(130, 188, 244, 0.3)'
        }}>
          <FaTasks size={60} color="white" />
        </div>

        {/* App Name */}
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 700,
          color: '#2c3e50',
          margin: '0 0 0.5rem 0',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}>
          Fantastic Task
        </h1>

        {/* Version */}
        <div style={{
          fontSize: '1rem',
          color: '#6c757d',
          fontWeight: 500,
          marginBottom: '2rem'
        }}>
          Versjon {packageJson.version}
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: '1.25rem',
          color: '#495057',
          lineHeight: 1.6,
          margin: '0 0 2rem 0'
        }}>
          En familie-oppgaveapp som gjør hverdagen enklere med poeng og belønninger
        </p>

        {/* Feature highlights */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          flexWrap: 'wrap',
          marginBottom: '3rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#495057',
            fontSize: '1rem'
          }}>
            <FaUsers style={{ color: '#82bcf4' }} />
            <span>Hele familien</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#495057',
            fontSize: '1rem'
          }}>
            <FaStar style={{ color: '#ffc107' }} />
            <span>Poeng & belønninger</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#495057',
            fontSize: '1rem'
          }}>
            <FaTasks style={{ color: '#28a745' }} />
            <span>Fleksible oppgaver</span>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div style={{
        width: '100%',
        maxWidth: '450px',
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        {/* Error/Message display */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            border: '1px solid #f5c6cb',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            border: '1px solid #c3e6cb',
            fontSize: '0.9rem'
          }}>
            {message}
          </div>
        )}

        {/* Mode tabs */}
        <div style={{
          display: 'flex',
          marginBottom: '2rem',
          borderBottom: '2px solid #f8f9fa',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'signin', label: 'Logg inn' },
            { key: 'signup', label: 'Registrer' },
            { key: 'reset', label: 'Glemt passord?' },
            { key: 'create-family', label: 'Opprett familie' },
            { key: 'join-family', label: 'Bli med i familie' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setMode(tab.key)
                setError('')
                setMessage('')
              }}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: `3px solid ${mode === tab.key ? '#82bcf4' : 'transparent'}`,
                color: mode === tab.key ? '#82bcf4' : '#6c757d',
                fontWeight: mode === tab.key ? 600 : 400,
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={
          mode === 'signin' ? handleSignIn : 
          mode === 'signup' ? handleSignUp : 
          mode === 'reset' ? handleResetPassword :
          mode === 'create-family' ? handleCreateFamily :
          handleJoinFamily
        }>
          {/* Email field (not shown for family modes) */}
          {!['create-family', 'join-family'].includes(mode) && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: '#333'
              }}>
                E-post
              </label>
              <div style={{ position: 'relative' }}>
                <FaEnvelope style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
                  fontSize: '0.9rem'
                }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="din@email.com"
                />
              </div>
            </div>
          )}

          {/* Family Name field (only for create-family) */}
          {mode === 'create-family' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: '#333'
              }}>
                Familienavn
              </label>
              <input
                type="text"
                name="familyName"
                value={formData.familyName}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="F.eks. Familie Hansen"
              />
            </div>
          )}

          {/* Nickname field (only for create-family) */}
          {mode === 'create-family' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: '#333'
              }}>
                Ditt kallenavn
              </label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="F.eks. Mamma, Pappa, Ole"
              />
            </div>
          )}

          {/* Family Code field (only for join-family) */}
          {mode === 'join-family' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: '#333'
              }}>
                Familiekode
              </label>
              <input
                type="text"
                name="familyCode"
                value={formData.familyCode}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Skriv inn familiekoden"
              />
            </div>
          )}

          {/* Password field (not shown for reset and family modes) */}
          {!['reset', 'create-family', 'join-family'].includes(mode) && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: '#333'
              }}>
                Passord
              </label>
              <div style={{ position: 'relative' }}>
                <FaLock style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
                  fontSize: '0.9rem'
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ditt passord"
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
                    color: '#6c757d',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm password (only for signup) */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: '#333'
              }}>
                Bekreft passord
              </label>
              <div style={{ position: 'relative' }}>
                <FaLock style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
                  fontSize: '0.9rem'
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Bekreft passord"
                />
              </div>
            </div>
          )}

          {/* Family Code field (optional for signup) */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: '#333'
              }}>
                Familiekode (valgfritt)
              </label>
              <input
                type="text"
                name="familyCode"
                value={formData.familyCode}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Skriv inn familiekode (valgfritt)"
              />
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: loading ? '#6c757d' : '#0056b3',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease'
            }}
          >
            {loading ? 'Behandler...' : 
             mode === 'signin' ? 'Logg inn' :
             mode === 'signup' ? 'Registrer deg' : 
             mode === 'reset' ? 'Send reset-link' :
             mode === 'create-family' ? 'Opprett familie' : 'Bli med i familie'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: '1rem',
        textAlign: 'center',
        color: '#6c757d',
        fontSize: '0.9rem'
      }}>
        © {new Date().getFullYear()} Fantastic Task - En PWA for familiehverdagen
      </div>
    </div>
  )
}

export default LoginPage