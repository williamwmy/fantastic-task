import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'
import { mockUser, mockFamily } from '../lib/mockData'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const LOCAL_TEST_USER = import.meta.env.VITE_LOCAL_TEST_USER === 'true';


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (LOCAL_TEST_USER) {
      setUser(mockUser);
      setIsLoading(false);
      return;
    }
    // ...existing Supabase logic...
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setIsLoading(false)
    }
    getInitialSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // MOCKED FUNCTIONS
  const signUp = async (email, password, familyCode = null) => {
    if (LOCAL_TEST_USER) {
      return { data: { user }, error: null };
    }
    // ...existing Supabase logic...
  }

  const signIn = async (email, password) => {
    if (LOCAL_TEST_USER) {
      return { data: { user }, error: null };
    }
    // ...existing Supabase logic...
  }

  const signOut = async () => {
    if (LOCAL_TEST_USER) {
      setUser(null);
      return { error: null };
    }
    // ...existing Supabase logic...
  }

  const resetPassword = async (email) => {
    if (LOCAL_TEST_USER) {
      return { data: null, error: null };
    }
    // ...existing Supabase logic...
  }

  const joinFamilyWithCode = async (code, userId = null) => {
    if (LOCAL_TEST_USER) {
      return { error: null };
    }
    // ...existing Supabase logic...
  }

  const createFamily = async (familyName, userNickname) => {
    if (LOCAL_TEST_USER) {
      return { data: { ...mockFamily, name: familyName }, error: null };
    }
    // ...existing Supabase logic...
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