import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import React from 'react'

// Mock App component to isolate avatar functionality
const MockAppWithAvatar = ({ currentMember, onAvatarClick }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem"
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {/* Profile circle - clickable to open profile selector */}
      <button
        onClick={onAvatarClick}
        title="Åpne profil og innstillinger"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: currentMember.avatar_color || "#82bcf4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 700,
          fontSize: 18,
          border: "none",
          cursor: "pointer",
          transition: "all 0.2s ease"
        }}
        onMouseOver={(e) => {
          e.target.style.transform = "scale(1.05)"
          e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)"
        }}
        onMouseOut={(e) => {
          e.target.style.transform = "scale(1)"
          e.target.style.boxShadow = "none"
        }}
        data-testid="avatar-button"
      >
        {currentMember.nickname && currentMember.nickname[0] ? currentMember.nickname[0].toUpperCase() : '?'}
      </button>
      
      {/* Points display */}
      <div style={{ 
        padding: "0.25rem 0.5rem", 
        background: "#6c757d", 
        borderRadius: "1rem",
        fontWeight: 600,
        fontSize: "0.875rem",
        color: "white"
      }}>
        {currentMember.points_balance} poeng
      </div>
    </div>
  </div>
)

describe('Avatar Click Functionality', () => {
  let user
  const mockCurrentMember = {
    id: 'test-member-1',
    nickname: 'Test User',
    avatar_color: '#82bcf4',
    role: 'admin',
    points_balance: 150
  }

  beforeEach(() => {
    user = userEvent.setup()
  })

  it('should render avatar button with correct initials', () => {
    const mockOnClick = vi.fn()
    render(<MockAppWithAvatar currentMember={mockCurrentMember} onAvatarClick={mockOnClick} />)
    
    const avatar = screen.getByTestId('avatar-button')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveTextContent('T') // First letter of "Test User"
  })

  it('should have correct styling for avatar button', () => {
    const mockOnClick = vi.fn()
    render(<MockAppWithAvatar currentMember={mockCurrentMember} onAvatarClick={mockOnClick} />)
    
    const avatar = screen.getByTestId('avatar-button')
    
    expect(avatar).toHaveStyle({
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: '#82bcf4',
      cursor: 'pointer'
    })
    
    // Check that it's a button element
    expect(avatar.tagName).toBe('BUTTON')
  })

  it('should call onAvatarClick when avatar is clicked', async () => {
    const mockOnClick = vi.fn()
    render(<MockAppWithAvatar currentMember={mockCurrentMember} onAvatarClick={mockOnClick} />)
    
    const avatar = screen.getByTestId('avatar-button')
    await user.click(avatar)
    
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should display correct points balance', () => {
    const mockOnClick = vi.fn()
    render(<MockAppWithAvatar currentMember={mockCurrentMember} onAvatarClick={mockOnClick} />)
    
    expect(screen.getByText('150 poeng')).toBeInTheDocument()
  })

  it('should use default color when avatar_color is not provided', () => {
    const memberWithoutColor = { ...mockCurrentMember, avatar_color: null }
    const mockOnClick = vi.fn()
    render(<MockAppWithAvatar currentMember={memberWithoutColor} onAvatarClick={mockOnClick} />)
    
    const avatar = screen.getByTestId('avatar-button')
    expect(avatar).toHaveStyle({ background: '#82bcf4' })
  })

  it('should handle different avatar colors', () => {
    const memberWithDifferentColor = { ...mockCurrentMember, avatar_color: '#ff6b6b' }
    const mockOnClick = vi.fn()
    render(<MockAppWithAvatar currentMember={memberWithDifferentColor} onAvatarClick={mockOnClick} />)
    
    const avatar = screen.getByTestId('avatar-button')
    expect(avatar).toHaveStyle({ background: '#ff6b6b' })
  })

  it('should handle different nicknames correctly', () => {
    const memberWithDifferentName = { ...mockCurrentMember, nickname: 'Anders Andersen' }
    const mockOnClick = vi.fn()
    render(<MockAppWithAvatar currentMember={memberWithDifferentName} onAvatarClick={mockOnClick} />)
    
    const avatar = screen.getByTestId('avatar-button')
    expect(avatar).toHaveTextContent('A') // First letter of "Anders Andersen"
  })

  it('should apply hover effects correctly', async () => {
    const mockOnClick = vi.fn()
    render(<MockAppWithAvatar currentMember={mockCurrentMember} onAvatarClick={mockOnClick} />)
    
    const avatar = screen.getByTestId('avatar-button')
    
    // Test hover effect
    fireEvent.mouseOver(avatar)
    await waitFor(() => {
      expect(avatar.style.transform).toBe('scale(1.05)')
      expect(avatar.style.boxShadow).toBe('0 2px 8px rgba(0,0,0,0.2)')
    })
    
    // Test mouse out effect
    fireEvent.mouseOut(avatar)
    await waitFor(() => {
      expect(avatar.style.transform).toBe('scale(1)')
      expect(avatar.style.boxShadow).toBe('none')
    })
  })

  it('should have correct accessibility attributes', () => {
    const mockOnClick = vi.fn()
    render(<MockAppWithAvatar currentMember={mockCurrentMember} onAvatarClick={mockOnClick} />)
    
    const avatar = screen.getByTestId('avatar-button')
    expect(avatar).toHaveAttribute('title', 'Åpne profil og innstillinger')
    expect(avatar.tagName).toBe('BUTTON') // Should be accessible as a button
  })

  it('should handle edge case with empty nickname', () => {
    const memberWithEmptyNickname = { ...mockCurrentMember, nickname: '' }
    const mockOnClick = vi.fn()
    render(<MockAppWithAvatar currentMember={memberWithEmptyNickname} onAvatarClick={mockOnClick} />)
    
    const avatar = screen.getByTestId('avatar-button')
    // Should show fallback character for empty nickname
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveTextContent('?')
  })

  it('should handle multiple rapid clicks correctly', async () => {
    const mockOnClick = vi.fn()
    render(<MockAppWithAvatar currentMember={mockCurrentMember} onAvatarClick={mockOnClick} />)
    
    const avatar = screen.getByTestId('avatar-button')
    
    // Click multiple times rapidly
    await user.click(avatar)
    await user.click(avatar)
    await user.click(avatar)
    
    expect(mockOnClick).toHaveBeenCalledTimes(3)
  })
})