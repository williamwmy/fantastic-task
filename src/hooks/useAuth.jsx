import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'
import { mockUser, mockFamily, generateMockFamilyCode } from '../lib/mockData'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children, initialUser }) => {
  const [user, setUser] = useState(initialUser || null)
  const [isLoading, setIsLoading] = useState(initialUser === undefined)

  useEffect(() => {
    const LOCAL_TEST_USER = import.meta.env.VITE_LOCAL_TEST_USER === 'true';
    
    // Don't override initial user when provided for testing
    if (initialUser && !LOCAL_TEST_USER) {
      setIsLoading(false);
      return;
    }
    
    if (LOCAL_TEST_USER) {
      setUser({ ...mockUser, id: 'test-user-id' });
      setIsLoading(false);
      return;
    }
    // ...existing Supabase logic...
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        setIsLoading(false)
      } catch (error) {
        console.error('Session error:', error)
        setIsLoading(false)
      }
    }
    getInitialSession()
    
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user ?? null)
          setIsLoading(false)
        }
      )
      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('Auth state change error:', error)
      setIsLoading(false)
    }
  }, [initialUser])

  // MOCKED FUNCTIONS
  const signUp = async (email, password, familyCode = null) => {
    const LOCAL_TEST_USER = import.meta.env.VITE_LOCAL_TEST_USER === 'true';
    
    if (LOCAL_TEST_USER) {
      return { data: { user: { ...mockUser, id: 'test-user-id' } }, error: null };
    }
    
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

  const signIn = async (email, password, familyCode = null) => {
    const LOCAL_TEST_USER = import.meta.env.VITE_LOCAL_TEST_USER === 'true';
    
    if (LOCAL_TEST_USER) {
      return { data: { user: { ...mockUser, id: 'test-user-id' } }, error: null };
    }
    
    try {
      // First try local user authentication (username-based)
      if (!email.includes('@')) {
        return await signInLocalUser(email, password, familyCode)
      }

      // Regular Supabase email authentication
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

  const signInLocalUser = async (username, password, familyCode = null) => {
    try {
      let query = supabase
        .from('family_members')
        .select(`
          *,
          families!inner(*)
        `)
        .eq('username', username)
        .eq('is_local_user', true)

      // If family code provided, also filter by family
      if (familyCode) {
        query = query.eq('families.family_code', familyCode.toUpperCase())
      }

      const { data: members, error: fetchError } = await query

      if (fetchError) throw fetchError
      if (!members || members.length === 0) {
        throw new Error('Brukernavn ikke funnet')
      }

      const member = members[0]

      // Verify password using database function
      const { data: passwordValid, error: verifyError } = await supabase
        .rpc('verify_password', {
          password: password,
          hash: member.password_hash
        })

      if (verifyError) throw verifyError
      if (!passwordValid) {
        throw new Error('Feil passord')
      }

      // Create a mock user object for local users
      const localUser = {
        id: `local_${member.id}`,
        email: null,
        user_metadata: {
          is_local_user: true,
          family_member_id: member.id,
          nickname: member.nickname,
          family_id: member.family_id
        }
      }

      setUser(localUser)
      return { data: { user: localUser }, error: null }
    } catch (error) {
      console.error('Local user sign in error:', error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    const LOCAL_TEST_USER = import.meta.env.VITE_LOCAL_TEST_USER === 'true';
    
    if (LOCAL_TEST_USER) {
      setUser(null);
      return { error: null };
    }
    
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
    const LOCAL_TEST_USER = import.meta.env.VITE_LOCAL_TEST_USER === 'true';
    
    if (LOCAL_TEST_USER) {
      return { data: null, error: null };
    }
    
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
    const LOCAL_TEST_USER = import.meta.env.VITE_LOCAL_TEST_USER === 'true';
    
    if (LOCAL_TEST_USER) {
      return { error: null };
    }
    
    try {
      const currentUserId = userId || user?.id
      if (!currentUserId) throw new Error('No user ID available')

      // Find the family by family code
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('family_code', code.toUpperCase())
        .single()

      if (familyError || !familyData) {
        throw new Error('Invalid family code')
      }

      // Check if user is already a member of this family
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', currentUserId)
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
          user_id: currentUserId,
          nickname: 'Nytt medlem',
          role: 'member'
        })

      if (memberError) throw memberError

      return { error: null }
    } catch (error) {
      console.error('Join family error:', error)
      return { error }
    }
  }

  const createFamily = async (familyName, userNickname) => {
    const LOCAL_TEST_USER = import.meta.env.VITE_LOCAL_TEST_USER === 'true';
    
    if (LOCAL_TEST_USER) {
      return { data: { ...mockFamily, name: familyName }, error: null };
    }
    
    try {
      if (!user) throw new Error('User not authenticated')

      // Generate a new family code
      const familyCode = generateMockFamilyCode()

      // Create family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: familyName,
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

  const createLocalUser = async (familyId, username, password, nickname, role = 'member', createdByAdminId) => {
    try {
      // Hash password using database function
      const { data: hashedPassword, error: hashError } = await supabase
        .rpc('hash_password', { password })

      if (hashError) throw hashError

      // Create local user family member
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: familyId,
          username: username,
          password_hash: hashedPassword,
          nickname: nickname,
          role: role,
          is_local_user: true,
          created_by_admin: createdByAdminId
        })
        .select()
        .single()

      if (memberError) throw memberError
      return { data: member, error: null }
    } catch (error) {
      console.error('Create local user error:', error)
      return { data: null, error }
    }
  }

  const changeLocalUserPassword = async (memberId, newPassword, adminId) => {
    try {
      // Verify admin has permission
      const { data: admin, error: adminError } = await supabase
        .from('family_members')
        .select('role, family_id')
        .eq('id', adminId)
        .single()

      if (adminError) throw adminError
      if (admin.role !== 'admin') {
        throw new Error('Kun administratorer kan endre passord')
      }

      // Hash new password
      const { data: hashedPassword, error: hashError } = await supabase
        .rpc('hash_password', { password: newPassword })

      if (hashError) throw hashError

      // Update password
      const { error: updateError } = await supabase
        .from('family_members')
        .update({ password_hash: hashedPassword })
        .eq('id', memberId)
        .eq('family_id', admin.family_id)
        .eq('is_local_user', true)

      if (updateError) throw updateError
      return { error: null }
    } catch (error) {
      console.error('Change local user password error:', error)
      return { error }
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
    createFamily,
    createLocalUser,
    changeLocalUserPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}