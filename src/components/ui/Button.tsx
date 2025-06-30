import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: LucideIcon;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  icon: Icon,
  className = '',
  type = 'button'
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border theme-transition';
  
  const variants = {
    primary: 'text-white shadow-lg hover:shadow-xl focus:ring-opacity-50 border-transparent transform hover:scale-[1.02] active:scale-[0.98]',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md focus:ring-slate-500 transform hover:scale-[1.01] active:scale-[0.99] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-600',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl focus:ring-red-500 border-transparent transform hover:scale-[1.02] active:scale-[0.98]',
    ghost: 'hover:bg-slate-100/80 text-slate-600 hover:text-slate-800 focus:ring-slate-500 border-transparent backdrop-blur-sm dark:hover:bg-slate-800/80 dark:text-slate-400 dark:hover:text-slate-200'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-2xl'
  };

  // Dynamic primary button styling
  const primaryStyle = variant === 'primary' ? {
    background: `linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))`,
    focusRingColor: `rgb(var(--color-primary))`
  } : {};

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      style={primaryStyle}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
}