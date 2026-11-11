import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Copy, Check, Sparkles, Download } from 'lucide-react';
import { ProjectContextBundle } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  context: ProjectContextBundle | null;
}

export const ContextBundleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  context,
}) => {
  const [copied, setCopied] = useState(false);

  if (!context) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(context.context_bundle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([context.context_bundle], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${context.project_name}_CONTEXT_BUNDLE.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`AI Context Bundle — ${context.project_name}`}
      subtitle="Aggregated multi-document operational context for injection into external AI models"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d0f17] border border-[#232736]">
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Ready for Claude Desktop, ChatGPT, Gemini, or Local LLMs</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141620] border border-[#232736] text-xs text-slate-300 hover:text-slate-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Download .md</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Full Bundle'}</span>
            </button>
          </div>
        </div>

        <pre className="p-4 bg-[#090a0f] border border-[#232736] rounded-lg font-mono text-xs text-emerald-300/90 overflow-x-auto max-h-[460px] leading-relaxed">
          <code>{context.context_bundle}</code>
        </pre>
      </div>
    </Modal>
  );
};

