import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavItem } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardView } from './views/DashboardView';
import { MemoryExplorerView } from './views/MemoryExplorerView';
import { ProjectsView } from './views/ProjectsView';
import { AgentsView } from './views/AgentsView';
import { SessionHistoryView } from './views/SessionHistoryView';
import { SettingsView } from './views/SettingsView';
import { ApprovalsModal } from './components/approvals/ApprovalsModal';
import { api } from './api/client';
import {
  SystemStatus,
  MemoryTreeNode,
  ProjectSummary,
  ApprovalRecord,
  AuditLogEntry,
} from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [tree, setTree] = useState<MemoryTreeNode[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Navigation states
  const [selectedPath, setSelectedPath] = useState<string | null>('CORE/SYSTEM.md');
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);
  const [isApprovalsOpen, setIsApprovalsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load all system data
  const loadData = useCallback(async () => {
    try {
      const [statusRes, treeRes, projRes, appRes, auditRes] = await Promise.allSettled([
        api.getStatus(),
        api.getMemoryTree(),
        api.listProjects(),
        api.listApprovals('PENDING'),
        api.getAuditLogs(50),
      ]);

      if (statusRes.status === 'fulfilled') setStatus(statusRes.value);
      if (treeRes.status === 'fulfilled') setTree(treeRes.value);
      if (projRes.status === 'fulfilled') setProjects(projRes.value);
      if (appRes.status === 'fulfilled') setApprovals(appRes.value);
      if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value);
    } catch (err) {
      console.error('System synchronization error:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Periodic refresh every 15 seconds
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCurrentTab('memory');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSyncVault = async () => {
    try {
      setIsSyncing(true);
      await api.syncVault();
      await loadData();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApproveProposal = async (id: string) => {
    await api.approveProposal(id, 'User');
    await loadData();
  };

  const handleRejectProposal = async (id: string, reason?: string) => {
    await api.rejectProposal(id, 'User', reason);
    await loadData();
  };

  const handleOpenProjectWorkspace = (name: string) => {
    setActiveProjectName(name);
    setCurrentTab('projects');
  };

  const handleSelectFile = (path: string) => {
    setSelectedPath(path);
    setCurrentTab('memory');
  };

  return (
    <div className="flex h-screen bg-[#090a0f] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'projects') setActiveProjectName(null);
        }}
        pendingApprovalsCount={approvals.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          currentTab={currentTab}
          pendingApprovalsCount={approvals.length}
          onOpenApprovals={() => setIsApprovalsOpen(true)}
          onQuickSearch={() => setCurrentTab('memory')}
          onSyncVault={handleSyncVault}
          isSyncing={isSyncing}
        />

        <main className="flex-1 p-6 overflow-y-auto bg-[#0a0c12]">
          {currentTab === 'dashboard' && (
            <DashboardView
              status={status}
              auditLogs={auditLogs}
              onNavigateToProjects={() => {
                setActiveProjectName(null);
                setCurrentTab('projects');
              }}
              onNavigateToMemory={() => setCurrentTab('memory')}
              onNavigateToAgents={() => setCurrentTab('agents')}
              onOpenProject={handleOpenProjectWorkspace}
              onExportProjectContext={() => {
                setCurrentTab('projects');
              }}
              onSelectFile={handleSelectFile}
            />
          )}

          {currentTab === 'memory' && (
            <MemoryExplorerView
              tree={tree}
              selectedPath={selectedPath}
              onSelectPath={setSelectedPath}
              onRefreshVault={loadData}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsView
              projects={projects}
              activeProjectName={activeProjectName}
              onSelectProject={setActiveProjectName}
              onRefreshProjects={loadData}
            />
          )}

          {currentTab === 'agents' && <AgentsView />}

          {currentTab === 'sessions' && <SessionHistoryView />}

          {currentTab === 'settings' && (
            <SettingsView
              status={status}
              auditLogs={auditLogs}
              onSyncVault={handleSyncVault}
              isSyncing={isSyncing}
            />
          )}
        </main>
      </div>

      {/* Pending Approvals Modal */}
      <ApprovalsModal
        isOpen={isApprovalsOpen}
        onClose={() => setIsApprovalsOpen(false)}
        approvals={approvals}
        onApprove={handleApproveProposal}
        onReject={handleRejectProposal}
        onRefresh={loadData}
      />
    </div>
  );
}

export default App;
