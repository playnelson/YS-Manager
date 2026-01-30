
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
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-md border";
  
  const variants = {
    primary: "bg-[#0064d2] text-white border-[#0064d2] hover:bg-[#0052ad] active:bg-[#00418a]",
    secondary: "bg-white text-[#1c2d3d] border-[#dee2e6] hover:bg-[#f8f9fa] hover:border-[#ced4da]",
    danger: "bg-[#dc3545] text-white border-[#dc3545] hover:bg-[#c82333]",
    ghost: "bg-transparent text-[#556b82] border-transparent hover:bg-[#f3f5f8]",
  };

  const sizes = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-1.5 text-sm",
    lg: "px-6 py-2.5 text-base",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};