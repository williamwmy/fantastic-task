import React, { useState } from 'react'
import { useFamily } from '../hooks/useFamily.jsx'
import { FaCopy, FaSync, FaCheck } from 'react-icons/fa'

const FamilyInvitation = () => {
  const { 
    family,
    rotateFamilyCode,
    currentMember 
  } = useFamily()
  
  const [loading, setLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const handleRotateCode = async () => {
    setLoading(true)
    const { error } = await rotateFamilyCode()
    if (error) {
      alert('Feil ved oppdatering av familiekode: ' + error.message)
    }
    setLoading(false)
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(family.family_code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = family.family_code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  // Simplified - no more complex validation needed

  if (currentMember?.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Kun administratorer kan administrere familiekoden.</p>
      </div>
    )
  }

  if (!family) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Laster familiedata...</p>
      </div>
    )
  }

  const buttonStyle = {
    padding: '0.75rem 1rem',
    backgroundColor: '#0056b3',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }

  return (
    <div>
      <h3>Familiekode</h3>
      
      {/* Current family code */}
      <div style={{ 
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h4 style={{ margin: '0 0 1rem 0' }}>Din families kode</h4>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            fontFamily: 'monospace',
            color: '#28a745',
            letterSpacing: '0.2rem'
          }}>
            {family.family_code}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleCopyCode}
              style={{
                ...buttonStyle,
                backgroundColor: copiedCode ? '#28a745' : '#6c757d',
                padding: '0.75rem'
              }}
              title="Kopier kode"
            >
              {copiedCode ? <FaCheck /> : <FaCopy />}
              {copiedCode ? 'Kopiert!' : 'Kopier'}
            </button>
            
            <button
              onClick={handleRotateCode}
              disabled={loading}
              style={{
                ...buttonStyle,
                backgroundColor: '#dc3545',
                padding: '0.75rem'
              }}
              title="Generer ny kode"
            >
              <FaSync />
              {loading ? 'Oppdaterer...' : 'Ny kode'}
            </button>
          </div>
        </div>
        
        <div style={{ 
          fontSize: '0.9rem', 
          color: '#666',
          backgroundColor: '#e9ecef',
          padding: '0.5rem',
          borderRadius: '0.25rem'
        }}>
          <strong>Permanent kode</strong> - Ingen utløpsdato eller begrensninger på antall bruk
        </div>
      </div>
      
      <div style={{ 
        marginTop: '1.5rem', 
        padding: '1rem', 
        backgroundColor: '#d1ecf1', 
        borderRadius: '0.5rem',
        fontSize: '0.9rem'
      }}>
        <strong>Slik inviterer du andre:</strong>
        <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>Kopier familiekoden ovenfor</li>
          <li>Send koden til personen du vil invitere</li>
          <li>De kan bruke koden når de registrerer seg eller i "Bli med i familie"-skjemaet</li>
          <li>Hvis koden blir lekket, kan du generere en ny kode</li>
        </ol>
      </div>
    </div>
  )
}

export default FamilyInvitation