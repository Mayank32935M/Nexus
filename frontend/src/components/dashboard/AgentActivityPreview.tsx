import React from 'react';
import { Mic, Terminal, Bot, Workflow, Sparkles, Shield } from 'lucide-react';

export const AgentActivityPreview: React.FC = () => {
  return (
    <div className="p-4 rounded-xl bg-[#11131a] border border-[#232736]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">JARVIS & Agent Activity Mesh</h3>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40">
          Architecture Phase 3 & 4
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        {/* Agent 1: JARVIS Operator */}
        <div className="p-3 rounded-lg bg-[#0d0f17] border border-[#1f2330]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              JARVIS Operator
            </span>
            <span className="text-[10px] font-mono text-slate-400">Standby</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Voice recognition & local computer action pipeline. Waiting for Phase 3 activation.
          </p>
        </div>

        {/* Agent 2: Architecture Reviewer */}
        <div className="p-3 rounded-lg bg-[#0d0f17] border border-[#1f2330]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              Architecture Sentinel
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Governance Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Automated boundary checks and staged approval enforcement for CORE/ and DECISIONS/.
          </p>
        </div>

        {/* Agent 3: Multi-Model Handoff Mesh */}
        <div className="p-3 rounded-lg bg-[#0d0f17] border border-[#1f2330]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Handoff Router
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Online</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Lossless context packaging across ChatGPT, Claude, Gemini, and Local LLMs.
          </p>
        </div>
      </div>
    </div>
  );
};

