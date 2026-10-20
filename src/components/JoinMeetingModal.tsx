import React, { useState } from 'react';
import {
  X,
  LogIn,
  ArrowRight,
  User,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { getMeeting } from '../services/api';

interface JoinMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess: (roomId: string, name?: string) => void;
  initialCode?: string;
  defaultName?: string;
}

export function extractMeetingCode(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // 1. If it contains ?room=
  const roomParamMatch = trimmed.match(/[?&]room=([^&\s]+)/i);
  if (roomParamMatch && roomParamMatch[1]) {
    return decodeURIComponent(roomParamMatch[1]).trim();
  }

  // 2. If it's a URL like http(s)://.../849-392-1849
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const queryRoom = url.searchParams.get('room');
      if (queryRoom) return queryRoom.trim();
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length > 0) return parts[parts.length - 1].trim();
    } catch {
      // ignore
    }
  }

  // 3. If it has "Meeting ID: XXX-XXX-XXXX"
  const idMatch = trimmed.match(/(?:Meeting ID:\s*)([a-zA-Z0-9-]+)/i);
  if (idMatch && idMatch[1]) {
    return idMatch[1].trim();
  }

  // 4. Fallback to raw string
  return trimmed;
}

export const JoinMeetingModal: React.FC<JoinMeetingModalProps> = ({
  isOpen,
  onClose,
  onJoinSuccess,
  initialCode = '',
  defaultName = '',
}) => {
  const [meetingInput, setMeetingInput] = useState<string>(initialCode);
  const [name, setName] = useState<string>(defaultName);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = meetingInput.trim();
    if (!rawInput) return;

    const parsedCode = extractMeetingCode(rawInput);
    if (!parsedCode) {
      setError('Please enter a valid Meeting ID or invitation link.');
      return;
    }

    setError(null);
    setIsValidating(true);

    try {
      // Validate with server
      const res = await getMeeting(parsedCode);
      onJoinSuccess(res.meeting.code, name.trim());
      onClose();
    } catch (err: any) {
      setError(
        err.message ||
          `Meeting ID "${parsedCode}" not found. Please verify the 10-digit ID or invitation link with the host.`
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleQuickJoinDemo = async () => {
    setError(null);
    setIsValidating(true);
    try {
      const res = await getMeeting('849-392-1849');
      onJoinSuccess(res.meeting.code, name.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo room unavailable');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#111827] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Join a Meeting</h2>
              <p className="text-xs text-slate-400">Enter a meeting ID or paste an invitation link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleJoin} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Unable to join meeting</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Meeting ID or Personal Link
            </label>
            <input
              type="text"
              required
              autoFocus
              value={meetingInput}
              onChange={(e) => {
                setMeetingInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. 849-392-1849 or paste link"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-cyan-400 transition-colors"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Supports 10-digit IDs (`849-392-1849`), raw numbers, or full URLs.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Your Display Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isValidating || !meetingInput.trim()}
            className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <span>{isValidating ? 'Verifying Meeting...' : 'Join Meeting'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Demo Button */}
          <div className="pt-2 text-center border-t border-slate-800">
            <button
              type="button"
              onClick={handleQuickJoinDemo}
              disabled={isValidating}
              className="w-full py-2 px-3 text-xs font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/30 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quick Join Public Hub (849-392-1849)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
