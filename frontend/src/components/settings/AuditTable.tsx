import React, { useState } from 'react';
import { AuditLogEntry } from '../../types';
import { ShieldCheck, Eye, Terminal } from 'lucide-react';
import { Modal } from '../common/Modal';

interface Props {
  logs: AuditLogEntry[];
}

export const AuditTable: React.FC<Props> = ({ logs }) => {
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">Immutable Audit Trail</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Total Entries: {logs.length}</span>
      </div>

      <div className="rounded-xl border border-[#232736] bg-[#11131a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#161822] border-b border-[#232736] text-slate-400">
              <tr>
                <th className="py-2.5 px-4 font-medium">Timestamp</th>
                <th className="py-2.5 px-4 font-medium">Action</th>
                <th className="py-2.5 px-4 font-medium">Agent</th>
                <th className="py-2.5 px-4 font-medium">Resource / Path</th>
                <th className="py-2.5 px-4 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2230]">
              {logs.map((item) => (
                <tr key={item.id} className="hover:bg-[#181b26] transition-colors">
                  <td className="py-2.5 px-4 text-slate-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        item.event_type.includes('PROPOSAL')
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                          : item.event_type === 'DELETE'
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                          : item.event_type === 'CREATE' || item.event_type === 'PROJECT_CREATED'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : 'bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      {item.event_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">{item.agent}</td>
                  <td className="py-2.5 px-4 text-slate-300 truncate max-w-xs">{item.file_path || '—'}</td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedLog(item)}
                      className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-[#1f2433] transition-colors"
                      title="Inspect event details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-mono">
                    No audit records recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event #${selectedLog.id} — ${selectedLog.event_type}`}
          subtitle={`Logged at ${selectedLog.timestamp} by ${selectedLog.agent}`}
          maxWidth="md"
        >
          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-slate-400">Resource Path:</span>
              <div className="p-2 rounded bg-[#090a0f] text-slate-200 mt-1">{selectedLog.file_path || 'None'}</div>
            </div>
            <div>
              <span className="text-slate-400">Payload Metadata:</span>
              <pre className="p-3 rounded bg-[#090a0f] text-emerald-400 overflow-x-auto mt-1">
                <code>{JSON.stringify(selectedLog.details, null, 2)}</code>
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

