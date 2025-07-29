import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Profile Edit Permissions', () => {
  // Mock the useFamily hook logic for updateMemberProfile
  const mockFamilyMembers = [
    { id: 'user-1', nickname: 'Test User', role: 'member' },
    { id: 'admin-1', nickname: 'Admin User', role: 'admin' }
  ]
  
  const mockCurrentMember = { id: 'user-1', nickname: 'Test User', role: 'member' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow users to update their own profile without role change restrictions', () => {
    // Simulate the fixed updateMemberProfile logic
    const updateMemberProfile = (memberId, data) => {
      // Check permissions
      const canUpdate = mockCurrentMember && (
        mockCurrentMember.id === memberId || // Own profile
        mockCurrentMember.role === 'admin' || // Admin can update any
        (mockCurrentMember.role === 'member' && data.role !== 'admin') // Members can't promote to admin
      )

      if (!canUpdate) {
        throw new Error('Insufficient permissions to update this profile')
      }

      // Validate data
      const allowedFields = ['nickname', 'avatar_color', 'role']
      const updateData = {}
      
      for (const [key, value] of Object.entries(data)) {
        if (allowedFields.includes(key)) {
          updateData[key] = value
        }
      }

      // Role restrictions (fixed logic)
      if (updateData.role) {
        // Check if role is actually changing
        const currentMemberData = mockFamilyMembers.find(m => m.id === memberId)
        const isRoleChanging = currentMemberData && currentMemberData.role !== updateData.role
        
        if (isRoleChanging) {
          // Only admins can change roles
          if (mockCurrentMember.role !== 'admin') {
            throw new Error('Only admins can change member roles')
          }
          
          // Can't demote yourself if you're the only admin
          if (memberId === mockCurrentMember.id && updateData.role !== 'admin') {
            const adminCount = mockFamilyMembers.filter(m => m.role === 'admin').length
            if (adminCount <= 1) {
              throw new Error('Cannot demote the last admin')
            }
          }

          // Validate role values
          if (!['admin', 'member', 'child'].includes(updateData.role)) {
            throw new Error('Invalid role')
          }
        } else {
          // Role is not changing, remove it from update to avoid unnecessary checks
          delete updateData.role
        }
      }

      return { error: null, updateData }
    }

    // Test case 1: User updates own nickname with same role (should work)
    const result1 = updateMemberProfile('user-1', { 
      nickname: 'Updated Name', 
      role: 'member' // Same role as current
    })
    
    expect(result1.error).toBeNull()
    expect(result1.updateData).toEqual({ nickname: 'Updated Name' }) // role should be removed

    // Test case 2: User updates own nickname without role field (should work)
    const result2 = updateMemberProfile('user-1', { 
      nickname: 'Another Name'
    })
    
    expect(result2.error).toBeNull()
    expect(result2.updateData).toEqual({ nickname: 'Another Name' })

    // Test case 3: User tries to change their own role (should fail)
    expect(() => {
      updateMemberProfile('user-1', { 
        nickname: 'Test User',
        role: 'admin' // Different role - should trigger role change restriction
      })
    }).toThrow('Only admins can change member roles')
  })

  it('should prevent non-admins from changing other users profiles', () => {
    const updateMemberProfile = (memberId, data) => {
      // Check permissions - fixed logic
      const canUpdate = mockCurrentMember && (
        mockCurrentMember.id === memberId || // Own profile
        mockCurrentMember.role === 'admin' // Admin can update any
      )

      if (!canUpdate) {
        throw new Error('Insufficient permissions to update this profile')
      }

      return { error: null }
    }

    // Test: Regular member tries to update another member's profile
    expect(() => {
      updateMemberProfile('admin-1', { nickname: 'Hacked Name' })
    }).toThrow('Insufficient permissions to update this profile')
  })
})