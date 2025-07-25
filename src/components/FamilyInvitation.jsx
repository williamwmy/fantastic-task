import React, { useState } from 'react'
import { useFamily } from '../hooks/useFamily.jsx'
import { FaCopy, FaTrash, FaPlus, FaCheck } from 'react-icons/fa'

const FamilyInvitation = () => {
  const { 
    invitationCodes, 
    generateInvitationCode, 
    deactivateInvitationCode,
    currentMember 
  } = useFamily()
  
  const [loading, setLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const [maxUses, setMaxUses] = useState(1)
  const [expiresInDays, setExpiresInDays] = useState(7)

  const handleGenerateCode = async () => {
    setLoading(true)
    const { error } = await generateInvitationCode(maxUses, expiresInDays)
    if (error) {
      alert('Feil ved opprettelse av invitasjonskode: ' + error.message)
    }
    setLoading(false)
  }

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    }
  }

  const handleDeactivateCode = async (codeId) => {
    if (confirm('Er du sikker på at du vil deaktivere denne invitasjonskoden?')) {
      const { error } = await deactivateInvitationCode(codeId)
      if (error) {
        alert('Feil ved deaktivering av invitasjonskode: ' + error.message)
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('no-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (dateString) => {
    return new Date(dateString) < new Date()
  }

  const isCodeValid = (code) => {
    return code.is_active && 
           !isExpired(code.expires_at) && 
           code.used_count < code.max_uses
  }

  if (currentMember?.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Kun administratorer kan administrere invitasjonskoder.</p>
      </div>
    )
  }

  const inputStyle = {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '0.25rem',
    marginRight: '0.5rem',
    width: '80px'
  }

  const buttonStyle = {
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
  }

  const codeItemStyle = {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '0.5rem'
  }

  return (
    <div>
      <h3>Familieinnvitasjonskoder</h3>
      
      {/* Generate new code section */}
      <div style={{ 
        backgroundColor: '#eaf1fb', 
        padding: '1rem', 
        borderRadius: '0.5rem', 
        marginBottom: '1.5rem' 
      }}>
        <h4>Opprett ny invitasjonskode</h4>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <label>
            Maks bruk:
            <input
              type="number"
              min="1"
              max="10"
              value={maxUses}
              onChange={(e) => setMaxUses(parseInt(e.target.value))}
              style={inputStyle}
            />
          </label>
          
          <label>
            Utløper om (dager):
            <input
              type="number"
              min="1"
              max="30"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
              style={inputStyle}
            />
          </label>
        </div>
        
        <button
          onClick={handleGenerateCode}
          disabled={loading}
          style={buttonStyle}
        >
          <FaPlus />
          {loading ? 'Oppretter...' : 'Opprett invitasjonskode'}
        </button>
      </div>

      {/* Existing codes */}
      <div>
        <h4>Eksisterende koder ({invitationCodes.length})</h4>
        
        {invitationCodes.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            Ingen invitasjonskoder opprettet ennå.
          </p>
        ) : (
          invitationCodes.map(code => (
            <div key={code.id} style={codeItemStyle}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold', 
                    fontFamily: 'monospace',
                    color: isCodeValid(code) ? '#28a745' : '#6c757d'
                  }}>
                    {code.code}
                  </div>
                  
                  <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                    <span>Brukt: {code.used_count}/{code.max_uses}</span>
                    {' • '}
                    <span>Utløper: {formatDate(code.expires_at)}</span>
                    {' • '}
                    <span style={{ 
                      color: isCodeValid(code) ? '#28a745' : '#dc3545',
                      fontWeight: 600
                    }}>
                      {isCodeValid(code) ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleCopyCode(code.code)}
                    style={{
                      ...buttonStyle,
                      backgroundColor: copiedCode === code.code ? '#28a745' : '#6c757d',
                      padding: '0.5rem'
                    }}
                    title="Kopier kode"
                  >
                    {copiedCode === code.code ? <FaCheck /> : <FaCopy />}
                  </button>
                  
                  {isCodeValid(code) && (
                    <button
                      onClick={() => handleDeactivateCode(code.id)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: '#dc3545',
                        padding: '0.5rem'
                      }}
                      title="Deaktiver kode"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
              
              {!isCodeValid(code) && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.25rem 0.5rem', 
                  backgroundColor: '#f8d7da', 
                  color: '#721c24', 
                  borderRadius: '0.25rem',
                  fontSize: '0.8rem'
                }}>
                  {!code.is_active && 'Deaktivert'}
                  {code.is_active && isExpired(code.expires_at) && 'Utløpt'}
                  {code.is_active && !isExpired(code.expires_at) && code.used_count >= code.max_uses && 'Alle bruk oppbrukt'}
                </div>
              )}
            </div>
          ))
        )}
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
          <li>Opprett en invitasjonskode ovenfor</li>
          <li>Kopier koden ved å klikke på kopier-knappen</li>
          <li>Send koden til personen du vil invitere</li>
          <li>De kan bruke koden når de registrerer seg eller i "Bli med i familie"-skjemaet</li>
        </ol>
      </div>
    </div>
  )
}

export default FamilyInvitation