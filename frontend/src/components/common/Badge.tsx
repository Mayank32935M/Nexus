import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'cyan' | 'slate' | 'rose';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    amber: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
    cyan: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60',
    slate: 'bg-slate-800/60 text-slate-300 border-slate-700/60',
    rose: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
  }[variant];

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border ${variantStyles} ${sizeStyles}`}
    >
      {children}
    </span>
  );
};

