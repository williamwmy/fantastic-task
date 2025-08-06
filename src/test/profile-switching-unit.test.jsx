import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFamily, FamilyProvider } from '../hooks/useFamily'

// Mock Supabase
vi.mock('../lib/supabase', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      subscribe: vi.fn()
    })),
    removeChannel: vi.fn()
  }
  
  return { supabase: mockSupabase }
})

// Mock auth context
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'parent-user-id',
      email: 'parent@test.com'
    },
    session: { user: { id: 'parent-user-id' } },
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    loading: false
  }),
  AuthProvider: ({ children }) => children
}))

// Mock mock data
vi.mock('../lib/mockData', () => ({
  mockData: {
    family: { id: 'family-id', name: 'Test Familie' },
    currentMember: { id: 'parent-id', nickname: 'Mamma', role: 'admin' },
    familyMembers: [
      { id: 'parent-id', nickname: 'Mamma', role: 'admin', points_balance: 100 },
      { id: 'child-id', nickname: 'Anna', role: 'child', points_balance: 50 }
    ]
  },
  generateMockFamilyCode: vi.fn(() => 'TEST123')
}))

describe('Profile Switching Prevention - Unit Tests', () => {
  const mockParent = {
    id: 'parent-id',
    nickname: 'Mamma', 
    role: 'admin',
    avatar_color: '#82bcf4',
    points_balance: 100,
    family_id: 'family-id'
  }

  const mockChild = {
    id: 'child-id',
    nickname: 'Anna',
    role: 'child', 
    avatar_color: '#ff6b6b',
    points_balance: 50,
    family_id: 'family-id'
  }

  const mockFamily = {
    id: 'family-id',
    name: 'Test Familie',
    family_code: 'ABC123'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_LOCAL_TEST_USER', 'true')
  })

  it('should preserve currently selected profile when refreshing family data', async () => {
    const wrapper = ({ children }) => (
      <FamilyProvider 
        initialFamily={mockFamily} 
        initialMember={mockChild} // Start with child selected
      >
        {children}
      </FamilyProvider>
    )

    const { result } = renderHook(() => useFamily(), { wrapper })

    // Initially should be child
    expect(result.current.currentMember.id).toBe('child-id')
    expect(result.current.currentMember.nickname).toBe('Anna')

    // Mock the refreshed family members data
    const mockSupabase = await import('../lib/supabase')
    mockSupabase.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              { ...mockParent, points_balance: 120 }, // Parent with updated points
              { ...mockChild, points_balance: 60 }   // Child with updated points
            ],
            error: null
          })
        })
      })
    })

    // Call refreshFamilyData
    await act(async () => {
      await result.current.refreshFamilyData()
    })

    // Should still be viewing as child, but with updated data
    expect(result.current.currentMember.id).toBe('child-id') 
    expect(result.current.currentMember.nickname).toBe('Anna')
    expect(result.current.currentMember.points_balance).toBe(60) // Updated points
    
    // Family members should be updated
    expect(result.current.familyMembers).toHaveLength(2)
    expect(result.current.familyMembers.find(m => m.id === 'parent-id').points_balance).toBe(120)
    expect(result.current.familyMembers.find(m => m.id === 'child-id').points_balance).toBe(60)
  })

  it('should not reset to authenticated user when refreshing data', async () => {
    // Start with manually selected child profile
    const wrapper = ({ children }) => (
      <FamilyProvider 
        initialFamily={mockFamily} 
        initialMember={mockChild}
      >
        {children}
      </FamilyProvider>
    )

    const { result } = renderHook(() => useFamily(), { wrapper })

    // Verify starting state
    expect(result.current.currentMember.id).toBe('child-id')

    // Mock fresh family data from database  
    const mockSupabase = await import('../lib/supabase')
    mockSupabase.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockParent, mockChild],
            error: null
          })
        })
      })
    })

    // Refresh family data (this simulates what happens after task completion)
    await act(async () => {
      await result.current.refreshFamilyData()
    })

    // Critical test: should still be child profile, not reset to parent (authenticated user)
    expect(result.current.currentMember.id).toBe('child-id')
    expect(result.current.currentMember.nickname).toBe('Anna')
    
    // Should NOT have switched to parent
    expect(result.current.currentMember.nickname).not.toBe('Mamma')
  })

  it('should handle case when current member no longer exists in family', async () => {
    const wrapper = ({ children }) => (
      <FamilyProvider 
        initialFamily={mockFamily} 
        initialMember={mockChild}
      >
        {children}
      </FamilyProvider>
    )

    const { result } = renderHook(() => useFamily(), { wrapper })

    // Mock family data without the current member (child was removed)
    const mockSupabase = await import('../lib/supabase')
    mockSupabase.supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockParent], // Only parent remains
            error: null
          })
        })
      })
    })

    await act(async () => {
      await result.current.refreshFamilyData()
    })

    // Should still have the old current member data (graceful degradation)
    // In a real app, you might want to switch to null or a default member
    expect(result.current.currentMember.id).toBe('child-id')
    expect(result.current.familyMembers).toHaveLength(1) // Only parent in family now
  })
})