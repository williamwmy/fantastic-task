import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../useAuth.jsx'
import { supabase } from '../../lib/supabase'

// Mock the supabase module
vi.mock('../../lib/supabase')

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_LOCAL_TEST_USER', 'false')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Authentication Provider', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.user).toBe(null)
    })

    it('should handle session initialization', async () => {
      const mockSession = {
        user: { id: 'test-user', email: 'test@example.com' }
      }

      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toEqual(mockSession.user)
    })

    it('should handle auth state changes', async () => {
      let authStateCallback
      
      supabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: vi.fn() } }
        }
      })

      supabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Simulate auth state change
      const newUser = { id: 'new-user', email: 'new@example.com' }
      act(() => {
        authStateCallback('SIGNED_IN', { user: newUser })
      })

      expect(result.current.user).toEqual(newUser)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Authentication Methods', () => {
    let wrapper

    beforeEach(() => {
      wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    })

    describe('signUp', () => {
      it('should successfully sign up a user', async () => {
        const mockUser = { id: 'new-user', email: 'test@example.com' }
        supabase.auth.signUp.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        let signUpResult
        await act(async () => {
          signUpResult = await result.current.signUp('test@example.com', 'password123')
        })

        expect(supabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            data: {
              family_code: null
            }
          }
        })
        expect(signUpResult).toEqual({ data: { user: mockUser }, error: null })
      })

      it('should handle sign up with family code', async () => {
        const mockUser = { id: 'new-user', email: 'test@example.com' }
        supabase.auth.signUp.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        await act(async () => {
          await result.current.signUp('test@example.com', 'password123', 'family123')
        })

        expect(supabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            data: {
              family_code: 'family123'
            }
          }
        })
      })

      it('should handle sign up errors', async () => {
        const mockError = new Error('Sign up failed')
        supabase.auth.signUp.mockRejectedValue(mockError)

        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        let signUpResult
        await act(async () => {
          signUpResult = await result.current.signUp('test@example.com', 'password123')
        })

        expect(signUpResult).toEqual({ data: null, error: mockError })
      })
    })

    describe('signIn', () => {
      it('should successfully sign in a user', async () => {
        const mockUser = { id: 'user-123', email: 'test@example.com' }
        supabase.auth.signInWithPassword.mockResolvedValue({
          data: { user: mockUser },
          error: null
        })

        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        let signInResult
        await act(async () => {
          signInResult = await result.current.signIn('test@example.com', 'password123')
        })

        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
        expect(signInResult).toEqual({ data: { user: mockUser }, error: null })
      })

      it('should handle sign in errors', async () => {
        const mockError = new Error('Invalid credentials')
        supabase.auth.signInWithPassword.mockRejectedValue(mockError)

        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        let signInResult
        await act(async () => {
          signInResult = await result.current.signIn('test@example.com', 'wrongpassword')
        })

        expect(signInResult).toEqual({ data: null, error: mockError })
      })
    })

    describe('signOut', () => {
      it('should successfully sign out', async () => {
        supabase.auth.signOut.mockResolvedValue({ error: null })

        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        let signOutResult
        await act(async () => {
          signOutResult = await result.current.signOut()
        })

        expect(supabase.auth.signOut).toHaveBeenCalled()
        expect(signOutResult).toEqual({ error: null })
      })

      it('should handle sign out errors', async () => {
        const mockError = new Error('Sign out failed')
        supabase.auth.signOut.mockRejectedValue(mockError)

        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        let signOutResult
        await act(async () => {
          signOutResult = await result.current.signOut()
        })

        expect(signOutResult).toEqual({ error: mockError })
      })
    })

    describe('resetPassword', () => {
      it('should successfully send reset password email', async () => {
        supabase.auth.resetPasswordForEmail.mockResolvedValue({
          data: {},
          error: null
        })

        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        let resetResult
        await act(async () => {
          resetResult = await result.current.resetPassword('test@example.com')
        })

        expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          { redirectTo: `${window.location.origin}/reset-password` }
        )
        expect(resetResult).toEqual({ data: {}, error: null })
      })

      it('should handle reset password errors', async () => {
        const mockError = new Error('Reset failed')
        supabase.auth.resetPasswordForEmail.mockRejectedValue(mockError)

        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false)
        })

        let resetResult
        await act(async () => {
          resetResult = await result.current.resetPassword('test@example.com')
        })

        expect(resetResult).toEqual({ data: null, error: mockError })
      })
    })
  })

  describe('Local Test Mode', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_LOCAL_TEST_USER', 'true')
    })

    it('should use mock user in local test mode', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeDefined()
      expect(result.current.user.id).toBe('test-user-id')
    })

    it('should return mock responses for auth methods in local mode', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Test signIn
      const signInResult = await result.current.signIn('test@example.com', 'password')
      expect(signInResult.error).toBe(null)

      // Test signUp
      const signUpResult = await result.current.signUp('test@example.com', 'password')
      expect(signUpResult.error).toBe(null)

      // Test resetPassword
      const resetResult = await result.current.resetPassword('test@example.com')
      expect(resetResult.error).toBe(null)
    })
  })
})