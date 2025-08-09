import React from 'react';

interface ACLMButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'nav' | 'submit' | 'home';
  className?: string;
  disabled?: boolean;
}

export const ACLMButton: React.FC<ACLMButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'btn btn-primary';
      case 'secondary':
        return 'btn btn-secondary';
      case 'outline':
        return 'btn btn-outline';
      case 'nav':
        return 'nav-btn';
      case 'submit':
        return 'submit-btn';
      case 'home':
        return 'home-btn';
      default:
        return 'btn btn-primary';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${getVariantClass()} ${className}`}
    >
      {children}
    </button>
  );
};