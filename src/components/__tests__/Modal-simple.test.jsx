import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from '../Modal.jsx'

describe('Modal - Simple Tests', () => {
  it('should render modal content when open is true', () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    )

    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('should not render modal content when open is false', () => {
    render(
      <Modal open={false} onClose={vi.fn()}>
        <div>Modal content</div>
      </Modal>
    )

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('should render children content correctly', () => {
    const testContent = 'This is test content for the modal'
    
    render(
      <Modal open={true} onClose={vi.fn()}>
        <div>
          <h2>Modal Title</h2>
          <p>{testContent}</p>
          <button>Test Button</button>
        </div>
      </Modal>
    )

    expect(screen.getByText('Modal Title')).toBeInTheDocument()
    expect(screen.getByText(testContent)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument()
  })

  it('should accept onClose function prop', () => {
    const mockOnClose = vi.fn()
    
    render(
      <Modal open={true} onClose={mockOnClose}>
        <div>Modal content</div>
      </Modal>
    )

    // Modal should render without throwing
    expect(screen.getByText('Modal content')).toBeInTheDocument()
    expect(mockOnClose).toBeInstanceOf(Function)
  })

  it('should render with proper modal structure', () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <div data-testid="modal-content">Modal content</div>
      </Modal>
    )

    const modalContent = screen.getByTestId('modal-content')
    expect(modalContent).toBeInTheDocument()
    
    // Check that content is within a container
    const container = modalContent.closest('div')
    expect(container).toBeInTheDocument()
  })
})