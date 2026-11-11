import React from 'react';
import {
  RotateCw,
  ShieldAlert,
  Search,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { NavItem } from './Sidebar';

interface TopbarProps {
  currentTab: NavItem;
  pendingApprovalsCount: number;
  onOpenApprovals: () => void;
  onQuickSearch: () => void;
  onSyncVault: () => void;
  isSyncing: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentTab,
  pendingApprovalsCount,
  onOpenApprovals,
  onQuickSearch,
  onSyncVault,
  isSyncing,
}) => {
  const titles: Record<NavItem, { title: string; subtitle: string }> = {
    dashboard: { title: 'Command Centre', subtitle: 'System overview, memory metrics, and ecosystem connectivity' },
    memory: { title: 'Memory Explorer', subtitle: 'Obsidian-compatible Markdown vault, FTS5 full-text search, and governance' },
    projects: { title: 'Project Workspace', subtitle: 'Standardized project documentation, context aggregation, and tasks' },
    agents: { title: 'AI Agents & Providers', subtitle: 'Local LLMs, Claude Desktop MCP bridge, and future JARVIS operators' },
    sessions: { title: 'Session History & Handoffs', subtitle: 'Structured lossless context handoffs for external AI models' },
    settings: { title: 'System Settings', subtitle: 'Path configuration, MCP client parameters, and immutable audit logs' },
  };

  const { title, subtitle } = titles[currentTab];

  return (
    <header className="h-16 px-8 border-b border-[#232736] bg-[#0d0f17] flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-base font-semibold text-slate-100 tracking-tight flex items-center gap-2">
          {title}
        </h1>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Search Button */}
        <button
          onClick={onQuickSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141620] border border-[#232736] text-xs text-slate-400 hover:text-slate-200 hover:border-[#32384d] transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search Memory...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#1f2433] text-[10px] font-mono text-slate-400">Ctrl+K</kbd>
        </button>

        {/* Sync Vault Button */}
        <button
          onClick={onSyncVault}
          disabled={isSyncing}
          title="Re-index all files in vault into SQLite"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141620] border border-[#232736] text-xs text-slate-300 hover:text-emerald-400 hover:border-emerald-800/60 transition-all disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Sync Vault</span>
        </button>

        {/* Pending Approvals Button */}
        {pendingApprovalsCount > 0 && (
          <button
            onClick={onOpenApprovals}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-600/50 text-xs font-medium text-amber-300 hover:bg-amber-900/50 transition-colors animate-pulse"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>{pendingApprovalsCount} Pending Approval{pendingApprovalsCount > 1 ? 's' : ''}</span>
          </button>
        )}

        {/* System Online Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#232736]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
          <span className="text-xs font-mono text-slate-300 font-medium">Core Online</span>
        </div>
      </div>
    </header>
  );
};

