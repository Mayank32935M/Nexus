import React from 'react';
import { Folder, CheckCircle, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { ProjectSummary } from '../../types';

interface Props {
  project: ProjectSummary;
  onOpenWorkspace: (name: string) => void;
  onExportContext: (name: string) => void;
}

export const ProjectCard: React.FC<Props> = ({
  project,
  onOpenWorkspace,
  onExportContext,
}) => {
  const percent = project.total_tasks > 0
    ? Math.round((project.completed_tasks / project.total_tasks) * 100)
    : 0;

  return (
    <div className="p-4 rounded-xl bg-[#11131a] border border-[#232736] hover:border-[#32384d] transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 tracking-tight font-mono">{project.name}</h3>
              <span className="text-[10px] font-mono text-slate-400">Standard 6-Doc Architecture</span>
            </div>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#181b24] text-slate-300 border border-[#232736]">
            {project.doc_count} docs
          </span>
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
          {project.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-[#1d212e] space-y-3">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>Tasks</span>
            <span className="text-emerald-400 font-medium">
              {project.completed_tasks}/{project.total_tasks} ({percent}%)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#1b1f2c] overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={() => onExportContext(project.name)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141620] border border-[#232736] text-[11px] font-mono text-slate-300 hover:text-emerald-400 hover:border-emerald-800/60 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Context</span>
          </button>

          <button
            onClick={() => onOpenWorkspace(project.name)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b26] border border-[#2b334a] text-[11px] font-mono font-medium text-emerald-400 hover:bg-[#1f2433] hover:border-emerald-700/60 transition-all"
          >
            <span>Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

