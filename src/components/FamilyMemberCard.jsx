import React, { useState } from 'react'
import { useFamily } from '../hooks/useFamily.jsx'
import Modal from './Modal'
import { FaUser, FaUserShield, FaChild, FaEdit, FaSave, FaTimes } from 'react-icons/fa'

const FamilyMemberCard = ({ member, onClose }) => {
  const { 
    updateMemberProfile, 
    hasPermission, 
    currentMember,
    promoteToAdmin,
    demoteFromAdmin,
    setChildRole
  } = useFamily()
  
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nickname: member.nickname,
    avatar_color: member.avatar_color || '#82bcf4',
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

  const handleSave = async () => {
    if (!canEditProfile) return

    setLoading(true)
    const { error } = await updateMemberProfile(member.id, formData)
    
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
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
            fontSize: 24
          }}>
            {formData.nickname[0]?.toUpperCase() || member.nickname[0]?.toUpperCase()}
          </div>
          
          <div>
            <h2 style={{ margin: 0 }}>{member.nickname}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666' }}>
              {getRoleIcon(member.role)}
              <span>{getRoleText(member.role)}</span>
              <span>• {member.points_balance} poeng</span>
            </div>
          </div>

          {canEditProfile && (
            <button
              onClick={() => setEditing(!editing)}
              style={{
                ...buttonStyle,
                backgroundColor: editing ? '#6c757d' : '#0056b3',
                color: 'white',
                marginLeft: 'auto'
              }}
            >
              {editing ? <FaTimes /> : <FaEdit />}
              {editing ? 'Avbryt' : 'Rediger'}
            </button>
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

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
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
            </div>
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

            {/* Role management for admins */}
            {canChangeRole && (
              <div style={{ 
                backgroundColor: '#fff3cd', 
                padding: '1rem', 
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Rollehåndtering</h4>
                <p style={{ fontSize: '0.9rem', color: '#856404', marginBottom: '1rem' }}>
                  Endre medlemmets rolle i familien:
                </p>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {member.role !== 'admin' && (
                    <button
                      onClick={() => handleRoleChange('admin')}
                      disabled={loading}
                      style={{
                        ...buttonStyle,
                        backgroundColor: '#dc3545',
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
    </Modal>
  )
}

export default FamilyMemberCard