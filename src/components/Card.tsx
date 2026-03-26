import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 'base' | 'low' | 'high' | 'highest' | 'gradient';
  nested?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  level = 'gradient',
  nested = false,
  className = '',
  ...props
}) => {
  const levels = {
    base: "bg-surface",
    low: "bg-surface-container-low",
    high: "bg-surface-container-high",
    highest: "bg-surface-container-highest",
    gradient: "card-gradient"
  };

  const corners = nested ? "rounded-md" : "rounded-xl";
  const padding = nested ? "p-4" : "p-6";

  return (
    <div className={`${levels[level]} ${corners} ${padding} overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  );
};
