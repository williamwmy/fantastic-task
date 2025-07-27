import { useState, useEffect, createContext, useContext } from 'react'
import { useAuth } from './useAuth.jsx'
import { supabase } from '../lib/supabase'
import { mockData, generateMockFamilyCode } from '../lib/mockData'

const FamilyContext = createContext({})

export const useFamily = () => {
  const context = useContext(FamilyContext)
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider')
  }
  return context
}

const LOCAL_TEST_USER = import.meta.env.VITE_LOCAL_TEST_USER === 'true';

export const FamilyProvider = ({ children, initialFamily, initialMember }) => {
  const { user } = useAuth()
  const [family, setFamily] = useState(initialFamily || null)
  const [familyMembers, setFamilyMembers] = useState(initialMember ? [initialMember] : [])
  const [currentMember, setCurrentMember] = useState(initialMember || null)
  // Removed invitationCodes state - family code is now part of family object
  const [loading, setLoading] = useState(false)

  // Load family data when user changes
  useEffect(() => {
    // Don't override initial props in test mode
    if (initialFamily && initialMember) {
      return
    }
    
    if (user) {
      if (LOCAL_TEST_USER) {
        // Use centralized mock data
        setFamily(mockData.family);
        setCurrentMember(mockData.currentMember);
        setFamilyMembers(mockData.familyMembers);
        // Family code is now part of family object
        setLoading(false);
      } else {
        loadFamilyData()
      }
    } else {
      setFamily(null)
      setFamilyMembers([])
      setCurrentMember(null)
    }
  }, [user, initialFamily, initialMember])

  const loadFamilyData = async () => {
    try {
      setLoading(true)

      // Get the user's family membership
      let memberData, memberError
      
      if (user.user_metadata?.is_local_user) {
        // For local users, get member data using family_member_id from user metadata
        const result = await supabase
          .from('family_members')
          .select('*, families(*)')
          .eq('id', user.user_metadata.family_member_id)
          .maybeSingle()
        memberData = result.data
        memberError = result.error
      } else {
        // For regular Supabase users, use user_id
        const result = await supabase
          .from('family_members')
          .select('*, families(*)')
          .eq('user_id', user.id)
          .maybeSingle()
        memberData = result.data
        memberError = result.error
      }

      if (memberError) {
        console.error('Error loading family member:', memberError)
        return
      }

      // If no family membership found, user needs to create/join a family
      if (!memberData) {
        setFamily(null)
        setCurrentMember(null)
        setFamilyMembers([])
        return
      }

      if (memberData) {
        setFamily(memberData.families)
        setCurrentMember(memberData)

        // Load all family members
        const { data: allMembers, error: membersError } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', memberData.family_id)
          .order('created_at')

        if (membersError) {
          console.error('Error loading family members:', membersError)
        } else {
          setFamilyMembers(allMembers)
        }

        // Family code is now part of family object - no need to load separate invitation codes
      }
    } catch (error) {
      console.error('Error loading family data:', error)
    } finally {
      setLoading(false)
    }
  }

  // loadInvitationCodes removed - family code is now part of family object

  const rotateFamilyCode = async () => {
    try {
      if (!currentMember || currentMember.role !== 'admin') {
        throw new Error('Only admins can rotate family code')
      }

      // Generate a new 5-character code
      const newCode = generateMockFamilyCode()

      if (LOCAL_TEST_USER) {
        // Update mock family data
        setFamily(prev => ({ ...prev, family_code: newCode }));
        return { data: { family_code: newCode }, error: null };
      }

      const { data, error } = await supabase
        .from('families')
        .update({ family_code: newCode })
        .eq('id', family.id)
        .select()
        .single()

      if (error) throw error

      // Update local family state
      setFamily(prev => ({ ...prev, family_code: newCode }))

      return { data, error: null }
    } catch (error) {
      console.error('Error rotating family code:', error)
      return { data: null, error }
    }
  }

  const updateMemberNickname = async (memberId, nickname) => {
    try {
      const { error } = await supabase
        .from('family_members')
        .update({ nickname })
        .eq('id', memberId)

      if (error) throw error

      // Refresh family data
      await loadFamilyData()

      return { error: null }
    } catch (error) {
      console.error('Error updating member nickname:', error)
      return { error }
    }
  }

  const updateMemberAvatarColor = async (memberId, avatarColor) => {
    try {
      const { error } = await supabase
        .from('family_members')
        .update({ avatar_color: avatarColor })
        .eq('id', memberId)

      if (error) throw error

      // Update local state
      if (currentMember && currentMember.id === memberId) {
        setCurrentMember(prev => ({ ...prev, avatar_color: avatarColor }))
      }
      
      setFamilyMembers(prev => 
        prev.map(member => 
          member.id === memberId 
            ? { ...member, avatar_color: avatarColor }
            : member
        )
      )

      return { error: null }
    } catch (error) {
      console.error('Error updating member avatar color:', error)
      return { error }
    }
  }

  const removeFamilyMember = async (memberId) => {
    try {
      if (!currentMember || currentMember.role !== 'admin') {
        throw new Error('Only admins can remove family members')
      }

      if (memberId === currentMember.id) {
        throw new Error('You cannot remove yourself from the family')
      }

      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      // Refresh family data
      await loadFamilyData()

      return { error: null }
    } catch (error) {
      console.error('Error removing family member:', error)
      return { error }
    }
  }

  // New functions for the extended requirements
  const getFamily = () => family

  const getFamilyMembers = () => familyMembers

  const createFamily = async (name) => {
    try {
      if (!user) throw new Error('User not authenticated')

      // Generate a new family code
      const familyCode = generateMockFamilyCode()

      // Create family
      const { data: newFamily, error: familyError } = await supabase
        .from('families')
        .insert({
          name,
          family_code: familyCode,
          created_by: user.id
        })
        .select()
        .single()

      if (familyError) throw familyError

      // Add user as admin of the family
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: newFamily.id,
          user_id: user.id,
          nickname: 'Admin',
          role: 'admin'
        })

      if (memberError) throw memberError

      // Refresh family data
      await loadFamilyData()

      return { data: newFamily, error: null }
    } catch (error) {
      console.error('Create family error:', error)
      return { data: null, error }
    }
  }

  const joinFamily = async (familyCode) => {
    try {
      if (!user) throw new Error('User not authenticated')

      // Find the family by family code
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('family_code', familyCode.toUpperCase())
        .single()

      if (familyError || !familyData) {
        throw new Error('Invalid family code')
      }

      // Check if user is already a member of this family
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('family_id', familyData.id)
        .single()

      if (existingMember) {
        throw new Error('You are already a member of this family')
      }

      // Add user to family
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: familyData.id,
          user_id: user.id,
          nickname: 'Nytt medlem',
          role: 'member'
        })

      if (memberError) throw memberError

      // Refresh family data
      await loadFamilyData()

      return { error: null }
    } catch (error) {
      console.error('Join family error:', error)
      return { error }
    }
  }

  const updateMemberProfile = async (memberId, data) => {
    try {
      // Check permissions
      const canUpdate = currentMember && (
        currentMember.id === memberId || // Own profile
        currentMember.role === 'admin' || // Admin can update any
        (currentMember.role === 'member' && data.role !== 'admin') // Members can't promote to admin
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

      // Role restrictions
      if (updateData.role) {
        // Only admins can change roles
        if (currentMember.role !== 'admin') {
          throw new Error('Only admins can change member roles')
        }
        
        // Can't demote yourself if you're the only admin
        if (memberId === currentMember.id && updateData.role !== 'admin') {
          const adminCount = familyMembers.filter(m => m.role === 'admin').length
          if (adminCount <= 1) {
            throw new Error('Cannot demote the last admin')
          }
        }

        // Validate role values
        if (!['admin', 'member', 'child'].includes(updateData.role)) {
          throw new Error('Invalid role')
        }
      }

      const { error } = await supabase
        .from('family_members')
        .update(updateData)
        .eq('id', memberId)

      if (error) throw error

      // Refresh family data
      await loadFamilyData()

      return { error: null }
    } catch (error) {
      console.error('Error updating member profile:', error)
      return { error }
    }
  }

  const updateFamilyName = async (name) => {
    try {
      if (!currentMember || currentMember.role !== 'admin') {
        throw new Error('Only admins can update family name')
      }

      const { error } = await supabase
        .from('families')
        .update({ name })
        .eq('id', family.id)

      if (error) throw error

      // Update local state
      setFamily(prev => ({ ...prev, name }))

      return { error: null }
    } catch (error) {
      console.error('Error updating family name:', error)
      return { error }
    }
  }

  const promoteToAdmin = async (memberId) => {
    return updateMemberProfile(memberId, { role: 'admin' })
  }

  const demoteFromAdmin = async (memberId) => {
    return updateMemberProfile(memberId, { role: 'member' })
  }

  const setChildRole = async (memberId) => {
    return updateMemberProfile(memberId, { role: 'child' })
  }

  const resetAllPoints = async () => {
    try {
      if (!currentMember || currentMember.role !== 'admin') {
        throw new Error('Only admins can reset all points')
      }

      if (LOCAL_TEST_USER) {
        // In test mode, just update local state
        setFamilyMembers(prev => 
          prev.map(member => ({ ...member, points_balance: 0 }))
        )
        if (currentMember) {
          setCurrentMember(prev => ({ ...prev, points_balance: 0 }))
        }
        return { error: null }
      }

      // Reset all family members' points to 0
      const { error } = await supabase
        .from('family_members')
        .update({ points_balance: 0 })
        .eq('family_id', family.id)

      if (error) throw error

      // Refresh family data to update local state
      await loadFamilyData()

      return { error: null }
    } catch (error) {
      console.error('Error resetting all points:', error)
      return { error }
    }
  }

  // Role-based access control helpers
  const hasPermission = (action, targetMemberId = null) => {
    if (!currentMember) return false

    const isAdmin = currentMember.role === 'admin'
    const isMember = currentMember.role === 'member'
    const isChild = currentMember.role === 'child'
    const isOwnProfile = targetMemberId === currentMember.id

    switch (action) {
      case 'manage_family':
      case 'invite_members':
      case 'remove_members':
      case 'change_roles':
        return isAdmin

      case 'view_all_stats':
        return isAdmin || isMember

      case 'edit_tasks':
        return isAdmin || isMember

      case 'assign_tasks':
        return isAdmin || (isMember && !isChild)

      case 'complete_own_tasks':
        return true // Everyone can complete their own tasks

      case 'edit_own_profile':
        return isOwnProfile

      case 'edit_member_profile':
        return isAdmin || (isMember && targetMemberId && 
               familyMembers.find(m => m.id === targetMemberId)?.role === 'child')

      case 'view_points':
        return true // Everyone can view points

      case 'award_bonus_points':
        return isAdmin

      default:
        return false
    }
  }

  const value = {
    family,
    familyMembers,
    currentMember,
    // invitationCodes removed - family code is now part of family object
    loading,
    setCurrentMember,
    loadFamilyData,
    rotateFamilyCode,
    updateMemberNickname,
    updateMemberAvatarColor,
    removeFamilyMember,
    // New extended functions
    getFamily,
    getFamilyMembers,
    createFamily,
    joinFamily,
    updateMemberProfile,
    updateFamilyName,
    promoteToAdmin,
    demoteFromAdmin,
    setChildRole,
    resetAllPoints,
    hasPermission
  }

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  )
}