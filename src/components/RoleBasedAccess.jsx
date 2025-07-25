import React from 'react'
import { useFamily } from '../hooks/useFamily.jsx'
import { FaLock } from 'react-icons/fa'

// Higher-order component for role-based access control
export const withRoleAccess = (WrappedComponent, requiredPermission, targetMemberIdProp = null) => {
  return function RoleProtectedComponent(props) {
    const { hasPermission } = useFamily()
    
    const targetMemberId = targetMemberIdProp ? props[targetMemberIdProp] : null
    const hasAccess = hasPermission(requiredPermission, targetMemberId)
    
    if (!hasAccess) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '0.5rem',
          border: '1px solid #dee2e6'
        }}>
          <FaLock size={48} style={{ color: '#6c757d', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#6c757d' }}>Ingen tilgang</h3>
          <p style={{ color: '#6c757d', textAlign: 'center' }}>
            Du har ikke tillatelse til å se denne delen av appen.
          </p>
        </div>
      )
    }
    
    return <WrappedComponent {...props} />
  }
}

// Component for checking multiple permissions
export const PermissionGate = ({ 
  children, 
  permission, 
  targetMemberId = null, 
  fallback = null 
}) => {
  const { hasPermission } = useFamily()
  
  const hasAccess = hasPermission(permission, targetMemberId)
  
  if (!hasAccess) {
    return fallback || (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '0.5rem',
        color: '#856404',
        textAlign: 'center'
      }}>
        <FaLock style={{ marginRight: '0.5rem' }} />
        Ingen tilgang til denne funksjonen
      </div>
    )
  }
  
  return children
}

// Hook for conditional rendering based on permissions
export const usePermissionCheck = () => {
  const { hasPermission, currentMember } = useFamily()
  
  const checkPermission = (permission, targetMemberId = null) => {
    return hasPermission(permission, targetMemberId)
  }
  
  const getRole = () => currentMember?.role || 'guest'
  
  const isAdmin = () => currentMember?.role === 'admin'
  const isMember = () => currentMember?.role === 'member'
  const isChild = () => currentMember?.role === 'child'
  
  return {
    checkPermission,
    getRole,
    isAdmin,
    isMember,
    isChild,
    currentRole: getRole()
  }
}

// Component for role-based button visibility
export const RoleButton = ({ 
  children, 
  permission, 
  targetMemberId = null, 
  onClick, 
  style = {},
  disabled = false,
  ...props 
}) => {
  const { hasPermission } = useFamily()
  
  const hasAccess = hasPermission(permission, targetMemberId)
  
  if (!hasAccess) {
    return null
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={style}
      {...props}
    >
      {children}
    </button>
  )
}

// Component for role-based content sections
export const RoleSection = ({ 
  children, 
  permission, 
  targetMemberId = null, 
  roles = [], // Alternative: check by role directly
  showFallback = false,
  fallbackText = "Du har ikke tilgang til denne seksjonen"
}) => {
  const { hasPermission, currentMember } = useFamily()
  
  let hasAccess = false
  
  if (permission) {
    hasAccess = hasPermission(permission, targetMemberId)
  } else if (roles.length > 0) {
    hasAccess = currentMember && roles.includes(currentMember.role)
  }
  
  if (!hasAccess) {
    if (showFallback) {
      return (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '0.5rem',
          border: '1px solid #dee2e6',
          color: '#6c757d',
          textAlign: 'center'
        }}>
          <FaLock style={{ marginRight: '0.5rem' }} />
          {fallbackText}
        </div>
      )
    }
    return null
  }
  
  return <>{children}</>
}

// Utility component for displaying user's current permissions
export const PermissionDebug = () => {
  const { currentMember, hasPermission } = useFamily()
  
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  const permissions = [
    'manage_family',
    'invite_members',
    'remove_members',
    'change_roles',
    'view_all_stats',
    'edit_tasks',
    'assign_tasks',
    'complete_own_tasks',
    'edit_own_profile',
    'view_points',
    'award_bonus_points'
  ]
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      backgroundColor: '#343a40',
      color: 'white',
      padding: '1rem',
      borderRadius: '0.5rem',
      fontSize: '0.8rem',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h4 style={{ margin: '0 0 0.5rem 0' }}>
        Debug: {currentMember?.nickname} ({currentMember?.role})
      </h4>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {permissions.map(permission => (
          <div key={permission} style={{ marginBottom: '0.25rem' }}>
            <span style={{ 
              color: hasPermission(permission) ? '#28a745' : '#dc3545',
              marginRight: '0.5rem' 
            }}>
              {hasPermission(permission) ? '✓' : '✗'}
            </span>
            {permission}
          </div>
        ))}
      </div>
    </div>
  )
}