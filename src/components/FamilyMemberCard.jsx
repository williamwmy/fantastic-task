import React, { useState } from 'react'
import { useFamily } from '../hooks/useFamily.jsx'
import Modal from './Modal'
import BackgroundSelector from './BackgroundSelector'
import ChangePasswordModal from './ChangePasswordModal'
import { FaUser, FaUserShield, FaChild, FaEdit, FaSave, FaTimes, FaKey, FaTrash } from 'react-icons/fa'

const FamilyMemberCard = ({ member, onClose }) => {
  const { 
    updateMemberProfile, 
    hasPermission, 
    currentMember,
    promoteToAdmin,
    demoteFromAdmin,
    setChildRole,
    removeFamilyMember
  } = useFamily()
  
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    nickname: member.nickname,
    avatar_color: member.avatar_color || '#82bcf4',
    background_preference: member.background_preference || 'gradient_northern_lights',
    role: member.role
  })

  const availableColors = [
    '#82bcf4', '#ff6b6b', '#4ecdc4', '#45b7d1',
    '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7',
    '#a29bfe', '#fd79a8', '#00b894', '#e17055'
  ]

  const canEditProfile = hasPermission('edit_member_profile', member.id) || 
                        (member.id === currentMember.id)
  const canChangeRole = hasPermission('change_roles') && member.id !== currentMember.id
  const canChangePassword = member.is_local_user && (hasPermission('manage_family') || member.id === currentMember.id)
  const canDeleteMember = hasPermission('manage_family') && member.id !== currentMember.id

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleColorChange = (color) => {
    setFormData(prev => ({
      ...prev,
      avatar_color: color
    }))
  }

  const handleBackgroundChange = async (backgroundPreference) => {
    // Update form data immediately
    setFormData(prev => ({
      ...prev,
      background_preference: backgroundPreference
    }))
    
    // Auto-save the background preference immediately
    setLoading(true)
    const { error } = await updateMemberProfile(member.id, { 
      background_preference: backgroundPreference 
    })
    
    if (error) {
      alert('Feil ved lagring av bakgrunn: ' + error.message)
      // Revert the change if it failed
      setFormData(prev => ({
        ...prev,
        background_preference: member.background_preference || 'gradient_northern_lights'
      }))
    }
    
    setLoading(false)
  }

  const handleSave = async () => {
    if (!canEditProfile) return

    setLoading(true)
    // Only save nickname and avatar_color (background is auto-saved)
    const { error } = await updateMemberProfile(member.id, {
      nickname: formData.nickname,
      avatar_color: formData.avatar_color,
      role: formData.role
    })
    
    if (error) {
      alert('Feil ved oppdatering: ' + error.message)
    } else {
      setEditing(false)
    }
    
    setLoading(false)
  }

  const handleRoleChange = async (newRole) => {
    if (!canChangeRole) return

    setLoading(true)
    let result
    
    switch (newRole) {
      case 'admin':
        result = await promoteToAdmin(member.id)
        break
      case 'member':
        result = await demoteFromAdmin(member.id)
        break
      case 'child':
        result = await setChildRole(member.id)
        break
    }

    if (result.error) {
      alert('Feil ved rolleendring: ' + result.error.message)
    }
    
    setLoading(false)
  }

  const handleDeleteMember = async () => {
    if (!canDeleteMember) return
    
    if (confirm(`Er du sikker på at du vil fjerne ${member.nickname} fra familien?`)) {
      setLoading(true)
      const { error } = await removeFamilyMember(member.id)
      if (error) {
        alert('Feil ved fjerning av medlem: ' + error.message)
        setLoading(false)
      } else {
        // Close modal since member was deleted
        onClose()
      }
    }
  }

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

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    marginBottom: '0.5rem'
  }

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

  return (
    <Modal 
      open={true} 
      onClose={onClose}
      title="Rediger medlem"
      subtitle="Endre profilinnstillinger og roller"
      icon={<FaEdit />}
    >
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: formData.avatar_color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 24,
              flexShrink: 0
            }}>
              {formData.nickname[0]?.toUpperCase() || member.nickname[0]?.toUpperCase()}
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{member.nickname}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                {getRoleIcon(member.role)}
                <span>{getRoleText(member.role)}</span>
                <span>• {member.points_balance} poeng</span>
              </div>
            </div>
          </div>

          {canEditProfile && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#0056b3',
                    color: 'white'
                  }}
                >
                  <FaEdit />
                  Rediger
                </button>
              )}
              
              {editing && (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    style={{
                      ...buttonStyle,
                      backgroundColor: '#6c757d',
                      color: 'white'
                    }}
                  >
                    <FaTimes />
                    Avbryt
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                      ...buttonStyle,
                      backgroundColor: '#28a745',
                      color: 'white'
                    }}
                  >
                    <FaSave />
                    {loading ? 'Lagrer...' : 'Lagre'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {editing && canEditProfile ? (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                Kallenavn:
              </label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="Skriv inn kallenavn"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                Avatar-farge:
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(6, 1fr)', 
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                {availableColors.map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: formData.avatar_color === color ? '3px solid #333' : '2px solid #ddd',
                      cursor: 'pointer'
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <BackgroundSelector
                currentSelection={formData.background_preference}
                onSelect={handleBackgroundChange}
              />
            </div>

            {/* Password change section */}
            {canChangePassword && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Passord:
                </label>
                <button
                  onClick={() => setChangingPassword(true)}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#ffc107',
                    color: '#212529',
                    width: 'auto'
                  }}
                >
                  <FaKey />
                  Endre passord
                </button>
              </div>
            )}

          </div>
        ) : (
          <div>
            {/* Member details */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Profildetaljer</h4>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Kallenavn:</strong> {member.nickname}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Rolle:</strong> {getRoleText(member.role)}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Poeng:</strong> {member.points_balance}
              </div>
              <div>
                <strong>Medlem siden:</strong> {new Date(member.created_at).toLocaleDateString('no-NO')}
              </div>
            </div>

            {/* Role management and member actions for admins */}
            {(canChangeRole || canDeleteMember) && (
              <div style={{ 
                backgroundColor: '#fff3cd', 
                padding: '1rem', 
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Medlemsadministrasjon</h4>
                
                {canChangeRole && (
                  <>
                    <p style={{ fontSize: '0.9rem', color: '#856404', marginBottom: '1rem' }}>
                      Endre medlemmets rolle i familien:
                    </p>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: canDeleteMember ? '1rem' : '0' }}>
                      {member.role !== 'admin' && (
                        <button
                          onClick={() => handleRoleChange('admin')}
                          disabled={loading}
                          style={{
                            ...buttonStyle,
                            backgroundColor: '#28a745',
                            color: 'white',
                            fontSize: '0.9rem'
                          }}
                        >
                          <FaUserShield />
                          Gjør til admin
                        </button>
                      )}
                      
                      {member.role !== 'member' && (
                        <button
                          onClick={() => handleRoleChange('member')}
                          disabled={loading}
                          style={{
                            ...buttonStyle,
                            backgroundColor: '#6c757d',
                            color: 'white',
                            fontSize: '0.9rem'
                          }}
                        >
                          <FaUser />
                          Gjør til medlem
                        </button>
                      )}
                      
                      {member.role !== 'child' && (
                        <button
                          onClick={() => handleRoleChange('child')}
                          disabled={loading}
                          style={{
                            ...buttonStyle,
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            fontSize: '0.9rem'
                          }}
                        >
                          <FaChild />
                          Gjør til barn
                        </button>
                      )}
                    </div>
                  </>
                )}

                {canDeleteMember && (
                  <>
                    <p style={{ fontSize: '0.9rem', color: '#856404', marginBottom: '1rem' }}>
                      Fjern medlem fra familien:
                    </p>
                    <button
                      onClick={handleDeleteMember}
                      disabled={loading}
                      style={{
                        ...buttonStyle,
                        backgroundColor: '#dc3545',
                        color: 'white',
                        fontSize: '0.9rem'
                      }}
                    >
                      <FaTrash />
                      Fjern fra familie
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Role restrictions info */}
            {member.role === 'child' && (
              <div style={{
                backgroundColor: '#d1ecf1',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Barn-konto begrensninger</h4>
                <ul style={{ fontSize: '0.9rem', color: '#0c5460' }}>
                  <li>Kan ikke opprette eller slette oppgaver</li>
                  <li>Kan ikke tildele oppgaver til andre</li>
                  <li>Kan kun se egne statistikker</li>
                  <li>Kan ikke administrere familieinnstillinger</li>
                </ul>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Change password modal */}
      {changingPassword && (
        <ChangePasswordModal
          member={member}
          onClose={() => setChangingPassword(false)}
          onSuccess={() => {
            console.log('Password changed for:', member.nickname)
          }}
        />
      )}
    </Modal>
  )
}

export default FamilyMemberCard