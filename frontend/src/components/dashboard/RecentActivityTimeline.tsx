import React from 'react';
import { AuditLogEntry } from '../../types';
import { FileEdit, ShieldAlert, Check, PlusCircle, Trash2, Search, ArrowRight } from 'lucide-react';

interface Props {
  auditLogs: AuditLogEntry[];
  onSelectFile?: (path: string) => void;
}

export const RecentActivityTimeline: React.FC<Props> = ({ auditLogs, onSelectFile }) => {
  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'CREATE':
      case 'PROJECT_CREATED':
        return <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'UPDATE':
      case 'PROPOSAL_APPROVED':
        return <FileEdit className="w-3.5 h-3.5 text-cyan-400" />;
      case 'PROPOSAL_CREATED':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
      case 'DELETE':
        return <Trash2 className="w-3.5 h-3.5 text-rose-400" />;
      case 'READ':
        return <Search className="w-3.5 h-3.5 text-slate-400" />;
      default:
        return <Check className="w-3.5 h-3.5 text-slate-300" />;
    }
  };

  return (
    <div className="p-4 rounded-xl bg-[#11131a] border border-[#232736]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Provenance & Memory Activity</h3>
        <span className="text-[11px] font-mono text-slate-400">Live Audit Trail</span>
      </div>

      <div className="space-y-3">
        {auditLogs.slice(0, 7).map((log) => {
          const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const date = new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

          return (
            <div
              key={log.id}
              className="flex items-start justify-between p-2.5 rounded-lg bg-[#0d0f17] border border-[#1f2330] hover:border-[#2f3549] transition-all text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-1 rounded bg-[#161824] border border-[#232736] mt-0.5">
                  {getIcon(log.event_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-slate-200">{log.event_type}</span>
                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-[#1c202c]">
                      {log.agent}
                    </span>
                  </div>
                  {log.file_path && (
                    <button
                      onClick={() => onSelectFile && onSelectFile(log.file_path!)}
                      className="text-xs text-slate-300 hover:text-emerald-400 font-mono mt-0.5 text-left truncate max-w-sm block"
                    >
                      {log.file_path}
                    </button>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-mono text-slate-400 text-[11px]">{time}</div>
                <div className="text-[10px] text-slate-400">{date}</div>
              </div>
            </div>
          );
        })}

        {auditLogs.length === 0 && (
          <div className="text-center py-6 text-xs text-slate-400 font-mono">
            No audit records captured yet.
          </div>
        )}
      </div>
    </div>
  );
};

