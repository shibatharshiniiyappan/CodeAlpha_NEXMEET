import React, { useState } from 'react';
import {
  Video,
  Plus,
  LogIn,
  Calendar,
  Share2,
  Copy,
  Check,
  Shield,
  ArrowRight,
  LogOut,
  Sparkles,
  Link as LinkIcon,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Meeting, SpatialRoomTheme } from '../types';
import { extractMeetingCode } from './JoinMeetingModal';
import { SpatialRoomsSection } from './SpatialRoomsSection';
import { createMeeting } from '../services/api';

interface DashboardProps {
  onOpenCreateMeeting: () => void;
  onOpenJoinMeeting: () => void;
  onJoinRoom: (roomId: string) => void;
  onOpenSecurity: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenCreateMeeting,
  onOpenJoinMeeting,
  onJoinRoom,
  onOpenSecurity,
}) => {
  const { user, logout } = useAuth();
  const [quickInput, setQuickInput] = useState<string>('');
  const [copiedPmi, setCopiedPmi] = useState<boolean>(false);
  const [copiedRecentIdx, setCopiedRecentIdx] = useState<number | null>(null);

  // Default Personal Meeting ID (PMI)
  const personalMeetingId = '849-392-1849';
  const pmiUrl = `${window.location.origin}/?room=${personalMeetingId}`;

  // Recent / Saved Meetings
  const [recentMeetings] = useState<Array<{ id: string; code: string; title: string; date: string; host: string }>>([
    {
      id: 'pmi-hub',
      code: '849-392-1849',
      title: 'Global Collaboration Hub (PMI)',
      date: 'Active Public Room',
      host: 'Alex Chen',
    },
    {
      id: 'room-eng-weekly',
      code: '528-914-2031',
      title: 'Sprint Retrospective & Architecture Review',
      date: 'Today, 2:00 PM',
      host: 'Engineering Team',
    },
    {
      id: 'room-design-crit',
      code: '319-740-8842',
      title: 'UI/UX Interactive Whiteboard Critique',
      date: 'Yesterday, 4:30 PM',
      host: 'Product Design',
    },
  ]);

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    const parsed = extractMeetingCode(quickInput);
    if (parsed) {
      onJoinRoom(parsed);
    }
  };

  const handleCopyPmi = () => {
    navigator.clipboard.writeText(pmiUrl);
    setCopiedPmi(true);
    setTimeout(() => setCopiedPmi(false), 2000);
  };

  const handleCopyRecent = (code: string, idx: number) => {
    const url = `${window.location.origin}/?room=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    setCopiedRecentIdx(idx);
    setTimeout(() => setCopiedRecentIdx(null), 2000);
  };

  const handleEnterSpatialRoom = async (theme: SpatialRoomTheme) => {
    try {
      const themeTitles: Record<SpatialRoomTheme, string> = {
        'innovation-lab': 'Innovation Lab Brainstorm Hub',
        'focus-room': 'Focus Room Deep Work Retreat',
        'creative-studio': 'Creative Studio Design Atelier',
        'boardroom': 'Executive Boardroom Meeting',
      };
      const res = await createMeeting(
        themeTitles[theme],
        user?.name || 'Meeting Host',
        user?.id || 'host-user',
        {
          spatialTheme: theme,
        }
      );
      onJoinRoom(res.meeting.code);
    } catch (err: any) {
      console.warn('Failed to create instant spatial room, using default room:', err);
      onJoinRoom('849-392-1849');
    }
  };

  return (
    <div className="min-h-screen bg-[#080D19] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-slate-800 bg-[#111827]/70 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-bold text-slate-950 text-base shadow-lg shadow-cyan-500/20">
            N
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">NEXMEET Workspace</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onOpenSecurity}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>DTLS-SRTP Specs</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'User'}`}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full border border-cyan-500/30 bg-slate-800"
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-white leading-tight">{user?.name || 'Guest User'}</p>
              <p className="text-[11px] text-slate-400 leading-tight truncate max-w-[140px]">
                {user?.email || 'Guest Mode'}
              </p>
            </div>
            {user?.email && (
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors ml-1"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        {/* Zoom-Style Action Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {/* Tile 1: New Meeting (Orange / Cyan) */}
          <button
            onClick={onOpenCreateMeeting}
            className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#111827] border border-cyan-500/30 hover:border-cyan-400 hover:bg-[#162032] transition-all group shadow-xl text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-cyan-400 text-slate-950 flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform">
              <Video className="w-7 h-7" />
            </div>
            <span className="text-sm font-bold text-white">Create Meeting</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Unique room & link</span>
          </button>

          {/* Tile 2: Join Meeting (Blue / Violet) */}
          <button
            onClick={onOpenJoinMeeting}
            className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#111827] border border-violet-500/30 hover:border-violet-400 hover:bg-[#162032] transition-all group shadow-xl text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-violet-400 text-white flex items-center justify-center mb-3 shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
              <LogIn className="w-7 h-7" />
            </div>
            <span className="text-sm font-bold text-white">Join Meeting</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Enter ID or paste link</span>
          </button>

          {/* Tile 3: Schedule */}
          <button
            onClick={onOpenCreateMeeting}
            className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#111827] border border-slate-800 hover:border-slate-700 hover:bg-[#162032] transition-all group shadow-xl text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-cyan-400 flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform border border-slate-700">
              <Calendar className="w-7 h-7" />
            </div>
            <span className="text-sm font-bold text-white">Schedule</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Plan future session</span>
          </button>

          {/* Tile 4: Share Screen */}
          <button
            onClick={onOpenJoinMeeting}
            className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#111827] border border-slate-800 hover:border-slate-700 hover:bg-[#162032] transition-all group shadow-xl text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-emerald-400 flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform border border-slate-700">
              <Share2 className="w-7 h-7" />
            </div>
            <span className="text-sm font-bold text-white">Share Screen</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Present to room</span>
          </button>
        </div>

        {/* Zoom-Style Personal Meeting ID (PMI) Card */}
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Personal Meeting Room</span>
                <span className="text-[11px] text-slate-500 font-mono">Always Available</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Meeting ID:</span>
                <span className="font-mono text-cyan-300 font-extrabold select-all">{personalMeetingId}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 truncate max-w-lg font-mono">
                {pmiUrl}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleCopyPmi}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                {copiedPmi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedPmi ? 'Link Copied!' : 'Copy Invitation Link'}</span>
              </button>

              <button
                onClick={() => onJoinRoom(personalMeetingId)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-md shadow-cyan-500/20"
              >
                <Video className="w-4 h-4" />
                <span>Start Room</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Join / Paste Link Bar */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 mb-8">
          <form onSubmit={handleQuickJoin} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111827] border border-slate-700">
              <LinkIcon className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Paste invitation URL or enter 10-digit Meeting ID (e.g. 849-392-1849)"
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!quickInput.trim()}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <span>Join Meeting</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Spatial Rooms Section (NEXMEET 2.0 Immersive Environments) */}
        <SpatialRoomsSection onEnterSpatialRoom={handleEnterSpatialRoom} />

        {/* Recent Meetings Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Recent Meeting Rooms</h3>
            <span className="text-xs text-slate-500">Persistent History</span>
          </div>

          <div className="space-y-2.5">
            {recentMeetings.map((m, idx) => (
              <div
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#111827] border border-slate-800 hover:border-slate-700 transition-colors gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{m.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono text-cyan-300 font-semibold">{m.code}</span>
                      <span>·</span>
                      <span>{m.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleCopyRecent(m.code, idx)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                    title="Copy Meeting Link"
                  >
                    {copiedRecentIdx === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedRecentIdx === idx ? 'Copied' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={() => onJoinRoom(m.code)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm"
                  >
                    Start / Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
