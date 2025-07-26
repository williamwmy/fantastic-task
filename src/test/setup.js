import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
vi.stubEnv('VITE_LOCAL_TEST_USER', 'false')

// Create a comprehensive Supabase mock with proper chaining
const createMockSupabaseQuery = () => {
  // Create a promise-like object that resolves to Supabase response format
  const createPromiseQuery = (data = {}) => {
    const query = {
      data,
      error: null,
      then: (resolve) => resolve({ data, error: null }),
      catch: (reject) => reject({ data: null, error: null })
    }
    
    // Add all the chainable methods
    const chainableMethods = [
      'select', 'insert', 'update', 'delete', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
      'like', 'ilike', 'is', 'in', 'contains', 'containedBy', 'rangeGt', 'rangeGte',
      'rangeLt', 'rangeLte', 'rangeAdjacent', 'overlaps', 'textSearch', 'match',
      'not', 'or', 'filter', 'order', 'limit', 'range', 'returns'
    ]
    
    chainableMethods.forEach(method => {
      query[method] = vi.fn().mockReturnValue(query)
    })
    
    // Terminal methods that return promises
    query.single = vi.fn().mockResolvedValue({ 
      data: Array.isArray(data) ? data[0] : data, 
      error: null 
    })
    query.maybeSingle = vi.fn().mockResolvedValue({ data, error: null })
    query.csv = vi.fn().mockResolvedValue({ data: '', error: null })
    query.geojson = vi.fn().mockResolvedValue({ data, error: null })
    query.explain = vi.fn().mockResolvedValue({ data, error: null })
    query.rollback = vi.fn().mockResolvedValue({ data, error: null })
    
    return query
  }
  
  return createPromiseQuery()
}

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ 
      data: { 
        session: null
      }, 
      error: null 
    }),
    onAuthStateChange: vi.fn().mockImplementation(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
    signUp: vi.fn().mockResolvedValue({ 
      data: { 
        user: { 
          id: 'test-user-id', 
          email: 'test@example.com' 
        }, 
        session: null 
      }, 
      error: null 
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ 
      data: { 
        user: { 
          id: 'test-user-id', 
          email: 'test@example.com' 
        }, 
        session: {
          user: { 
            id: 'test-user-id', 
            email: 'test@example.com' 
          }
        } 
      }, 
      error: null 
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null })
  },
  from: vi.fn().mockImplementation((table) => {
    // Handle specific table queries that need special responses
    if (table === 'family_invitation_codes') {
      const query = createMockSupabaseQuery([{
        id: 'invite-123',
        family_id: 'family-123',
        code: 'family123',
        used_count: 0,
        max_uses: 10,
        is_active: true,
        expires_at: '2025-12-31T23:59:59.000Z'
      }])
      return query
    }
    if (table === 'family_members') {
      const query = createMockSupabaseQuery(null) // No existing member
      return query
    }
    return createMockSupabaseQuery()
  }),
  rpc: vi.fn().mockImplementation(() => createMockSupabaseQuery()),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      download: vi.fn().mockResolvedValue({ data: null, error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'test-url' } })
    })
  },
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({
      unsubscribe: vi.fn()
    })
  }),
  removeChannel: vi.fn(),
  removeAllChannels: vi.fn(),
  getChannels: vi.fn().mockReturnValue([])
}

vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})