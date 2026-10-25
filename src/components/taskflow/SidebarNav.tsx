import React from 'react';
import {
  LayoutDashboard,
  Columns,
  Compass,
  Lightbulb,
  Activity,
  Sparkles,
  Video,
  Folder,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type TaskFlowNavTab =
  | 'dashboard'
  | 'task_universe'
  | 'spatial_rooms'
  | 'idea_canvas'
  | 'meeting_pulse'
  | 'mission_control'
  | 'projects'
  | 'settings';

interface SidebarNavProps {
  currentTab: TaskFlowNavTab;
  onSelectTab: (tab: TaskFlowNavTab) => void;
  onOpenVideoMeeting: () => void;
  onOpenSecurityModal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenLanding?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenVideoMeeting,
  onOpenSecurityModal,
  isCollapsed,
  onToggleCollapse,
  onOpenLanding,
}) => {
  const { user, logout } = useAuth();

  const navItems: Array<{ id: TaskFlowNavTab; label: string; icon: React.ElementType; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'task_universe', label: 'Task Universe', icon: Columns, badge: '5 Views' },
    { id: 'spatial_rooms', label: 'Spatial Rooms', icon: Compass, badge: '2.5D' },
    { id: 'idea_canvas', label: 'Idea Canvas', icon: Lightbulb },
    { id: 'meeting_pulse', label: 'Meeting Pulse', icon: Activity },
    { id: 'mission_control', label: 'AI Mission Control', icon: Sparkles, badge: 'AI' },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <aside
      className={`border-r border-slate-800 bg-[#070C18] flex flex-col justify-between shrink-0 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand & Workspace Header */}
      <div>
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-extrabold text-slate-950 text-base shadow-md shadow-cyan-500/20 shrink-0">
                TF
              </span>
              <div className="min-w-0">
                <div className="text-sm font-extrabold tracking-tight text-white leading-tight">
                  TaskFlow
                </div>
                <div className="text-[10px] font-mono text-cyan-400 truncate">Spatial Edition 2.0</div>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-extrabold text-slate-950 text-base shadow-md shadow-cyan-500/20 mx-auto">
              TF
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Entries */}
        <div className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-slate-950/30 text-slate-950'
                            : 'bg-slate-800 text-cyan-300 border border-slate-700/80'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Dedicated Live Video Launch Section */}
        <div className="px-3 pt-2">
          {!isCollapsed && (
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-3 mb-1.5">
              Encrypted Real-Time
            </div>
          )}

          <button
            onClick={onOpenVideoMeeting}
            title="Launch WebRTC Video Meeting"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-gradient-to-r from-blue-950/60 to-cyan-950/60 hover:from-blue-900/60 hover:to-cyan-900/60 border border-cyan-800/40 hover:border-cyan-500/60 transition-all shadow-sm ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <Video className="w-4 h-4 text-cyan-400 shrink-0" />
            {!isCollapsed && <span className="truncate">Live Video Room</span>}
          </button>
        </div>
      </div>

      {/* Footer User & Security Block */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        {onOpenLanding && (
          <button
            onClick={onOpenLanding}
            title="Switch to Landing Page"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-900/80 transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <span className="w-4 h-4 rounded text-[10px] font-bold border border-slate-600 flex items-center justify-center text-slate-400 shrink-0">
              LP
            </span>
            {!isCollapsed && <span className="truncate">Landing Overview</span>}
          </button>
        )}

        <button
          onClick={onOpenSecurityModal}
          title="Security & DTLS-SRTP Specs"
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-900/80 transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <Shield className="w-4 h-4 text-cyan-400/80 shrink-0" />
          {!isCollapsed && <span className="truncate">Security & DTLS</span>}
        </button>

        {user && (
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 ${
              isCollapsed ? 'justify-center p-1.5' : ''
            }`}
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 shrink-0"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                <div className="text-[10px] text-slate-400 truncate font-mono">
                  {user.email || 'Collaborator'}
                </div>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={logout}
                title="Log out"
                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
