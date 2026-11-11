import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Sparkles, Plus, Trash2, Send, Copy, Check } from 'lucide-react';
import { api } from '../../api/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultProject?: string;
  onHandoffGenerated?: () => void;
}

export const HandoffModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultProject,
  onHandoffGenerated,
}) => {
  const [targetModel, setTargetModel] = useState('Claude Desktop');
  const [sessionTitle, setSessionTitle] = useState('');
  const [currentGoal, setCurrentGoal] = useState('');
  const [completedItems, setCompletedItems] = useState<string[]>(['']);
  const [decisions, setDecisions] = useState<string[]>(['']);
  const [nextSteps, setNextSteps] = useState<string[]>(['']);
  const [projectName, setProjectName] = useState(defaultProject || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<{ path: string; content: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (defaultProject) setProjectName(defaultProject);
  }, [defaultProject]);

  const addField = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, '']);
  };

  const updateField = (
    index: number,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const removeField = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim() || !currentGoal.trim()) {
      setError('Please provide a session title and primary goal.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      const res = await api.generateHandoff({
        session_title: sessionTitle.trim(),
        target_model: targetModel,
        current_goal: currentGoal.trim(),
        completed_work: completedItems.filter((i) => i.trim()),
        decisions_made: decisions.filter((i) => i.trim()),
        next_steps: nextSteps.filter((i) => i.trim()),
        project_name: projectName.trim() || undefined,
      });

      setGeneratedDoc({ path: res.file_path, content: res.content });
      if (onHandoffGenerated) onHandoffGenerated();
    } catch (err: any) {
      setError(err.message || 'Failed to generate handoff');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedDoc) {
      navigator.clipboard.writeText(generatedDoc.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setGeneratedDoc(null);
    setSessionTitle('');
    setCurrentGoal('');
    setCompletedItems(['']);
    setDecisions(['']);
    setNextSteps(['']);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate AI Session Handoff"
      subtitle="Creates a structured, lossless context transfer document for external AI models"
      maxWidth="4xl"
    >
      {generatedDoc ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-400 font-mono">
                Handoff Document Generated & Stored
              </div>
              <div className="text-xs text-slate-300 font-mono mt-0.5">{generatedDoc.path}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Handoff'}</span>
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-[#141620] border border-[#232736] text-xs text-slate-300 hover:text-slate-100"
              >
                New Handoff
              </button>
            </div>
          </div>

          <pre className="p-4 bg-[#090a0f] border border-[#232736] rounded-lg font-mono text-xs text-emerald-300/90 overflow-x-auto max-h-96 leading-relaxed">
            <code>{generatedDoc.content}</code>
          </pre>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Target AI Model <span className="text-emerald-400">*</span>
              </label>
              <select
                value={targetModel}
                onChange={(e) => setTargetModel(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d0f17] border border-[#232736] rounded-lg text-xs font-mono text-slate-200"
              >
                <option value="Claude Desktop">Claude Desktop (MCP / Context)</option>
                <option value="ChatGPT (GPT-4o/o3)">ChatGPT (GPT-4o / o-series)</option>
                <option value="Google Gemini">Google Gemini (Research / Multimodal)</option>
                <option value="Local Ollama">Local Ollama (Private Local LLM)</option>
                <option value="General">General / Future Agent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Associated Project</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. SPECTRIX (optional)"
                className="w-full px-3 py-2 bg-[#0d0f17] border border-[#232736] rounded-lg text-xs font-mono text-slate-100 uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Session Title <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="e.g. Memory Indexer and Search Implementation"
              className="w-full px-3 py-2 bg-[#0d0f17] border border-[#232736] rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500/80"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Primary Goal & Context Summary <span className="text-emerald-400">*</span>
            </label>
            <textarea
              value={currentGoal}
              onChange={(e) => setCurrentGoal(e.target.value)}
              placeholder="What was the purpose of this session, and what background should the next model know?"
              rows={3}
              className="w-full p-3 bg-[#0d0f17] border border-[#232736] rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500/80 leading-relaxed"
            />
          </div>

          {/* Completed Work items */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-slate-300">Completed Work Checklist</label>
              <button
                type="button"
                onClick={() => addField(setCompletedItems)}
                className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            <div className="space-y-1.5">
              {completedItems.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateField(idx, e.target.value, setCompletedItems)}
                    placeholder="e.g. Implemented FTS5 search indexer"
                    className="flex-1 px-3 py-1.5 bg-[#0d0f17] border border-[#232736] rounded-md text-xs text-slate-200"
                  />
                  {completedItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField(idx, setCompletedItems)}
                      className="p-1.5 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Decisions Made */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-slate-300">Key Architectural Decisions</label>
              <button
                type="button"
                onClick={() => addField(setDecisions)}
                className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Decision
              </button>
            </div>
            <div className="space-y-1.5">
              {decisions.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateField(idx, e.target.value, setDecisions)}
                    placeholder="e.g. Dual-Store Architecture: Markdown + SQLite"
                    className="flex-1 px-3 py-1.5 bg-[#0d0f17] border border-[#232736] rounded-md text-xs text-slate-200"
                  />
                  {decisions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField(idx, setDecisions)}
                      className="p-1.5 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-slate-300">Immediate Next Steps for Next Agent</label>
              <button
                type="button"
                onClick={() => addField(setNextSteps)}
                className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Next Step
              </button>
            </div>
            <div className="space-y-1.5">
              {nextSteps.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateField(idx, e.target.value, setNextSteps)}
                    placeholder="e.g. Build MCP server stdio transport"
                    className="flex-1 px-3 py-1.5 bg-[#0d0f17] border border-[#232736] rounded-md text-xs text-slate-200"
                  />
                  {nextSteps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField(idx, setNextSteps)}
                      className="p-1.5 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
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
              className="px-4 py-2 rounded-lg bg-[#141620] border border-[#232736] text-xs font-medium text-slate-300 hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating...' : 'Generate Handoff Document'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
