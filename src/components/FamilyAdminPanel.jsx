import React, { useState } from 'react'
import { useFamily } from '../hooks/useFamily.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import FamilyInvitation from './FamilyInvitation'
import FamilyMemberCard from './FamilyMemberCard'
import { 
  FaUsers, 
  FaCog, 
  FaEdit, 
  FaTrash, 
  FaUserPlus, 
  FaChartBar,
  FaShieldAlt,
  FaSave,
  FaTimes
} from 'react-icons/fa'

const FamilyAdminPanel = () => {
  const { 
    family, 
    familyMembers, 
    currentMember, 
    hasPermission,
    updateFamilyName,
    removeFamilyMember
  } = useFamily()
  
  const { signOut } = useAuth()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [editingFamilyName, setEditingFamilyName] = useState(false)
  const [familyNameInput, setFamilyNameInput] = useState(family?.name || '')
  const [selectedMember, setSelectedMember] = useState(null)
  const [loading, setLoading] = useState(false)

  const isAdmin = hasPermission('manage_family')

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Kun administratorer kan få tilgang til familieinnstillinger.</p>
      </div>
    )
  }

  const handleSaveFamilyName = async () => {
    if (!familyNameInput.trim()) return
    
    setLoading(true)
    const { error } = await updateFamilyName(familyNameInput.trim())
    
    if (error) {
      alert('Feil ved oppdatering av familienavn: ' + error.message)
    } else {
      setEditingFamilyName(false)
    }
    
    setLoading(false)
  }

  const handleRemoveMember = async (memberId, memberName) => {
    if (confirm(`Er du sikker på at du vil fjerne ${memberName} fra familien?`)) {
      setLoading(true)
      const { error } = await removeFamilyMember(memberId)
      
      if (error) {
        alert('Feil ved fjerning av medlem: ' + error.message)
      }
      
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (confirm('Er du sikker på at du vil logge ut?')) {
      await signOut()
    }
  }

  const tabStyle = (isActive) => ({
    padding: '0.75rem 1rem',
    backgroundColor: isActive ? '#82bcf4' : '#f8f9fa',
    color: isActive ? 'white' : '#666',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    borderRadius: '0.5rem 0.5rem 0 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  })

  const buttonStyle = {
    padding: '0.75rem 1rem',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }

  const renderOverview = () => (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaCog />
          Familieinnstillinger
        </h4>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1rem', 
          borderRadius: '0.5rem',
          marginTop: '1rem'
        }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
            Familienavn:
          </label>
          
          {editingFamilyName ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                value={familyNameInput}
                onChange={(e) => setFamilyNameInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.25rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setEditingFamilyName(false)
                    setFamilyNameInput(family?.name || '')
                  }}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#6c757d',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <FaTimes />
                  Avbryt
                </button>
                <button
                  onClick={handleSaveFamilyName}
                  disabled={loading}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#28a745',
                    color: 'white',
                    fontSize: '0.9rem'
                  }}
                >
                  <FaSave />
                  {loading ? 'Lagrer...' : 'Lagre'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{family?.name}</span>
              <button
                onClick={() => setEditingFamilyName(true)}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#82bcf4',
                  color: 'white',
                  fontSize: '0.9rem'
                }}
              >
                <FaEdit />
                Rediger
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaUsers />
          Medlemsoversikt ({familyMembers.length})
        </h4>
        
        <div style={{ 
          display: 'grid', 
          gap: '0.75rem',
          marginTop: '1rem'
        }}>
          {familyMembers.map(member => (
            <div
              key={member.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '0.5rem'
              }}
            >
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
                fontSize: 16,
                marginRight: '1rem'
              }}>
                {member.nickname[0].toUpperCase()}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  {member.nickname}
                  {member.id === currentMember.id && (
                    <span style={{
                      marginLeft: '0.5rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '1rem'
                    }}>
                      DU
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  {member.role === 'admin' ? 'Administrator' : 
                   member.role === 'child' ? 'Barn' : 'Medlem'} • {member.points_balance} poeng
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setSelectedMember(member)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#6c757d',
                    color: 'white',
                    padding: '0.5rem'
                  }}
                  title="Vis detaljer"
                >
                  <FaEdit />
                </button>
                
                {member.id !== currentMember.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.nickname)}
                    style={{
                      ...buttonStyle,
                      backgroundColor: '#dc3545',
                      color: 'white',
                      padding: '0.5rem'
                    }}
                    title="Fjern medlem"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#f8d7da', 
        border: '1px solid #f5c6cb',
        padding: '1rem', 
        borderRadius: '0.5rem' 
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#721c24' }}>Farlig sone</h4>
        <p style={{ fontSize: '0.9rem', color: '#721c24', marginBottom: '1rem' }}>
          Vær forsiktig med disse handlingene - de kan ikke angres.
        </p>
        <button
          onClick={handleSignOut}
          style={{
            ...buttonStyle,
            backgroundColor: '#dc3545',
            color: 'white'
          }}
        >
          Logg ut
        </button>
      </div>
    </div>
  )

  const renderInvitations = () => (
    <FamilyInvitation />
  )

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>

      {/* Tab navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '0.25rem', 
        marginBottom: '2rem',
        borderBottom: '2px solid #dee2e6'
      }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={tabStyle(activeTab === 'overview')}
        >
          <FaCog />
          Oversikt
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          style={tabStyle(activeTab === 'invitations')}
        >
          <FaUserPlus />
          Invitasjoner
        </button>
      </div>

      {/* Tab content */}
      <div style={{ 
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '0 0.5rem 0.5rem 0.5rem',
        padding: '2rem'
      }}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'invitations' && renderInvitations()}
      </div>

      {/* Member details modal */}
      {selectedMember && (
        <FamilyMemberCard
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

    </div>
  )
}

export default FamilyAdminPanel