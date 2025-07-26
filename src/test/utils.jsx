import React from 'react'
import { render } from '@testing-library/react'
import { AuthProvider } from '../hooks/useAuth.jsx'
import { FamilyProvider } from '../hooks/useFamily.jsx'
import { TasksProvider } from '../hooks/useTasks.jsx'

// Test data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2023-01-01T00:00:00.000Z'
}

export const mockFamily = {
  id: 'test-family-id',
  name: 'Test Familie',
  created_by: 'test-user-id',
  created_at: '2023-01-01T00:00:00.000Z'
}

export const mockFamilyMember = {
  id: 'test-member-id',
  family_id: 'test-family-id',
  user_id: 'test-user-id',
  nickname: 'Test User',
  role: 'admin',
  avatar_color: '#82bcf4',
  points_balance: 100,
  created_at: '2023-01-01T00:00:00.000Z'
}

export const mockTask = {
  id: 'test-task-id',
  family_id: 'test-family-id',
  title: 'Test Oppgave',
  description: 'En test oppgave',
  points: 10,
  days: [1, 2, 3, 4, 5], // Weekdays
  recurring_type: 'daily',
  flexible_interval: null,
  created_by: 'test-user-id',
  created_at: '2023-01-01T00:00:00.000Z'
}

export const mockTaskAssignment = {
  id: 'test-assignment-id',
  task_id: 'test-task-id',
  assigned_to: 'test-member-id',
  date: '2023-01-01',
  is_completed: false,
  created_at: '2023-01-01T00:00:00.000Z'
}

export const mockTaskCompletion = {
  id: 'test-completion-id',
  assignment_id: 'test-assignment-id',
  completed_by: 'test-member-id',
  completed_at: '2023-01-01T12:00:00.000Z',
  time_spent_minutes: 30,
  comment: 'Ferdig!',
  verification_status: 'approved'
}

// Custom render function with providers
export function renderWithProviders(ui, options = {}) {
  const {
    initialUser = mockUser,
    initialFamily = mockFamily,
    initialMember = mockFamilyMember,
    ...renderOptions
  } = options

  function Wrapper({ children }) {
    return (
      <AuthProvider initialUser={initialUser}>
        <FamilyProvider initialFamily={initialFamily} initialMember={initialMember}>
          <TasksProvider>
            {children}
          </TasksProvider>
        </FamilyProvider>
      </AuthProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Helper to create test props
export function createTestProps(overrides = {}) {
  return {
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides
  }
}

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock localStorage
export const mockLocalStorage = (() => {
  let store = {}
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn(key => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})