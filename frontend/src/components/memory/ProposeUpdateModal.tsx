import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ShieldAlert, Send } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  initialContent: string;
  onSubmit: (filePath: string, proposedContent: string, reason: string) => Promise<void>;
}

export const ProposeUpdateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  filePath,
  initialContent,
  onSubmit,
}) => {
  const [content, setContent] = useState(initialContent);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setContent(initialContent);
    setReason('');
    setError(null);
  }, [filePath, initialContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason / rationale for this staged update proposal.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(filePath, content, reason);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Propose Memory Update"
      subtitle={`Staged proposal for governed document: ${filePath}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            Changes to <strong className="font-mono text-amber-200">{filePath}</strong> require governance sign-off.
            This proposal will generate a unified diff and await human approval in the Pending Approvals queue.
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">
            Reason / Rationale for Update <span className="text-emerald-400">*</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Added new security directive or updated ADR consequences"
            className="w-full px-3 py-2 bg-[#0d0f17] border border-[#232736] rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500/80"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">
            Proposed Markdown Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full p-3 bg-[#090a0f] border border-[#232736] rounded-lg font-mono text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500/80 leading-relaxed"
          />
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
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Proposal'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

