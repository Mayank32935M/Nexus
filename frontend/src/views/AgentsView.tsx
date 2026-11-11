import React, { useState, useEffect } from 'react';
import { ProviderItem } from '../types';
import { api } from '../api/client';
import {
  Bot,
  Cpu,
  Sparkles,
  MessageSquare,
  Mic,
  RotateCw,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
} from 'lucide-react';

export const AgentsView: React.FC = () => {
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingOllama, setIsTestingOllama] = useState(false);
  const [ollamaResult, setOllamaResult] = useState<any>(null);

  const loadProviders = async () => {
    try {
      setIsLoading(true);
      const res = await api.getProviders();
      setProviders(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleTestOllama = async () => {
    try {
      setIsTestingOllama(true);
      const res = await api.testOllama();
      setOllamaResult(res);
      await loadProviders();
    } catch (err) {
      console.error(err);
    } finally {
      setIsTestingOllama(false);
    }
  };

  const getProviderIcon = (kind: string) => {
    switch (kind) {
      case 'local':
        return <Cpu className="w-5 h-5 text-emerald-400" />;
      case 'mcp':
        return <Bot className="w-5 h-5 text-cyan-400" />;
      case 'connector':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'agent':
        return <Mic className="w-5 h-5 text-amber-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-slate-300" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-[#11131a] border border-[#232736] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-100">AI Model Providers & Agent Ecosystem</h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Provider-independent modular architecture. Core system operates 100% offline.
          </p>
        </div>
        <button
          onClick={loadProviders}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b26] border border-[#232736] text-xs font-mono text-slate-300 hover:text-emerald-400 transition-colors"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Providers</span>
        </button>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-xl bg-[#11131a] border border-[#232736] flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#181b26] border border-[#232736]">
                    {getProviderIcon(p.kind)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{p.name}</h3>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{p.kind} Adapter</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
                    p.connected
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                      : p.kind === 'agent'
                      ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800/60'
                  }`}
                >
                  {p.connected ? 'ONLINE / CONNECTED' : p.kind === 'agent' ? 'ROADMAP PHASE 3' : 'NOT CONNECTED'}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mt-2">{p.description}</p>
            </div>

            <div className="p-3 rounded-lg bg-[#0d0f17] border border-[#1f2330] space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Endpoint / Protocol:</span>
                <span className="text-slate-200">{p.endpoint}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status Message:</span>
                <span className="text-slate-300 truncate max-w-xs">{p.status_message}</span>
              </div>
              {p.models.length > 0 && (
                <div>
                  <span className="text-slate-400 block mb-1">Available Models:</span>
                  <div className="flex flex-wrap gap-1">
                    {p.models.map((m) => (
                      <span key={m} className="px-1.5 py-0.5 rounded bg-[#161924] border border-[#232736] text-[10px] text-emerald-300">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {p.id === 'ollama' && (
              <div className="pt-2 border-t border-[#1d212e] flex items-center justify-between">
                <button
                  onClick={handleTestOllama}
                  disabled={isTestingOllama}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b26] border border-[#2b334a] text-xs font-mono text-emerald-400 hover:bg-[#1f2433] transition-all disabled:opacity-50"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{isTestingOllama ? 'Probing...' : 'Probe Local Ollama Daemon'}</span>
                </button>
                {ollamaResult && (
                  <span className="text-[11px] font-mono text-slate-400">
                    {ollamaResult.connected ? '✓ Responded' : '✗ Offline'}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Autonomous JARVIS Section */}
      <div className="p-5 rounded-xl bg-[#11131a] border border-[#232736] space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">JARVIS Personal AI Operator</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
                Phase 3 Architecture
              </span>
            </div>
            <p className="text-xs text-slate-400">Voice-controlled assistant, wake-word detection, and OS operator</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono pt-2">
          <div className="p-3 rounded-lg bg-[#0d0f17] border border-[#1f2330]">
            <span className="text-amber-400 font-semibold block mb-1">1. Voice Recognition</span>
            <span className="text-slate-400 text-[11px]">Local Whisper / Vosk pipeline for wake-word and commands.</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0d0f17] border border-[#1f2330]">
            <span className="text-amber-400 font-semibold block mb-1">2. TTS Engine</span>
            <span className="text-slate-400 text-[11px]">Piper / pyttsx3 offline text-to-speech feedback.</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0d0f17] border border-[#1f2330]">
            <span className="text-amber-400 font-semibold block mb-1">3. System Monitor</span>
            <span className="text-slate-400 text-[11px]">CPU, RAM, GPU, process tracking and diagnostics.</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0d0f17] border border-[#1f2330]">
            <span className="text-amber-400 font-semibold block mb-1">4. Governed Actions</span>
            <span className="text-slate-400 text-[11px]">Permission-controlled application launcher & file operations.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

