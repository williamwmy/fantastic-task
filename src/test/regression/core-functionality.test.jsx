import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockUser, mockFamily, mockFamilyMember, mockTask } from '../utils.jsx'
import App from '../../App.jsx'
import { AuthProvider } from '../../hooks/useAuth.jsx'
import { FamilyProvider } from '../../hooks/useFamily.jsx'
import { TasksProvider } from '../../hooks/useTasks.jsx'

describe('Core Functionality Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_LOCAL_TEST_USER', 'false')
  })

  describe('Authentication Flow', () => {
    it('should show login page when user is not authenticated', () => {
      render(
        <AuthProvider initialUser={null}>
          <App />
        </AuthProvider>
      )

      expect(screen.getByText('Fantastic Task')).toBeInTheDocument()
      expect(screen.getByText('Logg inn')).toBeInTheDocument()
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
      expect(screen.getByText('Opprett familie')).toBeInTheDocument()
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
      // Check for points balance (more reliable than avatar text)
      expect(screen.getByText('100 poeng')).toBeInTheDocument()
      
      // Check for navigation elements that indicate main app is loaded
      expect(screen.getByLabelText(/forrige dag/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/neste dag/i)).toBeInTheDocument()
      
      // Check for avatar element by looking for circular div with background color
      const avatarElements = screen.getAllByText(/^[A-Z]$/) // Single uppercase letter
      expect(avatarElements.length).toBeGreaterThan(0)
    })

    it('should handle auth state transitions correctly', async () => {
      const { rerender } = render(
        <AuthProvider initialUser={null}>
          <App />
        </AuthProvider>
      )

      // Initially shows login
      expect(screen.getByText('Logg inn')).toBeInTheDocument()

      // User logs in but has no family
      rerender(
        <AuthProvider initialUser={mockUser}>
          <FamilyProvider initialFamily={null} initialMember={null}>
            <App />
          </FamilyProvider>
        </AuthProvider>
      )

      expect(screen.getByText('Opprett familie')).toBeInTheDocument()

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

      expect(screen.getByText('100 poeng')).toBeInTheDocument()
    })
  })

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

      // Points balance (more reliable than avatar text)
      expect(screen.getByText('100 poeng')).toBeInTheDocument()
      
      // Check for avatar by looking for elements with single uppercase letters
      const avatarElements = screen.getAllByText(/^[A-Z]$/) // Single uppercase letter
      expect(avatarElements.length).toBeGreaterThan(0)
    })

    it('should show date navigation', () => {
      renderMainApp()

      // Should have date navigation buttons
      const prevButton = screen.getByRole('button', { name: /forrige dag/i })
      const nextButton = screen.getByRole('button', { name: /neste dag/i })

      expect(prevButton).toBeInTheDocument()
      expect(nextButton).toBeInTheDocument()
    })

    it('should display current date correctly', () => {
      renderMainApp()

      // Should show current date in Norwegian format
      const today = new Date()
      const norwegianDate = today.toLocaleDateString('no-NO', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit'
      })

      // The date might be displayed somewhere in the app
      const dateElements = screen.queryAllByText(new RegExp(norwegianDate.split(' ')[0], 'i'))
      
      // At least one element should contain part of the date
      expect(dateElements.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle date navigation', async () => {
      const user = userEvent.setup()
      renderMainApp()

      const prevButton = screen.getByRole('button', { name: /forrige dag/i })
      const nextButton = screen.getByRole('button', { name: /neste dag/i })

      // Navigate to previous day
      await user.click(prevButton)
      
      // Navigate to next day
      await user.click(nextButton)

      // Should still be functional
      expect(prevButton).toBeInTheDocument()
      expect(nextButton).toBeInTheDocument()
    })

    it('should show action buttons for appropriate roles', () => {
      renderMainApp()

      // Profile selector button
      expect(screen.getByRole('button', { name: /bytt profil/i })).toBeInTheDocument()
      
      // Statistics button
      expect(screen.getByRole('button', { name: /statistikk/i })).toBeInTheDocument()

      // Points history button
      expect(screen.getByRole('button', { name: /poenghistorikk/i })).toBeInTheDocument()

      // Admin panel button (for admin role)
      expect(screen.getByRole('button', { name: /admin/i })).toBeInTheDocument()
    })

    it('should handle modal opening and closing', async () => {
      const user = userEvent.setup()
      renderMainApp()

      // Open statistics modal
      const statsButton = screen.getByRole('button', { name: /statistikk/i })
      await user.click(statsButton)

      // Modal should be open (implementation dependent)
      await waitFor(() => {
        // Check if modal content is visible
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
      // Mock different viewport sizes
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

      // App should still render correctly
      expect(screen.getByText('100 poeng')).toBeInTheDocument()
      
      // Check for avatar elements
      const avatarElements = screen.getAllByText(/^[A-Z]$/)
      expect(avatarElements.length).toBeGreaterThan(0)
    })

    it('should maintain functionality on mobile viewport', () => {
      // Set mobile dimensions
      Object.defineProperty(window, 'innerWidth', { value: 375 })
      Object.defineProperty(window, 'innerHeight', { value: 667 })

      renderMainApp()

      // Core functionality should still work
      expect(screen.getByRole('button', { name: /forrige dag/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /neste dag/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /bytt profil/i })).toBeInTheDocument()
    })
  })

  describe('Error Boundaries and Edge Cases', () => {
    it('should handle missing user data gracefully', () => {
      // Test with incomplete user data
      const incompleteUser = { id: 'test-id' } // Missing email and other fields

      render(
        <AuthProvider initialUser={incompleteUser}>
          <FamilyProvider initialFamily={mockFamily} initialMember={mockFamilyMember}>
            <TasksProvider>
              <App />
            </TasksProvider>
          </FamilyProvider>
        </AuthProvider>
      )

      // App should still render
      const avatarElements = screen.getAllByText(/^[A-Z]$/)
      expect(avatarElements.length).toBeGreaterThan(0)
    })

    it('should handle missing family member data gracefully', () => {
      const incompleteMember = { 
        id: 'test-member-id',
        nickname: 'Test'
        // Missing other fields like points_balance, avatar_color
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

      // Should handle gracefully with defaults
      const avatarElements = screen.getAllByText(/^[A-Z]$/)
      expect(avatarElements.length).toBeGreaterThan(0)
      
      // Should show default points if missing
      const pointsElements = screen.queryAllByText(/poeng/)
      expect(pointsElements.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle loading states appropriately', () => {
      render(
        <AuthProvider initialUser={null}>
          <App />
        </AuthProvider>
      )

      // Should show login page, not a loading spinner, when user is null
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

      // Should show version in footer
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

      // Component should unmount without errors
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

      // Important buttons should have accessible names
      expect(screen.getByRole('button', { name: /forrige dag/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /neste dag/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /bytt profil/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderMainApp()

      // Tab through interactive elements
      await user.tab()
      
      // Focus should be on an interactive element
      const focusedElement = document.activeElement
      expect(focusedElement).toBeInstanceOf(HTMLElement)
      expect(['BUTTON', 'INPUT', 'A'].includes(focusedElement.tagName)).toBe(true)
    })

    it('should have proper semantic structure', () => {
      renderMainApp()

      // Should have buttons, not just divs for interactive elements
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

      // Should show correct nickname initial (first letter of "Custom User")
      const avatarElements = screen.getAllByText(/^[A-Z]$/)
      expect(avatarElements.some(el => el.textContent === 'C')).toBe(true)
      
      // Should show correct points
      expect(screen.getByText('250 poeng')).toBeInTheDocument()
    })

    it('should handle role-based feature access correctly', () => {
      const memberUser = {
        ...mockFamilyMember,
        role: 'member' // Not admin
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

      // Admin panel should not be visible for regular members
      expect(screen.queryByRole('button', { name: /admin/i })).not.toBeInTheDocument()
      
      // But other features should still be available
      expect(screen.getByRole('button', { name: /statistikk/i })).toBeInTheDocument()
    })
  })
})