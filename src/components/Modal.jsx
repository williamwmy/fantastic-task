import React from 'react'
import { FaTimes } from 'react-icons/fa'

const Modal = ({ open, onClose, children, hideCloseButton = false, title, subtitle, icon, customButtons }) => {
  if (!open) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '0.5rem'
      }}
      onClick={handleBackdropClick}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          width: '100%',
          maxWidth: window.innerWidth < 768 ? '95vw' : 'min(95vw, 600px)',
          maxHeight: '95vh',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (fixed at top) */}
        {(title || subtitle || icon) && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            padding: '1rem 1rem 0 1rem',
            paddingBottom: '1rem',
            borderBottom: '2px solid #f8f9fa',
            flexShrink: 0
          }}>
            {icon && (
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#82bcf4',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h2 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>
                  {title}
                </h2>
              )}
              {subtitle && (
                <p style={{ margin: '0.25rem 0 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Scrollable content area */}
        <div style={{ 
          flex: 1, 
          minHeight: 0, 
          overflow: 'auto',
          padding: '1rem'
        }}>
          {children}
        </div>
        
        {/* Footer (fixed at bottom) */}
        {(customButtons || !hideCloseButton) && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            padding: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #dee2e6',
            backgroundColor: 'white',
            borderRadius: '0 0 0.5rem 0.5rem',
            flexShrink: 0
          }}>
            {customButtons}
            {!hideCloseButton && (
              <button
                onClick={onClose}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FaTimes />
                Lukk
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal