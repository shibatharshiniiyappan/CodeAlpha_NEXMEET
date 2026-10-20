import React from 'react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onStartMeeting: () => void;
  onOpenJoin?: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenDashboard: () => void;
  onOpenSecurity: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onStartMeeting,
  onOpenJoin,
  onOpenAuth,
  onOpenDashboard,
  onOpenSecurity,
}) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080D19]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#"
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2.5"
        >
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-extrabold text-slate-950 text-base shadow-md shadow-cyan-500/20">
            N
          </span>
          <span className="text-xl tracking-tight font-extrabold">NEXMEET</span>
        </a>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
            Capabilities
          </a>
          <a href="#whiteboard" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
            Whiteboard
          </a>
          <a
            href="#security"
            onClick={(e) => {
              e.preventDefault();
              onOpenSecurity();
            }}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
          >
            Security & DTLS
          </a>
          <a href="#architecture" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
            Architecture
          </a>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onStartMeeting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-lg transition-all shadow-sm whitespace-nowrap shrink-0"
          >
            <span>Create Meeting</span>
          </button>

          {onOpenJoin && (
            <button
              onClick={onOpenJoin}
              className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Join Meeting
            </button>
          )}

          {user ? (
            <button
              onClick={onOpenDashboard}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              Enter Workspace
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
