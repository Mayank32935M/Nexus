import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Check, X, ShieldAlert, FileText, ChevronRight } from 'lucide-react';
import { ApprovalRecord } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  approvals: ApprovalRecord[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  onRefresh: () => void;
}

export const ApprovalsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  approvals,
  onApprove,
  onReject,
  onRefresh,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const selected = approvals.find((a) => a.id === selectedId) || approvals[0] || null;

  const handleApprove = async (id: string) => {
    try {
      setIsProcessing(true);
      await onApprove(id);
      onRefresh();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setIsProcessing(true);
      await onReject(id, rejectReason);
      setRejectReason('');
      onRefresh();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pending Approvals & Governance Queue"
      subtitle="Review staged modifications to protected memory documents"
      maxWidth="4xl"
    >
      {approvals.length === 0 ? (
        <div className="py-12 text-center text-slate-400 font-mono text-xs">
          <ShieldAlert className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
          <p className="text-slate-300 font-medium">No pending proposals</p>
          <p className="text-slate-400 mt-1">All memory modifications are compliant and verified.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[420px]">
          {/* List column */}
          <div className="space-y-2 border-r border-[#232736] pr-4 max-h-[500px] overflow-y-auto">
            {approvals.map((item) => {
              const isItemSel = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all border ${
                    isItemSel
                      ? 'bg-[#181b26] border-emerald-500/60 shadow-xs'
                      : 'bg-[#0d0f17] border-[#1f2330] hover:border-[#32384d]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60 font-semibold">
                      {item.action}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 truncate">{item.file_path}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.reason}</div>
                  <div className="mt-1 text-[10px] font-mono text-slate-400">By: {item.agent}</div>
                </button>
              );
            })}
          </div>

          {/* Diff & Review column */}
          {selected ? (
            <div className="md:col-span-2 flex flex-col justify-between pl-2">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#232736]">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 font-mono">{selected.file_path}</h4>
                    <p className="text-xs text-amber-400/90 mt-0.5">Reason: {selected.reason}</p>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-400">
                    <div>Proposal ID: {selected.id.slice(0, 8)}...</div>
                    <div>Agent: {selected.agent}</div>
                  </div>
                </div>

                {/* Diff Viewer */}
                <div className="mt-3">
                  <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                    <span>Unified Diff</span>
                    <span className="text-emerald-400">+ Additions</span>
                  </div>
                  <pre className="p-3 bg-[#090a0f] border border-[#232736] rounded-lg font-mono text-xs overflow-x-auto max-h-72 leading-relaxed">
                    {selected.diff ? (
                      selected.diff.split('\n').map((line, lIdx) => {
                        let color = 'text-slate-300';
                        if (line.startsWith('+') && !line.startsWith('+++')) color = 'text-emerald-400 bg-emerald-950/30';
                        else if (line.startsWith('-') && !line.startsWith('---')) color = 'text-rose-400 bg-rose-950/30';
                        else if (line.startsWith('@@')) color = 'text-cyan-400 font-bold';

                        return (
                          <div key={lIdx} className={color}>
                            {line}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-slate-400 italic">No textual diff available.</span>
                    )}
                  </pre>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-[#232736] flex items-center justify-between gap-3 mt-4">
                <input
                  type="text"
                  placeholder="Optional rejection reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#0d0f17] border border-[#232736] rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-rose-500/60"
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(selected.id)}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs font-medium text-rose-300 hover:bg-rose-900/60 transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(selected.id)}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md transition-all disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Apply</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="md:col-span-2 flex items-center justify-center text-xs text-slate-400 font-mono">
              Select a proposal to inspect diff
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

