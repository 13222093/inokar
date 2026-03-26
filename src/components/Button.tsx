import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 font-bold px-4 py-3 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "liquid-gradient text-on-primary rounded-xl shadow-lg shadow-primary/10 hover:scale-[1.02]",
    secondary: "bg-transparent border border-outline-variant/15 text-primary rounded-xl hover:bg-surface-container-high",
    tertiary: "bg-surface-container-highest text-tertiary rounded-xl hover:shadow-[0_0_15px_rgba(14,247,214,0.3)] hover:text-tertiary-fixed",
    ghost: "bg-transparent text-outline hover:text-primary hover:bg-white/[0.03] rounded-lg"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {icon && <span className="flex items-center justify-center">{icon}</span>}
      {children}
    </button>
  );
};
