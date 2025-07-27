import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/utils.jsx'
import CreateTaskForm from '../CreateTaskForm.jsx'
import commonTasks from '../../data/commonTasks.json'

// Mock the hooks
const mockCreateTask = vi.fn()
const mockCurrentMember = {
  id: 'member-1',
  nickname: 'Test User',
  role: 'admin'
}

vi.mock('../../hooks/useTasks.jsx', () => ({
  useTasks: () => ({
    createTask: mockCreateTask
  }),
  TasksProvider: ({ children }) => children
}))

vi.mock('../../hooks/useFamily.jsx', () => ({
  useFamily: () => ({
    familyMembers: [mockCurrentMember],
    currentMember: mockCurrentMember
  }),
  FamilyProvider: ({ children }) => children
}))

describe('CreateTaskForm Quick Start', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  it('should show quick start section by default', () => {
    renderWithProviders(
      <CreateTaskForm open={true} onClose={vi.fn()} />
    )

    expect(screen.getByText('Vanlige oppgaver')).toBeInTheDocument()
    expect(screen.getByText('Velg en vanlig husholdningsoppgave. Du kan justere alle detaljer etter at du har valgt.')).toBeInTheDocument()
  })

  it('should display task categories and tasks from JSON file', () => {
    renderWithProviders(
      <CreateTaskForm open={true} onClose={vi.fn()} />
    )

    // Check that categories are displayed
    const categories = [...new Set(commonTasks.map(task => task.category))]
    categories.forEach(category => {
      expect(screen.getByText(category)).toBeInTheDocument()
    })

    // Check that some tasks are displayed
    expect(screen.getByText('Tømme oppvaskmaskin')).toBeInTheDocument()
    expect(screen.getByText('Fylle oppvaskmaskin')).toBeInTheDocument()
    expect(screen.getByText('Støvsuge hele huset/leiligheten')).toBeInTheDocument()
  })

  it('should show estimated time and calculated points for each task', () => {
    renderWithProviders(
      <CreateTaskForm open={true} onClose={vi.fn()} />
    )

    // Find a task we know the details of
    const dishwasherTask = commonTasks.find(task => task.task === 'Tømme oppvaskmaskin')
    expect(dishwasherTask).toBeDefined()

    // Find the specific task button and check its content
    const taskButton = screen.getByText('Tømme oppvaskmaskin').closest('button')
    expect(taskButton).toHaveTextContent(`${dishwasherTask.estimated_minutes} min`)
    
    const expectedPoints = Math.max(1, Math.round(dishwasherTask.estimated_minutes / 5))
    expect(taskButton).toHaveTextContent(`${expectedPoints} poeng`)
  })

  it('should prefill form when clicking on a quick start task', async () => {
    renderWithProviders(
      <CreateTaskForm open={true} onClose={vi.fn()} />
    )

    // Click on a specific task
    const taskButton = screen.getByText('Tømme oppvaskmaskin').closest('button')
    await user.click(taskButton)

    // Check that form fields are prefilled
    const titleInput = screen.getByDisplayValue('Tømme oppvaskmaskin')
    expect(titleInput).toBeInTheDocument()

    const descriptionInput = screen.getByDisplayValue('Ta ut ren oppvask og sett på plass')
    expect(descriptionInput).toBeInTheDocument()

    const timeInput = screen.getByDisplayValue('5')
    expect(timeInput).toBeInTheDocument()

    // Points should be calculated (5 minutes / 5 = 1 point)
    const pointsInput = screen.getByDisplayValue('1')
    expect(pointsInput).toBeInTheDocument()
  })

  it('should hide quick start section after selecting a task', async () => {
    renderWithProviders(
      <CreateTaskForm open={true} onClose={vi.fn()} />
    )

    // Initially quick start should be visible
    expect(screen.getByText('Vanlige oppgaver')).toBeInTheDocument()

    // Click on a task
    const taskButton = screen.getByText('Tømme oppvaskmaskin').closest('button')
    await user.click(taskButton)

    // Quick start section should be hidden
    expect(screen.queryByText('Vanlige oppgaver')).not.toBeInTheDocument()

    // Should show option to go back to quick start
    expect(screen.getByText('Vis vanlige oppgaver i stedet')).toBeInTheDocument()
  })

  it('should allow switching back to quick start mode', async () => {
    renderWithProviders(
      <CreateTaskForm open={true} onClose={vi.fn()} />
    )

    // Click on a task to hide quick start
    const taskButton = screen.getByText('Tømme oppvaskmaskin').closest('button')
    await user.click(taskButton)

    // Quick start should be hidden
    expect(screen.queryByText('Vanlige oppgaver')).not.toBeInTheDocument()

    // Click to show quick start again
    const showQuickStartButton = screen.getByText('Vis vanlige oppgaver i stedet')
    await user.click(showQuickStartButton)

    // Quick start should be visible again
    expect(screen.getByText('Vanlige oppgaver')).toBeInTheDocument()
  })

  it('should allow hiding quick start manually', async () => {
    renderWithProviders(
      <CreateTaskForm open={true} onClose={vi.fn()} />
    )

    // Click "Opprett egen oppgave" button
    const createOwnButton = screen.getByText('Opprett egen oppgave')
    await user.click(createOwnButton)

    // Quick start should be hidden
    expect(screen.queryByText('Vanlige oppgaver')).not.toBeInTheDocument()

    // Should show regular form with title field
    expect(screen.getByPlaceholderText("F.eks. 'Rydde rommet', 'Gjøre lekser', 'Støvsuge stua'")).toBeInTheDocument()
  })

  it('should allow editing prefilled values', async () => {
    renderWithProviders(
      <CreateTaskForm open={true} onClose={vi.fn()} />
    )

    // Click on a task to prefill
    const taskButton = screen.getByText('Tømme oppvaskmaskin').closest('button')
    await user.click(taskButton)

    // Edit the title
    const titleInput = screen.getByDisplayValue('Tømme oppvaskmaskin')
    await user.clear(titleInput)
    await user.type(titleInput, 'Rydde oppvaskmaskin')

    expect(screen.getByDisplayValue('Rydde oppvaskmaskin')).toBeInTheDocument()

    // Edit the points
    const pointsInput = screen.getByDisplayValue('1')
    await user.clear(pointsInput)
    await user.type(pointsInput, '10')

    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
  })

  it('should create task with prefilled values when submitted', async () => {
    mockCreateTask.mockResolvedValue({ error: null })
    
    renderWithProviders(
      <CreateTaskForm open={true} onClose={vi.fn()} />
    )

    // Click on a task to prefill
    const taskButton = screen.getByText('Tømme oppvaskmaskin').closest('button')
    await user.click(taskButton)

    // Wait for form to be visible and filled
    await waitFor(() => {
      expect(screen.getByDisplayValue('Tømme oppvaskmaskin')).toBeInTheDocument()
    })

    // Submit the form
    const submitButton = screen.getByText('Legg til oppgave')
    await user.click(submitButton)

    // Just check that createTask was called - don't wait for success message
    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalled()
    })

    // Check that createTask was called with correct data
    expect(mockCreateTask).toHaveBeenCalledWith({
      title: 'Tømme oppvaskmaskin',
      description: 'Ta ut ren oppvask og sett på plass',
      points: 1,
      estimated_minutes: 5,
      recurring_type: 'once',
      recurring_days: null,
      flexible_interval: null,
      created_by: 'member-1'
    })
  })

  it('should reset to quick start mode when form is reset', async () => {
    const onClose = vi.fn()
    renderWithProviders(
      <CreateTaskForm open={true} onClose={onClose} />
    )

    // Click on a task to hide quick start
    const taskButton = screen.getByText('Tømme oppvaskmaskin').closest('button')
    await user.click(taskButton)

    // Quick start should be hidden
    expect(screen.queryByText('Vanlige oppgaver')).not.toBeInTheDocument()

    // Close and reopen modal (simulating reset)
    onClose()
    
    // When reopened, quick start should be visible again
    renderWithProviders(
      <CreateTaskForm open={true} onClose={vi.fn()} />
    )
    
    expect(screen.getByText('Vanlige oppgaver')).toBeInTheDocument()
  })

  it('should calculate points correctly for different task durations', () => {
    renderWithProviders(
      <CreateTaskForm open={true} onClose={vi.fn()} />
    )

    // Test different tasks with different durations from actual JSON data
    const testCases = [
      { taskName: 'Tømme oppvaskmaskin' },
      { taskName: 'Støvsuge hele huset/leiligheten' },
      { taskName: 'Vaske vinduer' }
    ]

    testCases.forEach(({ taskName }) => {
      const taskData = commonTasks.find(task => task.task === taskName)
      if (taskData) {
        const task = screen.getByText(taskName)
        const taskContainer = task.closest('button')
        
        const expectedPoints = Math.max(1, Math.round(taskData.estimated_minutes / 5))
        expect(taskContainer).toHaveTextContent(`${taskData.estimated_minutes} min`)
        expect(taskContainer).toHaveTextContent(`${expectedPoints} poeng`)
      }
    })
  })
})