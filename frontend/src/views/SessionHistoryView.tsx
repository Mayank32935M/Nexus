import React, { useState, useEffect } from 'react';
import { SessionRecord, MemoryDocument } from '../types';
import { api } from '../api/client';
import { HandoffModal } from '../components/handoff/HandoffModal';
import { MarkdownPreview } from '../components/common/MarkdownPreview';
import {
  History,
  Sparkles,
  Copy,
  Check,
  FileText,
  Calendar,
  Bot,
  ArrowRight,
} from 'lucide-react';

export const SessionHistoryView: React.FC = () => {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);
  const [docContent, setDocContent] = useState<MemoryDocument | null>(null);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const res = await api.listSessions();
      setSessions(res);
      if (res.length > 0 && !selectedSession) {
        setSelectedSession(res[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSession && selectedSession.file_path) {
      api
        .readMemoryFile(selectedSession.file_path)
        .then(setDocContent)
        .catch(() => setDocContent(null));
    }
  }, [selectedSession]);

  const handleCopy = () => {
    if (docContent) {
      navigator.clipboard.writeText(docContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action banner */}
      <div className="p-4 rounded-xl bg-[#11131a] border border-[#232736] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Session History & AI Handoffs</h2>
            <p className="text-xs text-slate-400 font-mono">
              Structured lossless context transfers stored permanently in AI-HANDOFF/
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsHandoffModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>New AI Handoff</span>
        </button>
      </div>

      {/* Main split view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-14rem)]">
        {/* Left list of sessions */}
        <div className="p-4 rounded-xl bg-[#11131a] border border-[#232736] overflow-y-auto space-y-2">
          <div className="px-1 pb-2 text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
            <span>Historical Sessions</span>
            <span>{sessions.length} total</span>
          </div>

          {sessions.map((sess) => {
            const isSel = selectedSession?.id === sess.id;
            return (
              <button
                key={sess.id}
                onClick={() => setSelectedSession(sess)}
                className={`w-full p-3 rounded-lg text-left transition-all border ${
                  isSel
                    ? 'bg-[#181b26] border-emerald-500/60 shadow-xs'
                    : 'bg-[#0d0f17] border-[#1f2330] hover:border-[#32384d]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1f2433] text-emerald-400 border border-emerald-900/40 font-semibold">
                    {sess.target_model}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(sess.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{sess.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{sess.summary}</p>
                {sess.project && (
                  <span className="mt-1 inline-block text-[10px] font-mono text-slate-400">
                    Project: {sess.project}
                  </span>
                )}
              </button>
            );
          })}

          {sessions.length === 0 && !isLoading && (
            <div className="text-center py-12 text-xs font-mono text-slate-400">
              No session handoffs generated yet.
            </div>
          )}
        </div>

        {/* Right view of the selected handoff document */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-[#11131a] border border-[#232736] overflow-y-auto flex flex-col justify-between">
          {selectedSession && docContent ? (
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#232736]">
                <div>
                  <span className="text-[11px] font-mono text-emerald-400">{docContent.path}</span>
                  <h3 className="text-sm font-bold text-slate-100 mt-0.5">{docContent.title}</h3>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b26] border border-[#2b334a] text-xs font-medium text-slate-200 hover:text-emerald-400 hover:border-emerald-700 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Handoff'}</span>
                </button>
              </div>

              <MarkdownPreview content={docContent.content} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs font-mono text-slate-400">
              Select a session on the left to read full handoff context
            </div>
          )}
        </div>
      </div>

      <HandoffModal
        isOpen={isHandoffModalOpen}
        onClose={() => setIsHandoffModalOpen(false)}
        onHandoffGenerated={loadSessions}
      />
    </div>
  );
};

