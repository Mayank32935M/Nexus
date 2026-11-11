import React from 'react';
import {
  FileText,
  Boxes,
  ShieldAlert,
  HardDrive,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { SystemStatus, AuditLogEntry } from '../types';
import { MetricCard } from '../components/layout/MetricCard';
import { SystemStatusBanner } from '../components/dashboard/SystemStatusBanner';
import { IntegrationGrid } from '../components/dashboard/IntegrationGrid';
import { RecentActivityTimeline } from '../components/dashboard/RecentActivityTimeline';
import { AgentActivityPreview } from '../components/dashboard/AgentActivityPreview';
import { ProjectCard } from '../components/projects/ProjectCard';

interface Props {
  status: SystemStatus | null;
  auditLogs: AuditLogEntry[];
  onNavigateToProjects: () => void;
  onNavigateToMemory: () => void;
  onNavigateToAgents: () => void;
  onOpenProject: (name: string) => void;
  onExportProjectContext: (name: string) => void;
  onSelectFile: (path: string) => void;
}

export const DashboardView: React.FC<Props> = ({
  status,
  auditLogs,
  onNavigateToProjects,
  onNavigateToMemory,
  onNavigateToAgents,
  onOpenProject,
  onExportProjectContext,
  onSelectFile,
}) => {
  const stats = status?.stats;

  return (
    <div className="space-y-6">
      {/* System Status Banner */}
      <SystemStatusBanner status={status} />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Vault Documents"
          value={stats ? stats.total_files : '—'}
          subValue="Obsidian .md"
          icon={FileText}
          variant="emerald"
        />
        <MetricCard
          label="Total Memory Words"
          value={stats ? stats.total_words.toLocaleString() : '—'}
          subValue={stats ? `${(stats.total_size_bytes / 1024).toFixed(1)} KB` : undefined}
          icon={HardDrive}
          variant="cyan"
        />
        <MetricCard
          label="Active Projects"
          value={stats ? stats.total_projects : '—'}
          subValue="Workspaces"
          icon={Boxes}
          variant="slate"
        />
        <MetricCard
          label="Governance Queue"
          value={stats ? stats.pending_approvals_count : '—'}
          subValue="Awaiting Review"
          icon={ShieldAlert}
          variant={stats && stats.pending_approvals_count > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Active Projects Showcase */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Active Workspaces</h3>
          <button
            onClick={onNavigateToProjects}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-mono transition-colors flex items-center gap-1"
          >
            <span>All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {status && status.active_projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {status.active_projects.slice(0, 3).map((proj) => (
              <ProjectCard
                key={proj.name}
                project={proj}
                onOpenWorkspace={onOpenProject}
                onExportContext={onExportProjectContext}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-[#11131a] border border-[#232736] text-center text-xs font-mono text-slate-400">
            No projects initialized yet. Click on "Projects" in the sidebar to create your first workspace.
          </div>
        )}
      </div>

      {/* Integration Status Grid */}
      <IntegrationGrid
        integrations={status?.integrations}
        onNavigateToAgents={onNavigateToAgents}
      />

      {/* Split section: Provenance Activity & JARVIS Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityTimeline
          auditLogs={auditLogs}
          onSelectFile={onSelectFile}
        />
        <AgentActivityPreview />
      </div>
    </div>
  );
};

