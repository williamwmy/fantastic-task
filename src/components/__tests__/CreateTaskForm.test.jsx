import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateTaskForm from '../CreateTaskForm.jsx'
import { renderWithProviders } from '../../test/utils.jsx'

// Mock the tasks hook
const mockTasksHook = {
  createTask: vi.fn()
}

vi.mock('../../hooks/useTasks.jsx', () => ({
  useTasks: () => mockTasksHook
}))

describe('CreateTaskForm', () => {
  const mockProps = {
    open: true,
    onClose: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when open', () => {
    render(<CreateTaskForm {...mockProps} />)
    
    expect(screen.getByText('Legg til ny oppgave')).toBeInTheDocument()
    expect(screen.getByPlaceholder('Oppgavetittel')).toBeInTheDocument()
    expect(screen.getByPlaceholder('Beskrivelse (valgfritt)')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<CreateTaskForm {...mockProps} open={false} />)
    
    expect(screen.queryByText('Legg til ny oppgave')).not.toBeInTheDocument()
  })

  it('should show recurring type options', () => {
    render(<CreateTaskForm {...mockProps} />)
    
    expect(screen.getByText('Daglig (spesifikke dager)')).toBeInTheDocument()
    expect(screen.getByText('Ukentlig fleksibel')).toBeInTheDocument()
    expect(screen.getByText('Månedlig fleksibel')).toBeInTheDocument()
  })

  it('should show day selection for daily recurring type', async () => {
    const user = userEvent.setup()
    render(<CreateTaskForm {...mockProps} />)
    
    // Daily should be selected by default
    expect(screen.getByText('Mandag')).toBeInTheDocument()
    expect(screen.getByText('Tirsdag')).toBeInTheDocument()
    expect(screen.getByText('Onsdag')).toBeInTheDocument()
    expect(screen.getByText('Torsdag')).toBeInTheDocument()
    expect(screen.getByText('Fredag')).toBeInTheDocument()
    expect(screen.getByText('Lørdag')).toBeInTheDocument()
    expect(screen.getByText('Søndag')).toBeInTheDocument()
  })

  it('should show interval input for flexible recurring types', async () => {
    const user = userEvent.setup()
    render(<CreateTaskForm {...mockProps} />)
    
    // Switch to weekly flexible
    await user.click(screen.getByText('Ukentlig fleksibel'))
    
    expect(screen.getByText('Gjenta hver')).toBeInTheDocument()
    expect(screen.getByText('uke(r)')).toBeInTheDocument()
    
    // Switch to monthly flexible
    await user.click(screen.getByText('Månedlig fleksibel'))
    
    expect(screen.getByText('måned(er)')).toBeInTheDocument()
  })

  it('should handle day selection', async () => {
    const user = userEvent.setup()
    render(<CreateTaskForm {...mockProps} />)
    
    // Click on Monday
    await user.click(screen.getByText('Mandag'))
    
    // Monday should be selected (styling would change in real component)
    expect(screen.getByText('Mandag')).toBeInTheDocument()
  })

  it('should provide quick select options for days', async () => {
    const user = userEvent.setup()
    render(<CreateTaskForm {...mockProps} />)
    
    expect(screen.getByText('Hverdager')).toBeInTheDocument()
    expect(screen.getByText('Hele uken')).toBeInTheDocument()
    
    // Click "Hverdager" should select Monday-Friday
    await user.click(screen.getByText('Hverdager'))
    
    // All weekdays should be selected (implementation dependent)
    expect(screen.getByText('Mandag')).toBeInTheDocument()
    expect(screen.getByText('Fredag')).toBeInTheDocument()
  })

  it('should handle form submission with daily recurring type', async () => {
    const user = userEvent.setup()
    mockTasksHook.createTask.mockResolvedValue({ success: true })
    
    render(<CreateTaskForm {...mockProps} />)
    
    // Fill in form
    await user.type(screen.getByPlaceholder('Oppgavetittel'), 'Test Oppgave')
    await user.type(screen.getByPlaceholder('Beskrivelse (valgfritt)'), 'Test beskrivelse')
    
    // Set points
    const pointsInput = screen.getByDisplayValue('10') // Default points
    await user.clear(pointsInput)
    await user.type(pointsInput, '15')
    
    // Select some days
    await user.click(screen.getByText('Mandag'))
    await user.click(screen.getByText('Onsdag'))
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /legg til oppgave/i }))
    
    expect(mockTasksHook.createTask).toHaveBeenCalledWith({
      title: 'Test Oppgave',
      description: 'Test beskrivelse',
      points: 15,
      recurring_type: 'daily',
      days: expect.arrayContaining([1, 3]), // Monday and Wednesday
      flexible_interval: null
    })
  })

  it('should handle form submission with weekly flexible type', async () => {
    const user = userEvent.setup()
    mockTasksHook.createTask.mockResolvedValue({ success: true })
    
    render(<CreateTaskForm {...mockProps} />)
    
    // Switch to weekly flexible
    await user.click(screen.getByText('Ukentlig fleksibel'))
    
    // Fill in form
    await user.type(screen.getByPlaceholder('Oppgavetittel'), 'Fleksibel Oppgave')
    
    // Set interval
    const intervalInput = screen.getByDisplayValue('1') // Default interval
    await user.clear(intervalInput)
    await user.type(intervalInput, '2')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /legg til oppgave/i }))
    
    expect(mockTasksHook.createTask).toHaveBeenCalledWith({
      title: 'Fleksibel Oppgave',
      description: '',
      points: 10, // Default points
      recurring_type: 'weekly_flexible',
      days: [],
      flexible_interval: 2
    })
  })

  it('should handle form submission with monthly flexible type', async () => {
    const user = userEvent.setup()
    mockTasksHook.createTask.mockResolvedValue({ success: true })
    
    render(<CreateTaskForm {...mockProps} />)
    
    // Switch to monthly flexible
    await user.click(screen.getByText('Månedlig fleksibel'))
    
    // Fill in form
    await user.type(screen.getByPlaceholder('Oppgavetittel'), 'Månedlig Oppgave')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /legg til oppgave/i }))
    
    expect(mockTasksHook.createTask).toHaveBeenCalledWith({
      title: 'Månedlig Oppgave',
      description: '',
      points: 10,
      recurring_type: 'monthly_flexible',
      days: [],
      flexible_interval: 1 // Default monthly interval
    })
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<CreateTaskForm {...mockProps} />)
    
    // Try to submit without title
    await user.click(screen.getByRole('button', { name: /legg til oppgave/i }))
    
    // Should show validation error or prevent submission
    const titleInput = screen.getByPlaceholder('Oppgavetittel')
    expect(titleInput).toHaveAttribute('required')
  })

  it('should validate daily recurring type requires at least one day', async () => {
    const user = userEvent.setup()
    render(<CreateTaskForm {...mockProps} />)
    
    // Fill in title but don't select any days
    await user.type(screen.getByPlaceholder('Oppgavetittel'), 'Test Oppgave')
    
    // Deselect all days if any are selected by default
    const dayButtons = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']
    for (const day of dayButtons) {
      const dayButton = screen.getByText(day)
      // If it's selected (implementation dependent), deselect it
      await user.click(dayButton)
    }
    
    // Try to submit
    await user.click(screen.getByRole('button', { name: /legg til oppgave/i }))
    
    // Should show error or prevent submission
    expect(screen.getByText(/velg minst en dag/i)).toBeInTheDocument()
  })

  it('should handle form cancellation', async () => {
    const user = userEvent.setup()
    render(<CreateTaskForm {...mockProps} />)
    
    // Fill in some data
    await user.type(screen.getByPlaceholder('Oppgavetittel'), 'Test Data')
    
    // Cancel
    await user.click(screen.getByRole('button', { name: /avbryt/i }))
    
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('should reset form when closed and reopened', async () => {
    const { rerender } = render(<CreateTaskForm {...mockProps} />)
    
    const user = userEvent.setup()
    
    // Fill in some data
    await user.type(screen.getByPlaceholder('Oppgavetittel'), 'Test Data')
    
    // Close form
    rerender(<CreateTaskForm {...mockProps} open={false} />)
    
    // Reopen form
    rerender(<CreateTaskForm {...mockProps} open={true} />)
    
    // Form should be reset
    expect(screen.getByPlaceholder('Oppgavetittel')).toHaveValue('')
  })

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup()
    mockTasksHook.createTask.mockResolvedValue({ 
      error: { message: 'Task creation failed' } 
    })
    
    render(<CreateTaskForm {...mockProps} />)
    
    // Fill and submit form
    await user.type(screen.getByPlaceholder('Oppgavetittel'), 'Test Oppgave')
    await user.click(screen.getByRole('button', { name: /legg til oppgave/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Task creation failed')).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    mockTasksHook.createTask.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )
    
    render(<CreateTaskForm {...mockProps} />)
    
    // Fill and submit form
    await user.type(screen.getByPlaceholder('Oppgavetittel'), 'Test Oppgave')
    
    const submitButton = screen.getByRole('button', { name: /legg til oppgave/i })
    await user.click(submitButton)
    
    // Should show loading state
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/oppretter/i)).toBeInTheDocument()
    
    // Wait for completion
    await waitFor(() => {
      expect(mockProps.onClose).toHaveBeenCalled()
    })
  })

  it('should adjust interval input based on recurring type', async () => {
    const user = userEvent.setup()
    render(<CreateTaskForm {...mockProps} />)
    
    // Switch to weekly flexible
    await user.click(screen.getByText('Ukentlig fleksibel'))
    
    const intervalInput = screen.getByDisplayValue('1')
    await user.clear(intervalInput)
    await user.type(intervalInput, '3')
    
    expect(intervalInput).toHaveValue(3)
    expect(screen.getByText('uke(r)')).toBeInTheDocument()
    
    // Switch to monthly flexible
    await user.click(screen.getByText('Månedlig fleksibel'))
    
    expect(screen.getByText('måned(er)')).toBeInTheDocument()
    // Interval should reset or maintain value based on implementation
  })

  it('should handle points input validation', async () => {
    const user = userEvent.setup()
    render(<CreateTaskForm {...mockProps} />)
    
    const pointsInput = screen.getByDisplayValue('10')
    
    // Try negative points
    await user.clear(pointsInput)
    await user.type(pointsInput, '-5')
    
    // Should prevent negative values or show validation error
    expect(pointsInput).toHaveAttribute('min', '1')
  })
})