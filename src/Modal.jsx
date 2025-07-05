import React from "react";

export default function Modal({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      tabIndex={-1}
      onClick={e => {
        // Klikk utenfor modal-innholdet lukker modal
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        {children}
      </div>
    </div>
  );
}
