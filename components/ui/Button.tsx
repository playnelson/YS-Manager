
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
  // Base styles using the new CSS classes defined in index.html
  const baseStyles = "win95-btn inline-flex items-center justify-center font-semibold select-none focus:outline-none focus:ring-2 focus:ring-blue-400/30";
  
  const sizes = {
    sm: "px-2 py-1 text-[11px] gap-1",
    md: "px-4 py-2 text-xs gap-2",
    lg: "px-6 py-3 text-sm gap-2",
  };

  const variants = {
    primary: "text-gray-700",
    secondary: "bg-white/50",
    danger: "text-red-600 hover:text-red-700 hover:bg-red-50",
    ghost: "shadow-none border-transparent bg-transparent hover:bg-black/5 active:bg-black/10"
  };

  // Se variant for 'ghost', removemos a classe win95-btn padrão para evitar sombras duplicadas
  const finalClass = variant === 'ghost' 
    ? `inline-flex items-center justify-center font-semibold transition-colors rounded-md ${sizes[size]} ${variants['ghost']} ${className}`
    : `${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`;

  return (
    <button 
      className={finalClass}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
