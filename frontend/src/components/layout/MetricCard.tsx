import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'cyan' | 'amber' | 'slate';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  variant = 'emerald',
}) => {
  const iconVariants = {
    emerald: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
    cyan: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40',
    amber: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
    slate: 'text-slate-300 bg-slate-900/60 border-slate-800/60',
  }[variant];

  return (
    <div className="p-4 rounded-xl bg-[#11131a] border border-[#232736] hover:border-[#32384d] transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <div className={`p-2 rounded-lg border ${iconVariants}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-2xl font-bold font-mono tracking-tight text-slate-100">{value}</div>
        {subValue && <span className="text-xs font-mono text-slate-400">{subValue}</span>}
      </div>
    </div>
  );
};

