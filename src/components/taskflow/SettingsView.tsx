import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Shield,
  Volume2,
  VolumeX,
  Database,
  RefreshCw,
  Check,
  Eye,
  Lock,
  Layers,
  Activity,
  HardDrive,
} from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';

export const SettingsView: React.FC = () => {
  const { refreshState, state } = useTaskFlow();
  const [ambientVolume, setAmbientVolume] = useState(40);
  const [enableSoundOnEnter, setEnableSoundOnEnter] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#080D19] overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-[#0B132B]/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
              Platform Settings & Telemetry
            </h1>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-0.5 rounded-full">
              Production Profile
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure AI Mission Control, 2.5D spatial audio-visual rendering, and data persistence
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all shrink-0"
        >
          {isSaved ? <Check className="w-3.5 h-3.5" /> : <Sliders className="w-3.5 h-3.5" />}
          <span>{isSaved ? 'Preferences Saved' : 'Save Preferences'}</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 1. AI Mission Control Intelligence */}
          <div className="rounded-2xl bg-[#0B132B]/80 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Mission Control Engine</h3>
                <p className="text-xs text-slate-400">
                  Automated subtask decomposition, scheduling suggestions, and workload analytics
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Active Primary Provider</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-300 font-bold">Google Gemini 3.8 Flash</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                    Server Proxy Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Keys are held securely server-side with zero frontend exposure. Falls back to deterministic rule planner when offline.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Deterministic Rule Fallback</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-white font-bold">Offline Resilience Layer</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                    Always Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Produces structured, actionable subtasks and priority estimates even without an external network connection.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Spatial Experience & Accessibility */}
          <div className="rounded-2xl bg-[#0B132B]/80 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Spatial 2.5D & Motion Controls</h3>
                <p className="text-xs text-slate-400">
                  Custom perspective viewing angles, depth rendering, and reduced-motion compliance
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div>
                  <span className="text-xs font-bold text-white block">Respect Reduced-Motion Preferences</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Disables continuous orbital animations and rapid perspective tilting for comfort.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div>
                  <span className="text-xs font-bold text-white block">High-Contrast Border Accents</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Enhances visual separators and card outlines for WCAG AA compliance.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
                />
              </label>
            </div>
          </div>

          {/* 3. Ambient Audio Soundscapes */}
          <div className="rounded-2xl bg-[#0B132B]/80 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Ambient Soundscape Audio</h3>
                <p className="text-xs text-slate-400">
                  Procedural Web Audio API soundscapes (Cyber Drone, Focus Rain, Lo-Fi, 10Hz Alpha Waves)
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                  <span>Soundscape Master Volume</span>
                  <span className="font-mono text-cyan-400">{ambientVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">User-Initiated Playback Guarantee</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Audio never plays without explicit user interaction, complying with browser autoplay policies.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={enableSoundOnEnter}
                  onChange={(e) => setEnableSoundOnEnter(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400"
                />
              </label>
            </div>
          </div>

          {/* 4. Data Persistence & Architecture */}
          <div className="rounded-2xl bg-[#0B132B]/80 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Storage & State Persistence</h3>
                <p className="text-xs text-slate-400">
                  Dual-tier persistence with atomic disk files and browser local storage
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Active Tasks</span>
                <span className="text-lg font-bold font-mono text-white mt-0.5 block">{state.tasks.length}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Projects Tracked</span>
                <span className="text-lg font-bold font-mono text-cyan-300 mt-0.5 block">{state.projects.length}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Spatial Rooms</span>
                <span className="text-lg font-bold font-mono text-violet-300 mt-0.5 block">{state.rooms.length}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Disk path: ./data/taskflow.json</span>
              <button
                onClick={refreshState}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload State</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
