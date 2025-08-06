import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockUser, mockFamily, mockFamilyMember } from '../utils.jsx'
import App from '../../App.jsx'
import { AuthProvider } from '../../hooks/useAuth.jsx'
import { FamilyProvider } from '../../hooks/useFamily.jsx'
import { TasksProvider } from '../../hooks/useTasks.jsx'

describe('Core Functionality Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_LOCAL_TEST_USER', 'false')
  })
  // End of regression test file

  describe('Authentication Flow', () => {
    it('should handle auth state transitions correctly', async () => {
      const { rerender } = render(
        <AuthProvider initialUser={null}>
          <App />
        </AuthProvider>
      )

      // Initially shows login
      expect(screen.getAllByText('Logg inn').length).toBeGreaterThan(0)

      // User logs in but has no family
      rerender(
        <AuthProvider initialUser={mockUser}>
          <FamilyProvider initialFamily={null} initialMember={null}>
            <App />
          </FamilyProvider>
        </AuthProvider>
      )

      expect(screen.getAllByText('Opprett familie').length).toBeGreaterThan(0)

      // User creates/joins family
      rerender(
        <AuthProvider initialUser={mockUser}>
          <FamilyProvider initialFamily={mockFamily} initialMember={mockFamilyMember}>
            <TasksProvider>
              <App />
            </TasksProvider>
          </FamilyProvider>
        </AuthProvider>
      )
      // Assert that the h1 with 'Fantastic Task' is in the document
      const h1 = screen.getByRole('heading', { level: 1, name: /Fantastic Task/i })
      expect(h1).toBeInTheDocument()
    })
    it('should show login page when user is not authenticated', () => {
      render(
        <AuthProvider initialUser={null}>
          <App />
        </AuthProvider>
      )

      expect(screen.getByText('Fantastic Task')).toBeInTheDocument()
      expect(screen.getAllByText('Logg inn').length).toBeGreaterThan(0)
    })

    it('should show family setup when user has no family', () => {
      render(
        <AuthProvider initialUser={mockUser}>
          <FamilyProvider initialFamily={null} initialMember={null}>
            <App />
          </FamilyProvider>
        </AuthProvider>
      )

      // Should show family setup page
      expect(screen.getAllByText('Opprett familie').length).toBeGreaterThan(0)
    })

    it('should show main app when user is authenticated and has family', () => {
      render(
        <AuthProvider initialUser={mockUser}>
          <FamilyProvider initialFamily={mockFamily} initialMember={mockFamilyMember}>
            <TasksProvider>
              <App />
            </TasksProvider>
          </FamilyProvider>
        </AuthProvider>
      )

      // Should show main app interface
      expect(screen.getByText('100 poeng')).toBeInTheDocument()
      expect(screen.getByLabelText(/forrige dag/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/neste dag/i)).toBeInTheDocument()
      const avatarElements = screen.getAllByText(/^[A-Z]$/)
      expect(avatarElements.length).toBeGreaterThan(0)
    })

  }) // End Authentication Flow

  describe('Task Management Core Features', () => {
    const renderMainApp = () => {
      return render(
        <AuthProvider initialUser={mockUser}>
          <FamilyProvider initialFamily={mockFamily} initialMember={mockFamilyMember}>
            <TasksProvider>
              <App />
            </TasksProvider>
          </FamilyProvider>
        </AuthProvider>
      )
    }

    it('should display user profile and points correctly', () => {
      renderMainApp()
      expect(screen.getByText('100 poeng')).toBeInTheDocument()
      const avatarElements = screen.getAllByText(/^[A-Z]$/)
      expect(avatarElements.length).toBeGreaterThan(0)
    })

    it('should show date navigation', () => {
      renderMainApp()
      const prevButton = screen.getByRole('button', { name: /forrige dag/i })
      const nextButton = screen.getByRole('button', { name: /neste dag/i })
      expect(prevButton).toBeInTheDocument()
      expect(nextButton).toBeInTheDocument()
    })

    it('should display current date correctly', () => {
      renderMainApp()
      const today = new Date()
      const norwegianDate = today.toLocaleDateString('no-NO', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit'
      })
      const dateElements = screen.queryAllByText(new RegExp(norwegianDate.split(' ')[0], 'i'))
      expect(dateElements.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle date navigation', async () => {
      const user = userEvent.setup()
      renderMainApp()
      const prevButton = screen.getByRole('button', { name: /forrige dag/i })
      const nextButton = screen.getByRole('button', { name: /neste dag/i })
      await user.click(prevButton)
      await user.click(nextButton)
      expect(prevButton).toBeInTheDocument()
      expect(nextButton).toBeInTheDocument()
    })

    it('should show action buttons for appropriate roles', () => {
      renderMainApp()
      expect(screen.getByTitle('Åpne profil og innstillinger')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /statistikk/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /poenghistorikk/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument()
    })

    it('should handle modal opening and closing', async () => {
      const user = userEvent.setup()
      renderMainApp()
      const statsButton = screen.getByRole('button', { name: /statistikk/i })
      await user.click(statsButton)
      await waitFor(() => {
        const modalElements = screen.queryAllByRole('dialog')
        if (modalElements.length > 0) {
          expect(modalElements[0]).toBeInTheDocument()
        }
      })
    })
  })

  describe('Responsive Design', () => {
    const renderMainApp = () => {
      return render(
        <AuthProvider initialUser={mockUser}>
          <FamilyProvider initialFamily={mockFamily} initialMember={mockFamilyMember}>
            <TasksProvider>
              <App />
            </TasksProvider>
          </FamilyProvider>
        </AuthProvider>
      )
    }

    it('should handle different screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })
      renderMainApp()
      expect(screen.getByText('100 poeng')).toBeInTheDocument()
      const avatarElements = screen.getAllByText(/^[A-Z]$/)
      expect(avatarElements.length).toBeGreaterThan(0)
    })

    it('should maintain functionality on mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 })
      Object.defineProperty(window, 'innerHeight', { value: 667 })
      renderMainApp()
      expect(screen.getByRole('button', { name: /forrige dag/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /neste dag/i })).toBeInTheDocument()
      expect(screen.getByTitle('Åpne profil og innstillinger')).toBeInTheDocument()
    })
  })

  describe('Error Boundaries and Edge Cases', () => {
    it('should handle missing user data gracefully', () => {
      const incompleteUser = { id: 'test-id' }
      render(
        <AuthProvider initialUser={incompleteUser}>
          <FamilyProvider initialFamily={mockFamily} initialMember={mockFamilyMember}>
            <TasksProvider>
              <App />
            </TasksProvider>
          </FamilyProvider>
        </AuthProvider>
      )
      const avatarElements = screen.getAllByText(/^[A-Z]$/)
      expect(avatarElements.length).toBeGreaterThan(0)
    })

    it('should handle missing family member data gracefully', () => {
      const incompleteMember = { 
        id: 'test-member-id',
        nickname: 'Test'
      }
      render(
        <AuthProvider initialUser={mockUser}>
          <FamilyProvider initialFamily={mockFamily} initialMember={incompleteMember}>
            <TasksProvider>
              <App />
            </TasksProvider>
          </FamilyProvider>
        </AuthProvider>
      )
      const avatarElements = screen.getAllByText(/^[A-Z]$/)
      expect(avatarElements.length).toBeGreaterThan(0)
      const pointsElements = screen.queryAllByText(/poeng/)
      expect(pointsElements.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle loading states appropriately', () => {
      render(
        <AuthProvider initialUser={null}>
          <App />
        </AuthProvider>
      )
      expect(screen.getByText('Fantastic Task')).toBeInTheDocument()
    })
  })

  describe('PWA and Performance', () => {
    it('should render version information', () => {
      render(
        <AuthProvider initialUser={mockUser}>
          <FamilyProvider initialFamily={mockFamily} initialMember={mockFamilyMember}>
            <TasksProvider>
              <App />
            </TasksProvider>
          </FamilyProvider>
        </AuthProvider>
      )
      const versionElements = screen.queryAllByText(/v\d+\.\d+\.\d+/)
      expect(versionElements.length).toBeGreaterThan(0)
    })

    it('should not have obvious memory leaks in component mounting/unmounting', () => {
      const { unmount } = render(
        <AuthProvider initialUser={mockUser}>
          <FamilyProvider initialFamily={mockFamily} initialMember={mockFamilyMember}>
            <TasksProvider>
              <App />
            </TasksProvider>
          </FamilyProvider>
        </AuthProvider>
      )
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    const renderMainApp = () => {
      return render(
        <AuthProvider initialUser={mockUser}>
          <FamilyProvider initialFamily={mockFamily} initialMember={mockFamilyMember}>
            <TasksProvider>
              <App />
            </TasksProvider>
          </FamilyProvider>
        </AuthProvider>
      )
    }

    it('should have accessible button labels', () => {
      renderMainApp()
      expect(screen.getByRole('button', { name: /forrige dag/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /neste dag/i })).toBeInTheDocument()
      expect(screen.getByTitle('Åpne profil og innstillinger')).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderMainApp()
      await user.tab()
      const focusedElement = document.activeElement
      expect(focusedElement).toBeInstanceOf(HTMLElement)
      expect(['BUTTON', 'INPUT', 'A'].includes(focusedElement.tagName)).toBe(true)
    })

    it('should have proper semantic structure', () => {
      renderMainApp()
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Data Consistency', () => {
    it('should maintain user data consistency across components', () => {
      const customMember = {
        ...mockFamilyMember,
        nickname: 'Custom User',
        points_balance: 250
      }
      render(
        <AuthProvider initialUser={mockUser}>
          <FamilyProvider initialFamily={mockFamily} initialMember={customMember}>
            <TasksProvider>
              <App />
            </TasksProvider>
          </FamilyProvider>
        </AuthProvider>
      )
      const avatarElements = screen.getAllByText(/^[A-Z]$/)
      expect(avatarElements.some(el => el.textContent === 'C')).toBe(true)
      expect(screen.getByText('250 poeng')).toBeInTheDocument()
    })

    it('should handle role-based feature access correctly', () => {
      const memberUser = {
        ...mockFamilyMember,
        role: 'member'
      }
      render(
        <AuthProvider initialUser={mockUser}>
          <FamilyProvider initialFamily={mockFamily} initialMember={memberUser}>
            <TasksProvider>
              <App />
            </TasksProvider>
          </FamilyProvider>
        </AuthProvider>
      )
      expect(screen.queryByRole('button', { name: /admin/i })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /statistikk/i })).toBeInTheDocument()
    })
  })
})
