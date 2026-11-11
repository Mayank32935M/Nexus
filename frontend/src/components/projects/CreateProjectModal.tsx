import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FolderPlus, Layers, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
}

export const CreateProjectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreate(name.trim(), description.trim());
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project Workspace"
      subtitle="Initializes standardized 6-document memory architecture in vault"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">
            Project Identifier / Name <span className="text-emerald-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. MY-APP or DATA-ENGINE"
            className="w-full px-3 py-2 bg-[#0d0f17] border border-[#232736] rounded-lg text-xs font-mono text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500/80 uppercase"
          />
          <p className="text-[11px] text-slate-400 mt-1">Alphanumeric characters, hyphens, and underscores.</p>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">
            Primary Goal & Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="High-level description of objectives and stack..."
            rows={3}
            className="w-full p-3 bg-[#0d0f17] border border-[#232736] rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500/80 leading-relaxed"
          />
        </div>

        <div className="p-3.5 rounded-lg bg-[#0d0f17] border border-[#1f2330] space-y-2">
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Standard Architecture Documents Generated:</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-400" /> PROJECT-OVERVIEW.md
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-400" /> CURRENT-STATE.md
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-400" /> ARCHITECTURE.md
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-400" /> DECISIONS.md
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-400" /> TASKS.md
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-400" /> CHANGELOG.md
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#232736]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#141620] border border-[#232736] text-xs font-medium text-slate-300 hover:text-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md transition-all disabled:opacity-50"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Creating...' : 'Initialize Workspace'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

