
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "win95-raised win95-btn inline-flex items-center justify-center font-bold text-win95-dark active:shadow-none transition-none focus:outline-dotted focus:outline-1 focus:outline-offset-[-4px]";
  
  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-4 py-1.5 text-xs",
    lg: "px-6 py-2.5 text-sm",
  };

  return (
    <button 
      className={`${baseStyles} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </button>
  );
};