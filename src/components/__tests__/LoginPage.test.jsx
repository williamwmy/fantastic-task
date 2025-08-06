import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../LoginPage.jsx'
import { AuthProvider } from '../../hooks/useAuth.jsx'

// Mock useAuth hook
const mockAuthMethods = {
  signIn: vi.fn(),
  signUp: vi.fn(),
  resetPassword: vi.fn(),
  createFamily: vi.fn(),
  joinFamilyWithCode: vi.fn()
}

vi.mock('../../hooks/useAuth.jsx', async () => {
  const actual = await vi.importActual('../../hooks/useAuth.jsx')
  return {
    ...actual,
    useAuth: () => mockAuthMethods
  }
})

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderLoginPage = (initialMode = 'signin') => {
    return render(<LoginPage initialMode={initialMode} />)
  }

  describe('Initial Render', () => {
    it('should render the app branding', () => {
      renderLoginPage()
      
      expect(screen.getByText('Fantastic Task')).toBeInTheDocument()
      expect(screen.getByText(/En familie-oppgaveapp/)).toBeInTheDocument()
      expect(screen.getByText(/Hele familien/)).toBeInTheDocument()
      expect(screen.getByText(/Poeng & belønninger/)).toBeInTheDocument()
      expect(screen.getByText(/Fleksible oppgaver/)).toBeInTheDocument()
    })

    it('should render version information', () => {
      renderLoginPage()
      
      expect(screen.getByText(/Versjon/)).toBeInTheDocument()
    })

    it('should render mode tabs', () => {
      renderLoginPage()
      
      // Use getAllByText to handle multiple buttons with same text
      expect(screen.getAllByText('Logg inn').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Registrer').length).toBeGreaterThan(0)
      expect(screen.getByText('Glemt passord?')).toBeInTheDocument()
      expect(screen.getAllByText('Opprett familie').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Bli med i familie').length).toBeGreaterThan(0)
    })

    it('should start with signin mode by default', () => {
      renderLoginPage()
      
      // Check for form elements that indicate signin mode
      expect(screen.getByPlaceholderText('din@email.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Ditt passord')).toBeInTheDocument()
      
      // Check that there's at least one "Logg inn" button
      const loginButtons = screen.getAllByRole('button', { name: 'Logg inn' })
      expect(loginButtons.length).toBeGreaterThan(0)
    })

    it('should start with specified initial mode', () => {
      renderLoginPage('create-family')
      
      // Check for form elements that indicate create-family mode
      expect(screen.getByPlaceholderText('F.eks. Familie Hansen')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('F.eks. Mamma, Pappa, Ole')).toBeInTheDocument()
      
      // Check that there's at least one "Opprett familie" button
      const createFamilyButtons = screen.getAllByRole('button', { name: 'Opprett familie' })
      expect(createFamilyButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Mode Switching', () => {
    it('should switch to signup mode', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      
      await user.click(screen.getByText('Registrer'))
      
      // Check that we're in signup mode by looking for unique elements
      expect(screen.getByPlaceholderText('Bekreft passord')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Registrer deg' })).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Skriv inn familiekode (valgfritt)')).toBeInTheDocument()
    })

    it('should switch to reset password mode', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      
      await user.click(screen.getByText('Glemt passord?'))
      
      expect(screen.getByRole('button', { name: 'Send reset-link' })).toBeInTheDocument()
      expect(screen.getByPlaceholderText('din@email.com')).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Ditt passord')).not.toBeInTheDocument()
    })

    it('should switch to create family mode', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      
      await user.click(screen.getByText('Opprett familie'))
      
      const createFamilyButtons = screen.getAllByRole('button', { name: 'Opprett familie' })
      expect(createFamilyButtons.length).toBeGreaterThan(0)
      expect(screen.getByPlaceholderText('F.eks. Familie Hansen')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('F.eks. Mamma, Pappa, Ole')).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('din@email.com')).not.toBeInTheDocument()
    })

    it('should switch to join family mode', async () => {
      const user = userEvent.setup()
      renderLoginPage()
      
      await user.click(screen.getByText('Bli med i familie'))
      
      const joinButtons = screen.getAllByRole('button', { name: 'Bli med i familie' })
      expect(joinButtons.length).toBeGreaterThan(0)
      expect(screen.getByPlaceholderText('Skriv inn familiekoden')).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('din@email.com')).not.toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    describe('Sign In', () => {
      it('should handle successful sign in', async () => {
        const user = userEvent.setup()
        mockAuthMethods.signIn.mockResolvedValue({ error: null })
        
        renderLoginPage()
        
        await user.type(screen.getByPlaceholderText('din@email.com'), 'test@example.com')
        await user.type(screen.getByPlaceholderText('Ditt passord'), 'password123')
        const loginButtons = screen.getAllByRole('button', { name: 'Logg inn' })
        await user.click(loginButtons[loginButtons.length - 1])
        
        expect(mockAuthMethods.signIn).toHaveBeenCalledWith('test@example.com', 'password123')
      })

      it('should handle sign in error', async () => {
        const user = userEvent.setup()
        mockAuthMethods.signIn.mockResolvedValue({ 
          error: { message: 'Invalid credentials' } 
        })
        
        renderLoginPage()
        
        await user.type(screen.getByPlaceholderText('din@email.com'), 'test@example.com')
        await user.type(screen.getByPlaceholderText('Ditt passord'), 'wrongpassword')
        const loginButtons = screen.getAllByRole('button', { name: 'Logg inn' })
        await user.click(loginButtons[loginButtons.length - 1])

        await waitFor(() => {
          expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
        })
      })

      it('should toggle password visibility', async () => {
        const user = userEvent.setup()
        renderLoginPage()
        
        const passwordInput = screen.getByPlaceholderText('Ditt passord')
        const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button
        
        expect(passwordInput).toHaveAttribute('type', 'password')
        
        await user.click(toggleButton)
        expect(passwordInput).toHaveAttribute('type', 'text')
        
        await user.click(toggleButton)
        expect(passwordInput).toHaveAttribute('type', 'password')
      })
    })

    describe('Sign Up', () => {
      it('should handle successful sign up', async () => {
        const user = userEvent.setup()
        mockAuthMethods.signUp.mockResolvedValue({ error: null })
        
        renderLoginPage()
        await user.click(screen.getByText('Registrer'))
        
        await user.type(screen.getByPlaceholderText('din@email.com'), 'test@example.com')
        await user.type(screen.getByPlaceholderText('Ditt passord'), 'password123')
        await user.type(screen.getByPlaceholderText('Bekreft passord'), 'password123')
        await user.click(screen.getByRole('button', { name: 'Registrer deg' }))
        
        expect(mockAuthMethods.signUp).toHaveBeenCalledWith('test@example.com', 'password123', null)
        
        await waitFor(() => {
          expect(screen.getByText('Registrering vellykket! Du kan nå logge inn.')).toBeInTheDocument()
        })
      })

      it('should handle password mismatch', async () => {
        const user = userEvent.setup()
        
        renderLoginPage()
        await user.click(screen.getByText('Registrer'))
        
        await user.type(screen.getByPlaceholderText('din@email.com'), 'test@example.com')
        await user.type(screen.getByPlaceholderText('Ditt passord'), 'password123')
        await user.type(screen.getByPlaceholderText('Bekreft passord'), 'password456')
        await user.click(screen.getByRole('button', { name: 'Registrer deg' }))
        
        await waitFor(() => {
          expect(screen.getByText('Passordene stemmer ikke overens')).toBeInTheDocument()
        })
        
        expect(mockAuthMethods.signUp).not.toHaveBeenCalled()
      })

      it('should include family code when provided', async () => {
        const user = userEvent.setup()
        mockAuthMethods.signUp.mockResolvedValue({ error: null })
        
        renderLoginPage()
        await user.click(screen.getByText('Registrer'))
        
        await user.type(screen.getByPlaceholderText('din@email.com'), 'test@example.com')
        await user.type(screen.getByPlaceholderText('Ditt passord'), 'password123')
        await user.type(screen.getByPlaceholderText('Bekreft passord'), 'password123')
        await user.type(screen.getByPlaceholderText('Skriv inn familiekode (valgfritt)'), 'FAMILY123')
        await user.click(screen.getByRole('button', { name: 'Registrer deg' }))
        
        expect(mockAuthMethods.signUp).toHaveBeenCalledWith('test@example.com', 'password123', 'FAMILY123')
      })
    })

    describe('Reset Password', () => {
      it('should handle password reset', async () => {
        const user = userEvent.setup()
        mockAuthMethods.resetPassword.mockResolvedValue({ error: null })
        
        renderLoginPage()
        await user.click(screen.getByText('Glemt passord?'))
        
        await user.type(screen.getByPlaceholderText('din@email.com'), 'test@example.com')
        await user.click(screen.getByRole('button', { name: 'Send reset-link' }))
        
        expect(mockAuthMethods.resetPassword).toHaveBeenCalledWith('test@example.com')
        
        await waitFor(() => {
          expect(screen.getByText('Passord-reset link sendt til din e-post!')).toBeInTheDocument()
        })
      })
    })

    describe('Create Family', () => {
      it('should handle family creation', async () => {
        const user = userEvent.setup()
        mockAuthMethods.createFamily.mockResolvedValue({ error: null })
        
        renderLoginPage()
        await user.click(screen.getByText('Opprett familie'))
        
        await user.type(screen.getByPlaceholderText('F.eks. Familie Hansen'), 'Familie Test')
        await user.type(screen.getByPlaceholderText('F.eks. Mamma, Pappa, Ole'), 'Test Bruker')
        
        const buttons = screen.getAllByRole('button', { name: 'Opprett familie' })
        await user.click(buttons[buttons.length - 1])
        
        expect(mockAuthMethods.createFamily).toHaveBeenCalledWith('Familie Test', 'Test Bruker')
        
        await waitFor(() => {
          expect(screen.getByText('Familie opprettet! Du kan nå invitere andre medlemmer.')).toBeInTheDocument()
        })
      })
    })

    describe('Join Family', () => {
      it('should handle joining family', async () => {
        const user = userEvent.setup()
        mockAuthMethods.joinFamilyWithCode.mockResolvedValue({ error: null })
        
        renderLoginPage()
        await user.click(screen.getByText('Bli med i familie'))
        
        await user.type(screen.getByPlaceholderText('Skriv inn familiekoden'), 'FAMILY123')
        
        // Use more specific selector for the submit button
        const buttons = screen.getAllByRole('button', { name: 'Bli med i familie' })
        await user.click(buttons[buttons.length - 1]) // Click the submit button, not the tab
        
        expect(mockAuthMethods.joinFamilyWithCode).toHaveBeenCalledWith('FAMILY123')
        
        await waitFor(() => {
          expect(screen.getByText('Du har blitt lagt til i familien!')).toBeInTheDocument()
        })
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state during form submission', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      mockAuthMethods.signIn.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      )
      
      renderLoginPage()
      
      await user.type(screen.getByPlaceholderText('din@email.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Ditt passord'), 'password123')
      const loginButtons = screen.getAllByRole('button', { name: 'Logg inn' })
      const submitButton = loginButtons[loginButtons.length - 1]
      await user.click(submitButton)
      
      expect(screen.getByText('Behandler...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      
      await waitFor(() => {
        const refreshedButtons = screen.getAllByRole('button', { name: 'Logg inn' })
        expect(refreshedButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Error Handling', () => {
    it('should clear errors when switching modes', async () => {
      const user = userEvent.setup()
      mockAuthMethods.signIn.mockResolvedValue({ 
        error: { message: 'Test error' } 
      })
      
      renderLoginPage()
      
      // Trigger an error
      await user.type(screen.getByPlaceholderText('din@email.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Ditt passord'), 'password123')
      const loginButtons = screen.getAllByRole('button', { name: 'Logg inn' })
      await user.click(loginButtons[loginButtons.length - 1])
      
      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument()
      })
      
      // Switch modes
      await user.click(screen.getByText('Registrer'))
      
      expect(screen.queryByText('Test error')).not.toBeInTheDocument()
    })

    it('should clear errors when typing in form fields', async () => {
      const user = userEvent.setup()
      mockAuthMethods.signIn.mockResolvedValue({ 
        error: { message: 'Test error' } 
      })
      
      renderLoginPage()
      
      // Trigger an error
      await user.type(screen.getByPlaceholderText('din@email.com'), 'test@example.com')
      await user.type(screen.getByPlaceholderText('Ditt passord'), 'password123')
      const loginButtons = screen.getAllByRole('button', { name: 'Logg inn' })
      await user.click(loginButtons[loginButtons.length - 1])
      
      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument()
      })
      
      // Type in email field
      await user.type(screen.getByPlaceholderText('din@email.com'), 'x')
      
      expect(screen.queryByText('Test error')).not.toBeInTheDocument()
    })
  })
})