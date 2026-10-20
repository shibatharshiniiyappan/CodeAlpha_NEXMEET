import React from 'react';
import {
  Clock,
  Shield,
  Video,
  Mic,
  ArrowLeft,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface WaitingRoomScreenProps {
  meetingTitle: string;
  hostName: string;
  meetingCode: string;
  onLeave: () => void;
  rejectionMessage?: string | null;
}

export const WaitingRoomScreen: React.FC<WaitingRoomScreenProps> = ({
  meetingTitle,
  hostName,
  meetingCode,
  onLeave,
  rejectionMessage,
}) => {
  return (
    <div className="min-h-screen bg-[#080D19] text-slate-100 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center">
        {/* Animated Radar / Waiting Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-cyan-500/10 border-2 border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Clock className="w-10 h-10 animate-pulse text-cyan-400" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 animate-ping pointer-events-none" />
        </div>

        {rejectionMessage ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{rejectionMessage}</span>
            </div>
            <button
              onClick={onLeave}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
            >
              Return to Workspace
            </button>
          </div>
        ) : (
          <>
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 mb-3 uppercase tracking-wider">
              Waiting Room
            </span>

            <h1 className="text-xl font-bold text-white tracking-tight">
              Please wait, the meeting host will let you in soon
            </h1>

            <div className="mt-4 p-4 rounded-xl bg-[#111827] border border-slate-800 w-full text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Meeting Topic:</span>
                <span className="font-semibold text-white">{meetingTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Meeting Host:</span>
                <span className="font-medium text-cyan-300">{hostName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Meeting ID:</span>
                <span className="font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {meetingCode}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Security verified</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Camera & Mic ready</span>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center w-full">
              <button
                onClick={onLeave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors border border-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Leave Waiting Room</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
