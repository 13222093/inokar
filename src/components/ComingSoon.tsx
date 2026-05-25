import React from 'react';

interface ComingSoonProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
  block?: boolean;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  children,
  label = 'Coming soon',
  className = '',
  block = false,
}) => {
  return (
    <div className={`relative group ${block ? 'block w-full' : 'inline-flex'} ${className}`}>
      <div className="opacity-40 pointer-events-none">{children}</div>
      <div className="absolute inset-0 cursor-not-allowed" aria-label={label} title={label} />
      <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-surface-container-highest text-on-surface text-[10px] font-bold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-outline-variant/20 shadow-lg">
        {label}
      </div>
    </div>
  );
};
