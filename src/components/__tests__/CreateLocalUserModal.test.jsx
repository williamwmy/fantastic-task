import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateLocalUserModal from '../CreateLocalUserModal'

// Mock hooks
const mockCreateLocalUser = vi.fn()
const mockLoadFamilyData = vi.fn()

vi.mock('../../hooks/useAuth.jsx', () => ({
  useAuth: () => ({
    createLocalUser: mockCreateLocalUser
  })
}))

vi.mock('../../hooks/useFamily.jsx', () => ({
  useFamily: () => ({
    currentMember: {
      id: 'admin-1',
      family_id: 'family-1',
      nickname: 'Admin User',
      role: 'admin'
    },
    familyMembers: [
      {
        id: 'admin-1',
        username: null,
        nickname: 'Admin User',
        role: 'admin',
        is_local_user: false
      }
    ],
    loadFamilyData: mockLoadFamilyData
  })
}))

describe('CreateLocalUserModal', () => {
  const defaultProps = {
    onClose: vi.fn(),
    onSuccess: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form fields correctly', () => {
    render(<CreateLocalUserModal {...defaultProps} />)
    
    expect(screen.getByText('Opprett ny profil')).toBeInTheDocument()
    expect(screen.getByLabelText(/Brukernavn/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Visningsnavn/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Rolle/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Passord.*[^k]/)).toBeInTheDocument() // "Passord *" not "Bekreft passord *"
    expect(screen.getByLabelText(/Bekreft passord/)).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<CreateLocalUserModal {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: /Opprett bruker/ })
    await user.click(submitButton)
    
    expect(screen.getByText('Brukernavn er påkrevd')).toBeInTheDocument()
  })

  it('should validate password length', async () => {
    const user = userEvent.setup()
    render(<CreateLocalUserModal {...defaultProps} />)
    
    await user.type(screen.getByLabelText(/Brukernavn/), 'testuser')
    await user.type(screen.getByLabelText(/Visningsnavn/), 'Test User')
    await user.type(screen.getByLabelText(/Passord.*[^k]/), '123')
    await user.type(screen.getByLabelText(/Bekreft passord/), '123')
    
    const submitButton = screen.getByRole('button', { name: /Opprett bruker/ })
    await user.click(submitButton)
    
    expect(screen.getByText('Passord må være minst 6 tegn')).toBeInTheDocument()
  })

  it('should validate password confirmation', async () => {
    const user = userEvent.setup()
    render(<CreateLocalUserModal {...defaultProps} />)
    
    await user.type(screen.getByLabelText(/Brukernavn/), 'testuser')
    await user.type(screen.getByLabelText(/Visningsnavn/), 'Test User')
    await user.type(screen.getByLabelText(/Passord.*[^k]/), 'password123')
    await user.type(screen.getByLabelText(/Bekreft passord/), 'different123')
    
    const submitButton = screen.getByRole('button', { name: /Opprett bruker/ })
    await user.click(submitButton)
    
    expect(screen.getByText('Passordene stemmer ikke overens')).toBeInTheDocument()
  })

  it('should prevent @ symbol in username', async () => {
    const user = userEvent.setup()
    render(<CreateLocalUserModal {...defaultProps} />)
    
    await user.type(screen.getByLabelText(/Brukernavn/), 'user@domain.com')
    await user.type(screen.getByLabelText(/Visningsnavn/), 'Test User')
    await user.type(screen.getByLabelText(/Passord.*[^k]/), 'password123')
    await user.type(screen.getByLabelText(/Bekreft passord/), 'password123')
    
    const submitButton = screen.getByRole('button', { name: /Opprett bruker/ })
    await user.click(submitButton)
    
    expect(screen.getByText('Brukernavn kan ikke inneholde @')).toBeInTheDocument()
  })

  it('should create local user successfully', async () => {
    const user = userEvent.setup()
    mockCreateLocalUser.mockResolvedValue({ 
      data: { id: 'new-user-1', username: 'testuser' }, 
      error: null 
    })
    
    render(<CreateLocalUserModal {...defaultProps} />)
    
    await user.type(screen.getByLabelText(/Brukernavn/), 'testuser')
    await user.type(screen.getByLabelText(/Visningsnavn/), 'Test User')
    await user.type(screen.getByLabelText(/Passord.*[^k]/), 'password123')
    await user.type(screen.getByLabelText(/Bekreft passord/), 'password123')
    
    const submitButton = screen.getByRole('button', { name: /Opprett bruker/ })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockCreateLocalUser).toHaveBeenCalledWith(
        'family-1',
        'testuser',
        'password123',
        'Test User',
        'member',
        'admin-1'
      )
    })
    
    expect(mockLoadFamilyData).toHaveBeenCalled()
    expect(defaultProps.onSuccess).toHaveBeenCalled()
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('should toggle password visibility', async () => {
    const user = userEvent.setup()
    render(<CreateLocalUserModal {...defaultProps} />)
    
    const passwordInput = screen.getByLabelText(/Passord.*[^k]/)
    const toggleButton = passwordInput.parentElement.querySelector('button')
    
    expect(passwordInput.type).toBe('password')
    
    await user.click(toggleButton)
    expect(passwordInput.type).toBe('text')
    
    await user.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })
})