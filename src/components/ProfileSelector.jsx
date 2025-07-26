import React, { useState } from 'react'
import { useFamily } from '../hooks/useFamily.jsx'
import { FaUser, FaUserShield, FaChild, FaEdit, FaTrash, FaUserPlus } from 'react-icons/fa'
import FamilyMemberCard from './FamilyMemberCard'

const ProfileSelector = () => {
  const { 
    familyMembers, 
    currentMember, 
    setCurrentMember, 
    hasPermission,
    removeFamilyMember 
  } = useFamily()
  
  const [editingMember, setEditingMember] = useState(null)

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <FaUserShield style={{ color: '#dc3545' }} />
      case 'child': return <FaChild style={{ color: '#17a2b8' }} />
      default: return <FaUser style={{ color: '#6c757d' }} />
    }
  }

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'child': return 'Barn'
      default: return 'Medlem'
    }
  }

  const handleMemberSelect = (member) => {
    setCurrentMember(member)
  }

  const handleEditMember = (member) => {
    setEditingMember(member)
  }

  const handleRemoveMember = async (memberId, memberName) => {
    if (confirm(`Er du sikker på at du vil fjerne ${memberName} fra familien?`)) {
      const { error } = await removeFamilyMember(memberId)
      if (error) {
        alert('Feil ved fjerning av medlem: ' + error.message)
      }
    }
  }

  const canManageMembers = hasPermission('manage_family')

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FaUser />
        Familiemedlemmer ({familyMembers.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {familyMembers.map(member => (
          <div
            key={member.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: member.id === currentMember.id ? '#e3f2fd' : '#f8f9fa',
              border: `2px solid ${member.id === currentMember.id ? '#82bcf4' : '#dee2e6'}`,
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => handleMemberSelect(member)}
          >
            {/* Avatar */}
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: member.avatar_color || '#82bcf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 20,
              marginRight: '1rem'
            }}>
              {member.nickname[0].toUpperCase()}
            </div>

            {/* Member info */}
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '0.25rem'
              }}>
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  {member.nickname}
                </span>
                {member.id === currentMember.id && (
                  <span style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '1rem',
                    fontWeight: 600
                  }}>
                    DU
                  </span>
                )}
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: '#666'
              }}>
                {getRoleIcon(member.role)}
                <span style={{ fontSize: '0.9rem' }}>
                  {getRoleText(member.role)}
                </span>
                <span style={{ fontSize: '0.9rem' }}>
                  • {member.points_balance} poeng
                </span>
              </div>
            </div>

            {/* Action buttons */}
            {canManageMembers && member.id !== currentMember.id && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditMember(member)
                  }}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Rediger medlem"
                >
                  <FaEdit />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveMember(member.id, member.nickname)
                  }}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Fjern medlem"
                >
                  <FaTrash />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Role-based restrictions message */}
      {currentMember.role === 'child' && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '0.5rem',
          fontSize: '0.9rem',
          color: '#856404'
        }}>
          <strong>Barn-konto:</strong> Du har begrenset tilgang til noen funksjoner.
        </div>
      )}

      {/* Current member info */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#d1ecf1',
        borderRadius: '0.5rem'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Aktiv profil:</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: currentMember.avatar_color || '#82bcf4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 14
          }}>
            {currentMember.nickname[0].toUpperCase()}
          </div>
          <span style={{ fontWeight: 600 }}>{currentMember.nickname}</span>
          <span style={{ color: '#666' }}>({getRoleText(currentMember.role)})</span>
        </div>
      </div>

      {/* Edit member modal */}
      {editingMember && (
        <FamilyMemberCard
          member={editingMember}
          onClose={() => setEditingMember(null)}
        />
      )}

    </div>
  )
}

export default ProfileSelector