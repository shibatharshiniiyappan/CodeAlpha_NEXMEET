import React from 'react';
import { useAuth } from '../context/AuthContext';
import { TaskFlowNavTab } from './taskflow/SidebarNav';

interface NavbarProps {
  onStartMeeting: () => void;
  onOpenJoin?: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenDashboard: () => void;
  onOpenSecurity: () => void;
  onOpenTab?: (tab: TaskFlowNavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onStartMeeting,
  onOpenJoin,
  onOpenAuth,
  onOpenDashboard,
  onOpenSecurity,
  onOpenTab,
}) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080D19]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-6 py-4">
        {/* Zone 1: Wordmark */}
        <button
          onClick={onOpenDashboard}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2.5 hover:opacity-90 transition-opacity"
        >
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-extrabold text-slate-950 text-base shadow-md shadow-cyan-500/20">
            N
          </span>
          <div className="text-left">
            <span className="text-lg tracking-tight font-extrabold text-white">NEXMEET</span>
            <span className="hidden sm:inline-block ml-1.5 text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/80 border border-cyan-800 px-1.5 py-0.2 rounded">
              WebRTC 3.0
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links for NEXMEET Collaboration */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-300">
          <button
            onClick={() => onOpenTab ? onOpenTab('task_universe') : onOpenDashboard()}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap"
          >
            Task Universe
          </button>
          <button
            onClick={() => onOpenTab ? onOpenTab('spatial_rooms') : onOpenDashboard()}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap"
          >
            Spatial Rooms
          </button>
          <button
            onClick={() => onOpenTab ? onOpenTab('idea_canvas') : onOpenDashboard()}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap"
          >
            Idea Canvas
          </button>
          <button
            onClick={() => onOpenTab ? onOpenTab('meeting_pulse') : onOpenDashboard()}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap"
          >
            Meeting Pulse
          </button>
          <button
            onClick={() => onOpenTab ? onOpenTab('mission_control') : onOpenDashboard()}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap flex items-center gap-1 text-violet-300 hover:text-violet-200"
          >
            <span>AI Mission Control</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-violet-950 border border-violet-800 font-bold">
              AI
            </span>
          </button>
          <button
            onClick={onOpenSecurity}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap text-slate-400"
          >
            DTLS-SRTP
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onStartMeeting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-lg transition-all shadow-sm whitespace-nowrap shrink-0"
          >
            <span>Live Video</span>
          </button>

          {onOpenJoin && (
            <button
              onClick={onOpenJoin}
              className="hidden sm:inline-flex px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Join Room
            </button>
          )}

          {user ? (
            <button
              onClick={onOpenDashboard}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              Workspace
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

