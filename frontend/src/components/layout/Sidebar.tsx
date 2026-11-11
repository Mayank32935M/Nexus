import React from 'react';
import {
  LayoutDashboard,
  FolderTree,
  Boxes,
  Bot,
  History,
  Settings,
  ShieldCheck,
  Cpu,
  Layers,
} from 'lucide-react';

export type NavItem = 'dashboard' | 'memory' | 'projects' | 'agents' | 'sessions' | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  pendingApprovalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingApprovalsCount,
}) => {
  const navs: { id: NavItem; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'memory', label: 'Memory Explorer', icon: FolderTree },
    { id: 'projects', label: 'Projects', icon: Boxes },
    { id: 'agents', label: 'AI Agents', icon: Bot },
    { id: 'sessions', label: 'Session History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0d0f17] border-r border-[#232736] flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-[#232736] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
            N
          </div>
          <div>
            <div className="font-semibold text-sm tracking-wider text-slate-100 flex items-center gap-1.5">
              NEXUS
              <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 rounded bg-[#1f2433] text-emerald-400 border border-emerald-900/40">
                v0.1
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 tracking-tight">AI Operating System</div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
          Core System
        </div>
        {navs.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#181b26] text-emerald-400 border border-[#2b334a]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141620]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.id === 'memory' && pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Architecture Status Footer */}
      <div className="p-4 border-t border-[#232736] bg-[#090a0f]">
        <div className="p-3 rounded-lg bg-[#11131a] border border-[#232736] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Storage</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Obsidian Dual-Store
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">MCP Protocol</span>
            <span className="text-cyan-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              v2.3 stdio
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Security</span>
            <span className="text-amber-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              Governed
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

