import React, { useState } from 'react';
import {
  Video,
  PenTool,
  Share2,
  Lock,
  ArrowRight,
  Shield,
  FileCheck,
  Zap,
  Globe,
  Sparkles,
  Users,
} from 'lucide-react';

import { extractMeetingCode } from './JoinMeetingModal';

interface LandingPageProps {
  onStartInstantMeeting: () => void;
  onJoinWithCode: (code: string) => void;
  onOpenSecurity: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenJoinModal?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartInstantMeeting,
  onJoinWithCode,
  onOpenSecurity,
  onOpenAuth,
  onOpenJoinModal,
}) => {
  const [roomCode, setRoomCode] = useState<string>('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = extractMeetingCode(roomCode);
    if (parsed) {
      onJoinWithCode(parsed);
    }
  };

  return (
    <div className="min-h-screen bg-[#080D19] text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* HERO SECTION */}
      <section className="relative px-6 pt-16 pb-20 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Copy (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
              <span className="text-cyan-400 font-semibold">WebRTC 3.0</span>
              <span aria-hidden="true">·</span>
              <span>Direct DTLS-SRTP Confidentiality</span>
              <span aria-hidden="true">·</span>
              <span>Ultra-Low Latency Mesh</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-2xl text-balance">
              Connect. Create. Collaborate.{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-400 bg-clip-text text-transparent">
                Without Limits.
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
              NEXMEET delivers high-definition multi-peer video conferencing, synchronous real-time whiteboard drawing, screen broadcasting, and secure file exchange on a unified cryptographic platform.
            </p>

            {/* Quick Actions Bar */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full max-w-md">
              <button
                onClick={onStartInstantMeeting}
                className="py-3 px-5 text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                <span>Create Meeting</span>
              </button>

              <form onSubmit={handleJoinSubmit} className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="Enter 10-digit ID or paste link"
                  className="w-full px-3.5 py-3 rounded-xl bg-[#111827] border border-slate-700/80 text-white text-xs placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={!roomCode.trim()}
                  className="py-3 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-40"
                  title="Join Meeting"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Direct Demo Room Trigger */}
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <span>Looking for a quick demo?</span>
              <button
                onClick={() => onJoinWithCode('849-392-1849')}
                className="text-cyan-400 hover:underline font-mono"
              >
                Join Global Hub (849-392-1849)
              </button>
            </div>
          </div>

          {/* Right Hero Visual Banner (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#111827]">
              <img
                src="/src/assets/images/hero_collaboration_preview_1792399780662.jpg"
                alt="NEXMEET real-time collaboration interface"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080D19]/80 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-[#111827]/90 backdrop-blur-md border border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Full-Mesh WebRTC & Synchronous Board</p>
                  <p className="text-[11px] text-slate-400">Zero relay latency · Hardware accelerated</p>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                  60 FPS LIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section id="features" className="px-6 py-20 border-t border-slate-800 bg-[#0B1120]/60">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xl mb-12">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <span>Architecture</span>
              <span aria-hidden="true">·</span>
              <span>Real-Time Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Engineered for seamless multi-participant presence.
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Everything required to communicate, review designs, code, and share documents in high resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">HD Video & Audio</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adaptive WebRTC peer connections with echo cancellation, noise suppression, and active speaker visual detection.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4">
                <PenTool className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Shared Whiteboard</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Low-latency synchronized drawing with freehand pen, shapes, text annotations, undo/redo, and PNG image export.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Screen Broadcasting</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamless window or monitor screen sharing via getDisplayMedia with automated track restoration on stream end.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Secure File Sharing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Quarantined server-side file vault with extension verification, size governance (25MB), and real-time chat broadcasts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHITEBOARD SHOWCASE SECTION */}
      <section id="whiteboard" className="px-6 py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <span>Vector Canvas</span>
                <span aria-hidden="true">·</span>
                <span>Socket.IO Sync</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
                Turn ideas into reality on a shared collaborative canvas.
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Brainstorm architecture diagrams, annotate wireframes, or sketch workflows alongside your teammates during live calls. All strokes synchronize across connected devices instantly without page reloads.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#111827] border border-slate-800">
                  <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Full Shape & Vector Toolkit</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Pen, straight lines, rectangles, circles, custom text tools, and multi-width stroke adjustment.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#111827] border border-slate-800">
                  <Zap className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">State Reconstitution on Join</h4>
                    <p className="text-xs text-slate-400 mt-0.5">New participants entering mid-session automatically receive the current canvas vector state.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#111827]">
                <img
                  src="/src/assets/images/whiteboard_creative_canvas_1792399781036.jpg"
                  alt="Collaborative whiteboard preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY & ARCHITECTURE SECTION */}
      <section id="security" className="px-6 py-20 border-t border-slate-800 bg-[#0B1120]/70">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl bg-[#111827]">
                <img
                  src="/src/assets/images/security_encryption_shield_1792399780804.jpg"
                  alt="Cryptographic security shield"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <span>Cryptographic Standards</span>
                <span aria-hidden="true">·</span>
                <span>RFC 3711 & RFC 8261</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
                Enterprise security built directly into media transport.
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                NEXMEET enforces strict separation of concerns between media transport and application signaling. Peer streams are encrypted end-to-end via DTLS-SRTP, guaranteeing direct peer confidentiality.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>DTLS-SRTP Media</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Direct P2P key derivation prevents server-side audio/video interception.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
                  <div className="flex items-center gap-2 text-violet-400 text-xs font-bold mb-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>TLS 1.3 Signaling</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    All Socket.IO coordinates and token sessions travel over TLS encrypted WSS websockets.
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenSecurity}
                className="px-4 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
              >
                Inspect Technical Security Specifications →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-800 bg-[#080D19] px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">NEXMEET</span>
            <span>·</span>
            <span>Connect. Create. Collaborate. Without Limits.</span>
          </div>
          <div>
            <span>© 2026 NEXMEET Real-Time Communication Platform. Open-source compliant.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
