import React from 'react'

interface ConfirmButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

export const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  onClick,
  disabled,
  loading,
}) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className="confirm-btn"
  >
    {loading ? (
      <span className="spinner" />
    ) : (
      'Confirm Placement'
    )}
  </button>
)
