import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import Modal from './Modal'

const AuthModal = ({ open, onClose, showFamilySetup = false }) => {
  const { user, signUp, signIn, resetPassword, createFamily, joinFamilyWithCode } = useAuth()
  const [mode, setMode] = useState(showFamilySetup ? 'create-family' : 'signin') // 'signin', 'signup', 'reset', 'create-family', 'join-family'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
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
    } else {
      onClose()
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

    const { error } = await signUp(
      formData.email, 
      formData.password, 
      formData.familyCode || null
    )
    
    if (error) {
      setError(error.message)
    } else {
      setMessage('Registrering vellykket! Sjekk e-posten din for bekreftelse.')
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
      setMessage('Tilbakestillingslink er sendt til e-posten din!')
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
      setTimeout(() => onClose(), 2000)
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
      setTimeout(() => onClose(), 2000)
    }
    
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #ddd',
    borderRadius: '0.5rem',
    fontSize: '1rem'
  }

  const buttonStyle = {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#82bcf4',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '0.5rem'
  }

  const linkStyle = {
    color: '#82bcf4',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '0.9rem'
  }

  const renderSignInForm = () => (
    <form onSubmit={handleSignIn}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Logg inn</h2>
      
      <input
        type="email"
        name="email"
        placeholder="E-post"
        value={formData.email}
        onChange={handleInputChange}
        required
        style={inputStyle}
      />
      
      <input
        type="password"
        name="password"
        placeholder="Passord"
        value={formData.password}
        onChange={handleInputChange}
        required
        style={inputStyle}
      />
      
      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? 'Logger inn...' : 'Logg inn'}
      </button>
      
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <span style={linkStyle} onClick={() => setMode('reset')}>
          Glemt passord?
        </span>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        Har du ikke konto? {' '}
        <span style={linkStyle} onClick={() => setMode('signup')}>
          Registrer deg
        </span>
      </div>
    </form>
  )

  const renderSignUpForm = () => (
    <form onSubmit={handleSignUp}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Registrer deg</h2>
      
      <input
        type="email"
        name="email"
        placeholder="E-post"
        value={formData.email}
        onChange={handleInputChange}
        required
        style={inputStyle}
      />
      
      <input
        type="password"
        name="password"
        placeholder="Passord"
        value={formData.password}
        onChange={handleInputChange}
        required
        style={inputStyle}
      />
      
      <input
        type="password"
        name="confirmPassword"
        placeholder="Bekreft passord"
        value={formData.confirmPassword}
        onChange={handleInputChange}
        required
        style={inputStyle}
      />
      
      <input
        type="text"
        name="familyCode"
        placeholder="Familiekode (valgfritt)"
        value={formData.familyCode}
        onChange={handleInputChange}
        style={inputStyle}
      />
      
      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? 'Registrerer...' : 'Registrer deg'}
      </button>
      
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        Har du allerede konto? {' '}
        <span style={linkStyle} onClick={() => setMode('signin')}>
          Logg inn
        </span>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        <span style={linkStyle} onClick={() => setMode('create-family')}>
          Opprett ny familie
        </span>
      </div>
    </form>
  )

  const renderResetForm = () => (
    <form onSubmit={handleResetPassword}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Tilbakestill passord</h2>
      
      <input
        type="email"
        name="email"
        placeholder="E-post"
        value={formData.email}
        onChange={handleInputChange}
        required
        style={inputStyle}
      />
      
      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? 'Sender...' : 'Send tilbakestillingslink'}
      </button>
      
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <span style={linkStyle} onClick={() => setMode('signin')}>
          Tilbake til innlogging
        </span>
      </div>
    </form>
  )

  const renderCreateFamilyForm = () => (
    <form onSubmit={handleCreateFamily}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Opprett familie</h2>
      
      <input
        type="text"
        name="familyName"
        placeholder="Familienavn"
        value={formData.familyName}
        onChange={handleInputChange}
        required
        style={inputStyle}
      />
      
      <input
        type="text"
        name="nickname"
        placeholder="Ditt kallenavn"
        value={formData.nickname}
        onChange={handleInputChange}
        required
        style={inputStyle}
      />
      
      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? 'Oppretter...' : 'Opprett familie'}
      </button>
      
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <span style={linkStyle} onClick={() => setMode('signup')}>
          Tilbake til registrering
        </span>
      </div>
    </form>
  )

  const renderJoinFamilyForm = () => (
    <form onSubmit={handleJoinFamily}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Bli med i familie</h2>
      
      <input
        type="text"
        name="familyCode"
        placeholder="Familiekode"
        value={formData.familyCode}
        onChange={handleInputChange}
        required
        style={inputStyle}
      />
      
      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? 'Blir med...' : 'Bli med i familie'}
      </button>
      
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <span style={linkStyle} onClick={() => setMode('signin')}>
          Tilbake til innlogging
        </span>
      </div>
    </form>
  )

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
        {message && (
          <div style={{
            backgroundColor: '#efe',
            color: '#363',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {!showFamilySetup && mode === 'signin' && renderSignInForm()}
        {!showFamilySetup && mode === 'signup' && renderSignUpForm()}
        {!showFamilySetup && mode === 'reset' && renderResetForm()}
        {mode === 'create-family' && renderCreateFamilyForm()}
        {mode === 'join-family' && renderJoinFamilyForm()}
        
        {!showFamilySetup && mode === 'signin' && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <span style={linkStyle} onClick={() => setMode('join-family')}>
              Har du en familiekode?
            </span>
          </div>
        )}
        
        {showFamilySetup && mode === 'create-family' && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <span style={linkStyle} onClick={() => setMode('join-family')}>
              Eller bli med i en eksisterende familie
            </span>
          </div>
        )}
        
        {showFamilySetup && mode === 'join-family' && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <span style={linkStyle} onClick={() => setMode('create-family')}>
              Eller opprett en ny familie
            </span>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default AuthModal