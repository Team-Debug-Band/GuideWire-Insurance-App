import React from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const variants = {
    primary: 'premium-gradient text-white shadow-lg hover:translate-y-[-2px] transition-transform',
    secondary: 'bg-surface-container-lowest border border-outline-variant/20 text-primary hover:bg-surface-container-low transition-colors',
    ghost: 'hover:bg-surface-container-low text-primary transition-colors',
    outline: 'border border-primary text-primary hover:bg-primary/5 transition-colors',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-4 text-base',
    xl: 'px-10 py-5 text-lg',
  };

  return (
    <button
      className={cn(
        'rounded-xl font-headline font-bold tracking-tight flex items-center justify-center gap-2 active:scale-95 duration-200 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
