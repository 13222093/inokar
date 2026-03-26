import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {label && (
        <label className="text-[10px] uppercase font-black text-outline tracking-wider ml-1 block">
          {label}
        </label>
      )}
      <div className={`flex items-center bg-surface-container-highest/50 border border-outline-variant/10 rounded-lg focus-within:ring-2 focus-within:ring-surface-tint/20 focus-within:shadow-[0_0_4px_rgba(76,214,255,0.1)] transition-all`}>
        {icon && <div className="pl-3 text-outline flex items-center">{icon}</div>}
        <input 
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-on-surface py-3 px-3 placeholder-outline/50 outline-none w-full"
          {...props} 
        />
      </div>
    </div>
  );
};
