import React from 'react';
import { HardDrive, Database, Terminal, Shield, CheckCircle } from 'lucide-react';
import { SystemStatus } from '../../types';

interface Props {
  status: SystemStatus | null;
}

export const SystemStatusBanner: React.FC<Props> = ({ status }) => {
  if (!status) return null;

  return (
    <div className="p-4 rounded-xl bg-[#0e111a] border border-[#232736] flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-950/50 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
          <Terminal className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-100">NEXUS Intelligence Ecosystem</h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              v0.1.0-alpha
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Local-first AI operating system & persistent shared memory active
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>Vault:</span>
          <span className="text-slate-200 truncate max-w-xs" title={status.system.memory_dir}>
            {status.system.memory_dir.split(/[\\/]/).slice(-2).join('/')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>SQLite FTS5:</span>
          <span className="text-slate-200">nexus.db</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Governance:</span>
          <span className="text-emerald-400">Enforced</span>
        </div>
      </div>
    </div>
  );
};

