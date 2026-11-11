import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  ListTodo,
  Layers,
  History,
  Sparkles,
  Plus,
  Send,
} from 'lucide-react';
import { api } from '../../api/client';
import { MarkdownPreview } from '../common/MarkdownPreview';

interface Props {
  projectName: string;
  onBack: () => void;
  onExportContext: (name: string) => void;
  onGenerateHandoff: (name: string) => void;
}

type ProjectTab = 'overview' | 'state' | 'arch' | 'decisions' | 'tasks' | 'changelog';

export const ProjectWorkspaceDetail: React.FC<Props> = ({
  projectName,
  onBack,
  onExportContext,
  onGenerateHandoff,
}) => {
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview');
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [taskStatus, setTaskStatus] = useState('in_progress');
  const [taskNotes, setTaskNotes] = useState('');
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  const tabToFileMap: Record<ProjectTab, string> = {
    overview: 'PROJECT-OVERVIEW.md',
    state: 'CURRENT-STATE.md',
    arch: 'ARCHITECTURE.md',
    decisions: 'DECISIONS.md',
    tasks: 'TASKS.md',
    changelog: 'CHANGELOG.md',
  };

  const loadDocs = async () => {
    try {
      setIsLoading(true);
      const res = await api.getProjectContext(projectName);
      setDocuments(res.documents);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [projectName]);

  const handleRecordProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      setIsUpdatingProgress(true);
      await api.updateProjectProgress(projectName, newTask.trim(), taskStatus, taskNotes.trim());
      setNewTask('');
      setTaskNotes('');
      await loadDocs();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const tabs: { id: ProjectTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'state', label: 'Current State', icon: CheckCircle2 },
    { id: 'arch', label: 'Architecture', icon: Layers },
    { id: 'decisions', label: 'Decisions (ADR)', icon: History },
    { id: 'tasks', label: 'Tasks & Progress', icon: ListTodo },
    { id: 'changelog', label: 'Changelog', icon: History },
  ];

  const currentDocContent = documents[tabToFileMap[activeTab]] || 'No content loaded.';

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Workspace Navigation Bar */}
      <div className="p-4 rounded-xl bg-[#11131a] border border-[#232736] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-[#181b26] border border-[#232736] text-slate-300 hover:text-slate-100 hover:border-[#32384d] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 font-mono tracking-tight">{projectName}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                Active Workspace
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Vault Path: PROJECTS/{projectName}/
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onExportContext(projectName)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141620] border border-[#232736] text-xs font-medium text-slate-200 hover:text-emerald-400 hover:border-emerald-800/60 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Context Bundle</span>
          </button>
          <button
            onClick={() => onGenerateHandoff(projectName)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md transition-all"
          >
            <span>Generate Handoff</span>
          </button>
        </div>
      </div>

      {/* Workspace Tabs & Content Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[500px]">
        {/* Document Tabs Pane */}
        <div className="space-y-1.5">
          <div className="px-2 pb-1 text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Project Memory Documents
          </div>
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-all text-left border ${
                  isActive
                    ? 'bg-[#181b26] text-emerald-400 border-emerald-600/50 shadow-xs'
                    : 'bg-[#11131a] text-slate-400 border-[#232736] hover:text-slate-200 hover:border-[#32384d]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{t.label}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {tabToFileMap[t.id].replace('.md', '')}
                </span>
              </button>
            );
          })}

          {/* Quick Progress Logger Box */}
          <div className="mt-6 p-4 rounded-xl bg-[#0e111a] border border-[#232736] space-y-3">
            <h4 className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Record Progress</span>
            </h4>
            <form onSubmit={handleRecordProgress} className="space-y-2">
              <input
                type="text"
                placeholder="Task or progress note..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#090a0f] border border-[#232736] rounded-md text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500/80"
              />
              <div className="flex gap-2">
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  className="w-1/2 px-2 py-1 bg-[#090a0f] border border-[#232736] rounded-md text-[11px] font-mono text-slate-300"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
                <button
                  type="submit"
                  disabled={isUpdatingProgress || !newTask.trim()}
                  className="w-1/2 py-1 px-2 rounded-md bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-medium transition-all disabled:opacity-50"
                >
                  {isUpdatingProgress ? 'Logging...' : 'Log Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Document Content View */}
        <div className="lg:col-span-3 p-6 rounded-xl bg-[#11131a] border border-[#232736] overflow-y-auto max-h-[680px]">
          {isLoading ? (
            <div className="text-center py-16 text-xs text-slate-400 font-mono">
              Loading {tabToFileMap[activeTab]}...
            </div>
          ) : (
            <div>
              <div className="pb-3 mb-4 border-b border-[#232736] flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400">
                  PROJECTS/{projectName}/{tabToFileMap[activeTab]}
                </span>
                <span className="text-[10px] font-mono text-slate-400">Obsidian Markdown</span>
              </div>
              <MarkdownPreview content={currentDocContent} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

