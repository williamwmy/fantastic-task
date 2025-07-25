import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, familyCode = null) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            family_code: familyCode
          }
        }
      })

      if (error) throw error

      // If there's a family code, join the family after signup
      if (familyCode && data.user) {
        await joinFamilyWithCode(familyCode, data.user.id)
      }

      return { data, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  }

  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Reset password error:', error)
      return { data: null, error }
    }
  }

  const joinFamilyWithCode = async (code, userId = null) => {
    try {
      const currentUserId = userId || user?.id
      if (!currentUserId) throw new Error('No user ID available')

      // Find the invitation code
      const { data: invitation, error: inviteError } = await supabase
        .from('family_invitation_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .lt('used_count', supabase.raw('max_uses'))
        .single()

      if (inviteError || !invitation) {
        throw new Error('Invalid or expired invitation code')
      }

      // Check if user is already a member of this family
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', currentUserId)
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
          user_id: currentUserId,
          nickname: 'Nytt medlem', // Default nickname, user can change later
          role: 'member'
        })

      if (memberError) throw memberError

      // Update invitation code usage
      const { error: updateError } = await supabase
        .from('family_invitation_codes')
        .update({ used_count: invitation.used_count + 1 })
        .eq('id', invitation.id)

      if (updateError) throw updateError

      return { error: null }
    } catch (error) {
      console.error('Join family error:', error)
      return { error }
    }
  }

  const createFamily = async (familyName, userNickname) => {
    try {
      if (!user) throw new Error('User not authenticated')

      // Create family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: familyName,
          created_by: user.id
        })
        .select()
        .single()

      if (familyError) throw familyError

      // Add user as admin of the family
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: user.id,
          nickname: userNickname,
          role: 'admin'
        })

      if (memberError) throw memberError

      return { data: family, error: null }
    } catch (error) {
      console.error('Create family error:', error)
      return { data: null, error }
    }
  }

  const value = {
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    joinFamilyWithCode,
    createFamily
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}