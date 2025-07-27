import React, { useState } from 'react'
import { useFamily } from '../hooks/useFamily.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { FaUser, FaUserShield, FaChild, FaEdit, FaTrash, FaUserPlus, FaKey, FaSignOutAlt } from 'react-icons/fa'
import FamilyMemberCard from './FamilyMemberCard'
import CreateLocalUserModal from './CreateLocalUserModal'
import ChangePasswordModal from './ChangePasswordModal'

const ProfileSelector = () => {
  const { 
    familyMembers, 
    currentMember, 
    setCurrentMember, 
    hasPermission,
    removeFamilyMember 
  } = useFamily()
  
  const { signOut } = useAuth()
  
  const [editingMember, setEditingMember] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [changingPasswordFor, setChangingPasswordFor] = useState(null)

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

  const handleSignOut = async () => {
    if (confirm('Er du sikker på at du vil logge ut?')) {
      await signOut()
    }
  }

  const canManageMembers = hasPermission('manage_family')

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaUser />
          Familiemedlemmer ({familyMembers.length})
        </h3>
        
        {canManageMembers && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '2rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
            title="Opprett ny profil"
          >
            <FaUserPlus />
            Ny profil
          </button>
        )}
      </div>

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
                {member.is_local_user && (
                  <span style={{
                    fontSize: '0.75rem',
                    backgroundColor: '#e3f2fd',
                    color: '#1565c0',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '0.75rem',
                    fontWeight: 600
                  }}>
                    LOKAL
                  </span>
                )}
                <span style={{ fontSize: '0.9rem' }}>
                  • {member.points_balance} poeng
                </span>
              </div>
            </div>

            {/* Action buttons */}
            {/* Show edit button for own profile OR admin can edit others */}
            {(member.id === currentMember.id || (canManageMembers && member.id !== currentMember.id)) && (
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
                  title={member.id === currentMember.id ? "Rediger din profil" : "Rediger medlem"}
                >
                  <FaEdit />
                </button>
                
                {/* Password change only for local users and only admins can change others' passwords */}
                {member.is_local_user && (canManageMembers || member.id === currentMember.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setChangingPasswordFor(member)
                    }}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#ffc107',
                      color: '#212529',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Endre passord"
                  >
                    <FaKey />
                  </button>
                )}
                
                {/* Remove button only for admins and not for themselves */}
                {canManageMembers && member.id !== currentMember.id && (
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
                )}
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

      {/* Logout button */}
      <div style={{
        marginTop: '1.5rem',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '2rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
          title="Logg ut av applikasjonen"
        >
          <FaSignOutAlt />
          Logg ut
        </button>
      </div>

      {/* Edit member modal */}
      {editingMember && (
        <FamilyMemberCard
          member={editingMember}
          onClose={() => setEditingMember(null)}
        />
      )}

      {/* Create local user modal */}
      {showCreateModal && (
        <CreateLocalUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newUser) => {
            // Could show a success message here
            console.log('New user created:', newUser)
          }}
        />
      )}

      {/* Change password modal */}
      {changingPasswordFor && (
        <ChangePasswordModal
          member={changingPasswordFor}
          onClose={() => setChangingPasswordFor(null)}
          onSuccess={() => {
            // Could show a success message here
            console.log('Password changed for:', changingPasswordFor.nickname)
          }}
        />
      )}

    </div>
  )
}

export default ProfileSelector