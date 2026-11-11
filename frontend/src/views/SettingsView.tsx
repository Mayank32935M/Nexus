import React, { useState } from 'react';
import { SystemStatus, AuditLogEntry } from '../types';
import { MCPConfigCard } from '../components/settings/MCPConfigCard';
import { AuditTable } from '../components/settings/AuditTable';
import { Settings, HardDrive, Database, Shield, RotateCw } from 'lucide-react';

interface Props {
  status: SystemStatus | null;
  auditLogs: AuditLogEntry[];
  onSyncVault: () => void;
  isSyncing: boolean;
}

export const SettingsView: React.FC<Props> = ({
  status,
  auditLogs,
  onSyncVault,
  isSyncing,
}) => {
  return (
    <div className="space-y-6">
      {/* Parameters Overview */}
      <div className="p-5 rounded-xl bg-[#11131a] border border-[#232736] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#232736]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Local Environment & Storage Configuration</h2>
              <p className="text-xs text-slate-400">File paths and runtime parameters loaded from .env</p>
            </div>
          </div>

          <button
            onClick={onSyncVault}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#181b26] border border-[#2b334a] text-xs font-mono text-emerald-400 hover:bg-[#1f2433] transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Re-Index Vault</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-lg bg-[#0d0f17] border border-[#1f2330]">
            <span className="text-slate-400 flex items-center gap-1.5 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              Memory Vault Directory:
            </span>
            <div className="text-slate-200 truncate font-semibold" title={status?.system.memory_dir}>
              {status?.system.memory_dir || 'Loading...'}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0d0f17] border border-[#1f2330]">
            <span className="text-slate-400 flex items-center gap-1.5 mb-1">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              SQLite Database Path:
            </span>
            <div className="text-slate-200 truncate font-semibold" title={status?.system.db_path}>
              {status?.system.db_path || 'Loading...'}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0d0f17] border border-[#1f2330]">
            <span className="text-slate-400 flex items-center gap-1.5 mb-1">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Governance & Approvals:
            </span>
            <div className="text-emerald-400 font-semibold">Strict Boundaries Enforced</div>
          </div>
        </div>
      </div>

      {/* Claude Desktop MCP Configuration Component */}
      <MCPConfigCard />

      {/* Full Audit Log Viewer */}
      <AuditTable logs={auditLogs} />
    </div>
  );
};

