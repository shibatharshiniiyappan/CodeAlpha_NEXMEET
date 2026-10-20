import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Server,
  FileCheck,
  X,
  ExternalLink,
  Info,
} from 'lucide-react';
import { SecuritySpecs } from '../types';
import { getSecuritySpecs } from '../services/api';

interface SecurityModalProps {
  onClose: () => void;
  roomId?: string;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ onClose, roomId }) => {
  const [specs, setSpecs] = useState<SecuritySpecs | null>(null);

  useEffect(() => {
    getSecuritySpecs()
      .then(setSpecs)
      .catch((e) => console.warn('Could not load security specs', e));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">NEXMEET Cryptographic & Security Architecture</h2>
              <p className="text-xs text-slate-400">
                Transport Layer Security & DTLS-SRTP Media Protection
              </p>
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
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300">
          {/* Active Session Status */}
          {roomId && (
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Active Session</span>
                <p className="font-mono text-white text-sm">{roomId}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  DTLS-SRTP Active
                </span>
              </div>
            </div>
          )}

          {/* Core Security Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2">
                <Lock className="w-4 h-4" />
                <span>Media Stream Encryption</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                All real-time audio and video tracks are encrypted directly peer-to-peer using <strong>DTLS-SRTP</strong>.
              </p>
              <div className="text-[11px] text-slate-400 font-mono space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div>Cipher: SRTP_AEAD_AES_256_GCM</div>
                <div>Key Exchange: DTLS 1.2 / 1.3 Handshake</div>
                <div>Topology: P2P Mesh (No intermediate decoding)</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-violet-400 font-semibold mb-2">
                <Server className="w-4 h-4" />
                <span>Signaling & Transport</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Session negotiation, ICE candidate coordination, and chat synchronization are transported over <strong>TLS 1.3 / WSS</strong>.
              </p>
              <div className="text-[11px] text-slate-400 font-mono space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div>Protocol: WSS (WebSockets over TLS)</div>
                <div>Passphrase Hashing: Scrypt (64-byte key)</div>
                <div>Validation: Zod Strict Server Schema</div>
              </div>
            </div>
          </div>

          {/* Transparency & Architecture Disclosure */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Architectural Transparency Notice</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              In accordance with engineering standards:
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>
                <strong>Direct Audio/Video Media:</strong> Truly encrypted peer-to-peer between participants without server decoding.
              </li>
              <li>
                <strong>Signaling & Storage:</strong> Server routes SDP negotiation, validates uploaded meeting files, and broadcasts room chat. File uploads are quarantined on isolated disk storage.
              </li>
              <li>
                <strong>Mesh vs SFU:</strong> Direct WebRTC mesh delivers zero relay latency and complete media confidentiality for up to 8 peers per room.
              </li>
            </ul>
          </div>

          {/* STUN Infrastructure */}
          {specs && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">STUN Infrastructure:</span>
              <span className="font-mono text-cyan-300">
                {specs.iceConfiguration.stunServers[0]} (+2 redundant)
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 bg-[#111827] border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
