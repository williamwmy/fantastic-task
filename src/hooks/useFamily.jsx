import { useState, useEffect, createContext, useContext } from 'react'
import { useAuth } from './useAuth.jsx'
import { supabase } from '../lib/supabase'
import { mockData, generateMockInvitationCode } from '../lib/mockData'

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
  const [invitationCodes, setInvitationCodes] = useState([])
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
        setInvitationCodes(mockData.invitationCodes);
        setLoading(false);
      } else {
        loadFamilyData()
      }
    } else {
      setFamily(null)
      setFamilyMembers([])
      setCurrentMember(null)
      setInvitationCodes([])
    }
  }, [user, initialFamily, initialMember])

  const loadFamilyData = async () => {
    try {
      setLoading(true)

      // Get the user's family membership
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select('*, families(*)')
        .eq('user_id', user.id)
        .maybeSingle()

      if (memberError) {
        console.error('Error loading family member:', memberError)
        return
      }

      // If no family membership found, user needs to create/join a family
      if (!memberData) {
        setFamily(null)
        setCurrentMember(null)
        setFamilyMembers([])
        setInvitationCodes([])
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

        // Load invitation codes if user is admin
        if (memberData.role === 'admin') {
          await loadInvitationCodes(memberData.family_id)
        }
      }
    } catch (error) {
      console.error('Error loading family data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInvitationCodes = async (familyId) => {
    try {
      const { data, error } = await supabase
        .from('family_invitation_codes')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading invitation codes:', error)
      } else {
        setInvitationCodes(data)
      }
    } catch (error) {
      console.error('Error loading invitation codes:', error)
    }
  }

  const generateInvitationCode = async (maxUses = 1, expiresInDays = 7) => {
    try {
      if (LOCAL_TEST_USER) {
        // Generate mock invitation code using helper function
        const mockCode = generateMockInvitationCode(maxUses, expiresInDays);
        setInvitationCodes(prev => [mockCode, ...prev]);
        return { data: mockCode, error: null };
      }

      if (!currentMember || currentMember.role !== 'admin') {
        throw new Error('Only admins can generate invitation codes')
      }

      // Generate a random 8-character code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()
      
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)

      const { data, error } = await supabase
        .from('family_invitation_codes')
        .insert({
          family_id: family.id,
          code,
          created_by: currentMember.id,
          expires_at: expiresAt.toISOString(),
          max_uses: maxUses
        })
        .select()
        .single()

      if (error) throw error

      // Refresh invitation codes
      await loadInvitationCodes(family.id)

      return { data, error: null }
    } catch (error) {
      console.error('Error generating invitation code:', error)
      return { data: null, error }
    }
  }

  const deactivateInvitationCode = async (codeId) => {
    try {
      if (!currentMember || currentMember.role !== 'admin') {
        throw new Error('Only admins can deactivate invitation codes')
      }

      const { error } = await supabase
        .from('family_invitation_codes')
        .update({ is_active: false })
        .eq('id', codeId)

      if (error) throw error

      // Refresh invitation codes
      await loadInvitationCodes(family.id)

      return { error: null }
    } catch (error) {
      console.error('Error deactivating invitation code:', error)
      return { error }
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

      // Create family
      const { data: newFamily, error: familyError } = await supabase
        .from('families')
        .insert({
          name,
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

  const joinFamily = async (inviteCode) => {
    try {
      if (!user) throw new Error('User not authenticated')

      // Find the invitation code
      const { data: invitations, error: inviteError } = await supabase
        .from('family_invitation_codes')
        .select('*')
        .eq('code', inviteCode)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      if (inviteError) {
        throw new Error('Error finding invitation code')
      }

      // Filter for codes that haven't reached max uses
      const invitation = invitations.find(inv => inv.used_count < inv.max_uses)

      if (inviteError || !invitation) {
        throw new Error('Invalid or expired invitation code')
      }

      // Check if user is already a member of this family
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('family_id', invitation.family_id)
        .single()

      if (existingMember) {
        throw new Error('You are already a member of this family')
      }

      // Add user to family
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: invitation.family_id,
          user_id: user.id,
          nickname: 'Nytt medlem',
          role: 'member'
        })

      if (memberError) throw memberError

      // Update invitation code usage
      const { error: updateError } = await supabase
        .from('family_invitation_codes')
        .update({ used_count: invitation.used_count + 1 })
        .eq('id', invitation.id)

      if (updateError) throw updateError

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
    invitationCodes,
    loading,
    setCurrentMember,
    loadFamilyData,
    generateInvitationCode,
    deactivateInvitationCode,
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
    hasPermission
  }

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  )
}