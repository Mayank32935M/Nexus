import React, { useState, useEffect } from 'react';
import { Bot, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { api } from '../../api/client';

export const MCPConfigCard: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getMcpConfig().then(setConfig).catch(console.error);
  }, []);

  const handleCopy = () => {
    if (config) {
      navigator.clipboard.writeText(JSON.stringify(config.config_json, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-5 rounded-xl bg-[#11131a] border border-[#232736] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Claude Desktop MCP Configuration</h3>
            <p className="text-xs text-slate-400">Connect Claude Desktop directly to your local NEXUS memory vault</p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b26] border border-[#2b334a] text-xs font-medium text-emerald-400 hover:bg-[#1f2433] hover:border-emerald-700/60 transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Snippet' : 'Copy Config JSON'}</span>
        </button>
      </div>

      <div className="p-3.5 rounded-lg bg-[#0d0f17] border border-[#1f2330] space-y-2 text-xs font-mono text-slate-300">
        <div className="flex items-center justify-between text-slate-400">
          <span>Target Configuration File (Windows 11):</span>
          <span className="text-amber-400 font-semibold">%APPDATA%\Claude\claude_desktop_config.json</span>
        </div>
      </div>

      {config && (
        <pre className="p-4 bg-[#090a0f] border border-[#232736] rounded-lg font-mono text-xs text-cyan-300/90 overflow-x-auto leading-relaxed">
          <code>{JSON.stringify(config.config_json, null, 2)}</code>
        </pre>
      )}

      <div className="p-3.5 rounded-lg bg-[#0e111a] border border-[#232736] text-xs text-slate-400 space-y-1">
        <div className="font-semibold text-slate-200">Tools Exposed to Claude Desktop:</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px] text-slate-300 mt-2">
          <div className="p-1.5 bg-[#141620] rounded border border-[#232736]">search_memory</div>
          <div className="p-1.5 bg-[#141620] rounded border border-[#232736]">read_memory</div>
          <div className="p-1.5 bg-[#141620] rounded border border-[#232736]">list_projects</div>
          <div className="p-1.5 bg-[#141620] rounded border border-[#232736]">get_project_context</div>
          <div className="p-1.5 bg-[#141620] rounded border border-[#232736]">get_recent_decisions</div>
          <div className="p-1.5 bg-[#141620] rounded border border-[#232736]">create_session_summary</div>
          <div className="p-1.5 bg-[#141620] rounded border border-[#232736]">propose_memory_update</div>
          <div className="p-1.5 bg-[#141620] rounded border border-[#232736]">update_project_progress</div>
        </div>
      </div>
    </div>
  );
};

