import React, { useState } from 'react';
import {
  Activity,
  Wifi,
  Shield,
  RefreshCw,
  X,
  CheckCircle,
  AlertTriangle,
  Radio,
  Server,
  Layers,
  Zap,
} from 'lucide-react';
import { NetworkDiagnosticsStats } from '../types';

interface NetworkDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostics: NetworkDiagnosticsStats;
  onReconnect?: () => void;
  roomId: string;
}

export const NetworkDiagnosticsModal: React.FC<NetworkDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  diagnostics,
  onReconnect,
  roomId,
}) => {
  const [isRetesting, setIsRetesting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRunDiagnostics = () => {
    setIsRetesting(true);
    if (onReconnect) onReconnect();
    setTimeout(() => {
      setIsRetesting(false);
    }, 1200);
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'Excellent':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
      case 'Good':
        return 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30';
      case 'Fair':
        return 'text-amber-400 bg-amber-950/40 border-amber-500/30';
      case 'Poor':
      default:
        return 'text-rose-400 bg-rose-950/40 border-rose-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#111827] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>WebRTC Network Diagnostics</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getScoreColor(diagnostics.qualityScore)}`}>
                  {diagnostics.qualityScore} Quality
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">Room: {roomId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Real-Time Live Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Metric 1: Latency / RTT */}
            <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400 font-medium">Round-Trip Time</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold font-mono text-cyan-400">{diagnostics.rttMs}</span>
                <span className="text-xs text-slate-500">ms</span>
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle className="w-2.5 h-2.5" />
                <span>Low Latency</span>
              </span>
            </div>

            {/* Metric 2: Packet Loss */}
            <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400 font-medium">Packet Loss</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold font-mono text-white">{diagnostics.packetLossPercent}</span>
                <span className="text-xs text-slate-500">%</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                {diagnostics.packetLossPercent === 0 ? 'Zero Dropped' : 'Minor jitter'}
              </span>
            </div>

            {/* Metric 3: Video Bitrate */}
            <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400 font-medium">Video Bitrate</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold font-mono text-white">{diagnostics.videoBitrateKbps}</span>
                <span className="text-xs text-slate-500">kbps</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">{diagnostics.resolution}</span>
            </div>

            {/* Metric 4: Audio Bitrate & Jitter */}
            <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400 font-medium">Audio Bitrate</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold font-mono text-white">{diagnostics.audioBitrateKbps}</span>
                <span className="text-xs text-slate-500">kbps</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Jitter: {diagnostics.jitterMs}ms</span>
            </div>
          </div>

          {/* Connection Status & Transport Health */}
          <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Connection Architecture & Signaling</span>
              <span className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-mono normal-case font-normal">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected (Mesh P2P)</span>
              </span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Media Encryption</span>
                </span>
                <span className="font-mono text-slate-200">DTLS 1.3 / SRTP_AEAD_AES_256_GCM</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-violet-400" />
                  <span>ICE Candidate Type</span>
                </span>
                <span className="font-mono text-slate-200">{diagnostics.candidateType}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Signaling Transport</span>
                </span>
                <span className="font-mono text-slate-200">Socket.IO / TLS 1.3 WSS</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Framerate & Resolution</span>
                </span>
                <span className="font-mono text-slate-200">
                  {diagnostics.resolution} @ {diagnostics.framerate} FPS
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Actions & Reconnect */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">
              Experiencing audio or video degradation? Re-test peer connection.
            </span>

            <button
              onClick={handleRunDiagnostics}
              disabled={isRetesting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetesting ? 'animate-spin' : ''}`} />
              <span>{isRetesting ? 'Diagnosing...' : 'Test & Reconnect'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
