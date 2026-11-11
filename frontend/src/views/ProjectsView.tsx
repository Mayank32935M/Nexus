import React, { useState } from 'react';
import { ProjectSummary, ProjectContextBundle } from '../types';
import { ProjectCard } from '../components/projects/ProjectCard';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { ContextBundleModal } from '../components/projects/ContextBundleModal';
import { ProjectWorkspaceDetail } from '../components/projects/ProjectWorkspaceDetail';
import { HandoffModal } from '../components/handoff/HandoffModal';
import { api } from '../api/client';
import { Plus, Boxes, Search } from 'lucide-react';

interface Props {
  projects: ProjectSummary[];
  activeProjectName: string | null;
  onSelectProject: (name: string | null) => void;
  onRefreshProjects: () => void;
}

export const ProjectsView: React.FC<Props> = ({
  projects,
  activeProjectName,
  onSelectProject,
  onRefreshProjects,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [contextModalOpen, setContextModalOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<ProjectContextBundle | null>(null);
  const [handoffModalOpen, setHandoffModalOpen] = useState(false);
  const [handoffProject, setHandoffProject] = useState<string | undefined>(undefined);
  const [searchFilter, setSearchFilter] = useState('');

  const handleCreateProject = async (name: string, description: string) => {
    await api.createProject(name, description);
    onRefreshProjects();
  };

  const handleExportContext = async (name: string) => {
    const bundle = await api.getProjectContext(name);
    setSelectedContext(bundle);
    setContextModalOpen(true);
  };

  const handleTriggerHandoff = (name: string) => {
    setHandoffProject(name);
    setHandoffModalOpen(true);
  };

  if (activeProjectName) {
    return (
      <ProjectWorkspaceDetail
        projectName={activeProjectName}
        onBack={() => onSelectProject(null)}
        onExportContext={handleExportContext}
        onGenerateHandoff={handleTriggerHandoff}
      />
    );
  }

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#11131a] border border-[#232736]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Project Workspaces</h2>
            <p className="text-xs text-slate-400 font-mono">Independent memory contexts with standardized 6-document architecture</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter projects..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#0d0f17] border border-[#232736] rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500/80"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((proj) => (
          <ProjectCard
            key={proj.name}
            project={proj}
            onOpenWorkspace={(name) => onSelectProject(name)}
            onExportContext={handleExportContext}
          />
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-xl border border-dashed border-[#232736] p-8">
            <Boxes className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300">No project workspaces found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Initialize a project to scaffold the standard 6 documentation files and manage context for external AI models.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all"
            >
              Create First Project
            </button>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProject}
      />

      {/* Context Bundle Modal */}
      <ContextBundleModal
        isOpen={contextModalOpen}
        onClose={() => setContextModalOpen(false)}
        context={selectedContext}
      />

      {/* Handoff Modal */}
      <HandoffModal
        isOpen={handoffModalOpen}
        onClose={() => setHandoffModalOpen(false)}
        defaultProject={handoffProject}
      />
    </div>
  );
};

