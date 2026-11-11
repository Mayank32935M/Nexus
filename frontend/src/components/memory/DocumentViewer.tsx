import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Shield,
  Copy,
  Check,
  Edit3,
  Eye,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { MemoryDocument } from '../../types';
import { MarkdownPreview } from '../common/MarkdownPreview';

interface Props {
  document: MemoryDocument | null;
  onSaveContent: (path: string, content: string) => Promise<void>;
  onProposeUpdate: (path: string, currentContent: string) => void;
  isLoading: boolean;
}

export const DocumentViewer: React.FC<Props> = ({
  document,
  onSaveContent,
  onProposeUpdate,
  isLoading,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when document changes
  React.useEffect(() => {
    if (document) {
      setEditedContent(document.content);
      setIsEditing(false);
    }
  }, [document?.path, document?.content_hash]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 font-mono text-xs">
        Loading document...
      </div>
    );
  }

  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 font-mono text-xs p-8 text-center">
        <FileText className="w-12 h-12 text-slate-700 mb-3" />
        <p className="text-slate-300 font-medium">No document selected</p>
        <p className="text-slate-400 mt-1">Select a markdown file from the vault tree or search above</p>
      </div>
    );
  }

  const isGovernanceProtected = document.permission === 'APPROVAL_REQUIRED' || document.category === 'CORE' || document.category === 'DECISIONS';

  const handleCopy = () => {
    navigator.clipboard.writeText(document.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (isGovernanceProtected) {
      onProposeUpdate(document.path, editedContent);
      return;
    }
    try {
      setIsSaving(true);
      await onSaveContent(document.path, editedContent);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#11131a] rounded-xl border border-[#232736] overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-3.5 border-b border-[#232736] bg-[#161822] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-slate-400">{document.path}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                isGovernanceProtected
                  ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                  : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
              }`}
            >
              {isGovernanceProtected ? 'APPROVAL REQUIRED' : 'WRITE PERMITTED'}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-100 tracking-tight mt-0.5">{document.title}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141620] border border-[#232736] text-xs text-slate-300 hover:text-slate-100 hover:border-[#32384d] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Edit / Preview Toggle */}
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141620] border border-[#232736] text-xs text-slate-300 hover:text-slate-100"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isGovernanceProtected ? 'Propose Changes' : 'Save Changes'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (isGovernanceProtected) {
                  onProposeUpdate(document.path, document.content);
                } else {
                  setIsEditing(true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b26] border border-[#2b334a] text-xs font-medium text-slate-200 hover:text-emerald-400 hover:border-emerald-800 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isGovernanceProtected ? 'Propose Update' : 'Edit File'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Meta info ribbon */}
      <div className="px-6 py-2 border-b border-[#1f2330] bg-[#0d0f17] flex items-center gap-6 text-[11px] font-mono text-slate-400 shrink-0">
        <div>
          Category: <span className="text-slate-300">{document.category}</span>
        </div>
        <div>
          Words: <span className="text-slate-300">{document.word_count}</span>
        </div>
        <div>
          Size: <span className="text-slate-300">{document.file_size} B</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{new Date(document.last_modified).toLocaleString()}</span>
        </div>
      </div>

      {/* Warning banner for governed files */}
      {isGovernanceProtected && isEditing && (
        <div className="px-6 py-2.5 bg-amber-950/30 border-b border-amber-800/40 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            This document is protected by NEXUS governance rules. Submitting edits will create a staged update proposal requiring explicit user approval.
          </span>
        </div>
      )}

      {/* Document Body Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-full min-h-[400px] p-4 bg-[#090a0f] border border-[#232736] rounded-lg font-mono text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500/80 resize-none leading-relaxed"
            placeholder="Type markdown content..."
          />
        ) : (
          <MarkdownPreview content={document.content} />
        )}
      </div>
    </div>
  );
};

