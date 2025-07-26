import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateTaskForm from '../CreateTaskForm.jsx'
import { renderWithProviders } from '../../test/utils.jsx'

// Mock the tasks hook
const mockTasksHook = {
  createTask: vi.fn()
}

const mockFamilyHook = {
  family: { id: 'test-family-id', name: 'Test Familie' },
  currentMember: { id: 'test-member-id', nickname: 'Test User' },
  familyMembers: [{ id: 'test-member-id', nickname: 'Test User' }]
}

vi.mock('../../hooks/useTasks.jsx', () => ({
  useTasks: () => mockTasksHook,
  TasksProvider: ({ children }) => children
}))

vi.mock('../../hooks/useFamily.jsx', () => ({
  useFamily: () => mockFamilyHook,
  FamilyProvider: ({ children }) => children
}))

describe('CreateTaskForm', () => {
  const mockCurrentMember = { id: 'test-member-id' }
  const mockProps = {
    open: true,
    onClose: vi.fn(),
    currentMember: mockCurrentMember
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when open', () => {
    renderWithProviders(<CreateTaskForm {...mockProps} />)
    expect(screen.getByText('Opprett ny oppgave')).toBeInTheDocument()
    expect(screen.getByPlaceholderText("F.eks. 'Rydde rommet', 'Gjøre lekser', 'Støvsuge stua'")).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Beskriv hva som skal gjøres/i)).toBeInTheDocument()
  })

  it('should handle day selection', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateTaskForm {...mockProps} />)
    
    // Click on Monday (using the short form from the component)
    await user.click(screen.getByText('Man'))
    
    expect(screen.getByText(/Spesifikke dager/i)).toBeInTheDocument()
    expect(screen.getByText(/Ukentlig.*fleksibel/i)).toBeInTheDocument()
    expect(screen.getByText(/Månedlig.*fleksibel/i)).toBeInTheDocument()
  })

  it('should provide quick select options for days', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateTaskForm {...mockProps} />)
    
    expect(screen.getByText('Ukedager')).toBeInTheDocument()
    expect(screen.getByText('Man')).toBeInTheDocument()
    expect(screen.getByText('Fre')).toBeInTheDocument()
  })

  it('should handle form submission with daily type', async () => {
    const user = userEvent.setup()
    mockTasksHook.createTask.mockResolvedValue({ success: true })
    renderWithProviders(<CreateTaskForm {...mockProps} />)
    
    // Fill in form
    await user.type(screen.getByPlaceholderText("F.eks. 'Rydde rommet', 'Gjøre lekser', 'Støvsuge stua'"), 'Test Oppgave')
    
    const pointsInput = screen.getByPlaceholderText('F.eks. 10')
    await user.clear(pointsInput)
    await user.type(pointsInput, '15')
    
    // Select some days (using short forms)
    await user.click(screen.getByText('Man'))
    await user.click(screen.getByText('Ons'))
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /legg til oppgave/i }))
    
    expect(mockTasksHook.createTask).toHaveBeenCalledWith({
      title: 'Test Oppgave',
      description: null,
      points: 15,
      estimated_minutes: null,
      recurring_type: 'daily',
      recurring_days: [1, 3], // Monday and Wednesday
      flexible_interval: null,
      created_by: 'test-member-id'
    })
  })

  it('should handle form submission with weekly flexible type', async () => {
    const user = userEvent.setup()
    mockTasksHook.createTask.mockResolvedValue({ data: {}, error: null })
    renderWithProviders(<CreateTaskForm {...mockProps} />)
    
    // Fill in form first
    await user.type(screen.getByPlaceholderText("F.eks. 'Rydde rommet', 'Gjøre lekser', 'Støvsuge stua'"), 'Fleksibel Oppgave')
    
    // Switch to weekly flexible
    await user.click(screen.getByText(/Ukentlig.*fleksibel/i))
    
    // Submit form without changing interval (use default)
    await user.click(screen.getByRole('button', { name: /legg til oppgave/i }))
    
    await waitFor(() => {
      expect(mockTasksHook.createTask).toHaveBeenCalled()
    })
    
    expect(mockTasksHook.createTask).toHaveBeenCalledWith({
      title: 'Fleksibel Oppgave',
      description: null,
      points: 0, // Default points when empty
      estimated_minutes: null,
      recurring_type: 'weekly_flexible',
      recurring_days: null,
      flexible_interval: 7, // Default value
      created_by: 'test-member-id'
    })
  })

  it('should handle form submission with monthly flexible type', async () => {
    const user = userEvent.setup()
    mockTasksHook.createTask.mockResolvedValue({ success: true })
    renderWithProviders(<CreateTaskForm {...mockProps} />)
    
    // Switch to monthly flexible
    await user.click(screen.getByText(/Månedlig.*fleksibel/i))
    
    // Fill in form
    await user.type(screen.getByPlaceholderText("F.eks. 'Rydde rommet', 'Gjøre lekser', 'Støvsuge stua'"), 'Månedlig Oppgave')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /legg til oppgave/i }))
    
    expect(mockTasksHook.createTask).toHaveBeenCalledWith({
      title: 'Månedlig Oppgave',
      description: null,
      points: 0,
      estimated_minutes: null,
      recurring_type: 'monthly_flexible',
      recurring_days: null,
      flexible_interval: 7, // Default interval is 7
      created_by: 'test-member-id'
    })
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateTaskForm {...mockProps} />)
    
    // Try to submit without title
    await user.click(screen.getByRole('button', { name: /legg til oppgave/i }))
    
    // Should show validation error or prevent submission
    const titleInput = screen.getByPlaceholderText("F.eks. 'Rydde rommet', 'Gjøre lekser', 'Støvsuge stua'")
    expect(titleInput).toHaveAttribute('required')
  })

  it('should handle form cancellation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateTaskForm {...mockProps} />)
    
    // Fill in some data
    await user.type(screen.getByPlaceholderText("F.eks. 'Rydde rommet', 'Gjøre lekser', 'Støvsuge stua'"), 'Test Data')
    
    // Cancel
    await user.click(screen.getByRole('button', { name: /avbryt/i }))
    
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    mockTasksHook.createTask.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )
    
    renderWithProviders(<CreateTaskForm {...mockProps} />)
    
    // Fill and submit form
    await user.type(screen.getByPlaceholderText("F.eks. 'Rydde rommet', 'Gjøre lekser', 'Støvsuge stua'"), 'Test Oppgave')
    
    const submitButton = screen.getByRole('button', { name: /legg til oppgave/i })
    await user.click(submitButton)
    
    // Should show loading state
    expect(submitButton).toBeDisabled()
  })

  it('should validate points input', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateTaskForm {...mockProps} />)
    
    const pointsInput = screen.getByPlaceholderText('F.eks. 10')
    
    // Try negative points
    await user.clear(pointsInput)
    await user.type(pointsInput, '-5')
    
    // Should prevent negative values or show validation error
    expect(pointsInput).toHaveAttribute('min', '0')
  })
})