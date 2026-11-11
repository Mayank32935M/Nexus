import React from 'react';
import { Cpu, Bot, Sparkles, MessageSquare, Mic, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { SystemStatus } from '../../types';

interface Props {
  integrations: SystemStatus['integrations'] | undefined;
  onNavigateToAgents: () => void;
}

export const IntegrationGrid: React.FC<Props> = ({ integrations, onNavigateToAgents }) => {
  if (!integrations) return null;

  const items = [
    {
      key: 'mcp_server',
      name: 'Claude Desktop (MCP)',
      icon: Bot,
      status: 'READY',
      badgeColor: 'cyan',
      description: 'Stdio bridge exposing 8 memory tools with governance checks.',
      details: 'MCP v2.3 compliant',
    },
    {
      key: 'ollama',
      name: 'Local Ollama',
      icon: Cpu,
      status: integrations.ollama?.connected ? 'CONNECTED' : 'DISCONNECTED',
      badgeColor: integrations.ollama?.connected ? 'emerald' : 'slate',
      description: integrations.ollama?.connected
        ? integrations.ollama.status_message
        : 'Offline: Daemon not detected on http://127.0.0.1:11434',
      details: integrations.ollama?.available_models?.length
        ? `${integrations.ollama.available_models.length} model(s) installed`
        : 'No local models found',
    },
    {
      key: 'chatgpt',
      name: 'ChatGPT Connector',
      icon: MessageSquare,
      status: 'HANDOFF READY',
      badgeColor: 'emerald',
      description: 'Structured, lossless session handoff generator for GPT-4o and o-series.',
      details: 'Markdown protocol',
    },
    {
      key: 'gemini',
      name: 'Google Gemini',
      icon: Sparkles,
      status: 'HANDOFF READY',
      badgeColor: 'emerald',
      description: 'Research and multimodal context handoff ready for Gemini Pro/Flash.',
      details: 'Structured export',
    },
    {
      key: 'jarvis',
      name: 'JARVIS Operator',
      icon: Mic,
      status: 'ROADMAP (PHASE 3)',
      badgeColor: 'amber',
      description: 'Voice-controlled assistant, wake-word detection, and OS operator.',
      details: 'Architecture planned',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Ecosystem Integrations</h3>
        <button
          onClick={onNavigateToAgents}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-mono transition-colors"
        >
          View Agent Roster →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isConnected = item.status === 'CONNECTED' || item.status === 'READY' || item.status === 'HANDOFF READY';

          return (
            <div
              key={item.key}
              className="p-3.5 rounded-xl bg-[#11131a] border border-[#232736] hover:border-[#32384d] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-[#181b26] border border-[#232736] text-slate-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                      item.badgeColor === 'emerald'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                        : item.badgeColor === 'cyan'
                        ? 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60'
                        : item.badgeColor === 'amber'
                        ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800/60'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#1d212e] flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{item.details}</span>
                {isConnected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

