import React, { useState } from 'react';
import {
  Compass,
  Zap,
  Users,
  Calendar,
  AlertTriangle,
  Lightbulb,
  Plus,
  ArrowRight,
  Maximize2,
  Volume2,
  VolumeX,
  Video,
  CheckCircle2,
  Clock,
  Sparkles,
  Move,
  X,
  Layers,
  Folder,
} from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { SpatialRoomType, SpatialWorkspaceRoom, TaskItem } from '../../types/taskflow';
import { TaskDetailModal } from './TaskDetailModal';

interface SpatialRoomsViewProps {
  onJoinMeetingRoom?: (roomId: string) => void;
}

export const SpatialRoomsView: React.FC<SpatialRoomsViewProps> = ({ onJoinMeetingRoom }) => {
  const { state, createRoom, updateRoom, setSelectedTaskId, selectedTaskId } = useTaskFlow();

  const [activeRoomId, setActiveRoomId] = useState<string | null>(state.rooms[0]?.id || null);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<SpatialRoomType>('brainstorming');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  // Active room data
  const currentRoom = state.rooms.find((r) => r.id === activeRoomId) || state.rooms[0];

  // Room tasks
  const roomTasks = state.tasks.filter(
    (t) => t.roomId === currentRoom?.id || currentRoom?.activeTaskIds.includes(t.id)
  );

  const roomThemeIcons: Record<SpatialRoomType, React.ElementType> = {
    brainstorming: Lightbulb,
    war_room: AlertTriangle,
    collaboration: Users,
    focus: Zap,
    planning_review: Calendar,
  };

  const roomThemeStyles: Record<
    SpatialRoomType,
    {
      gradient: string;
      border: string;
      glow: string;
      ambient: string;
      badge: string;
      stageBg: string;
    }
  > = {
    brainstorming: {
      gradient: 'from-cyan-500/20 via-blue-600/10 to-transparent',
      border: 'border-cyan-500/40 hover:border-cyan-400',
      glow: 'shadow-cyan-500/10',
      ambient: 'Cyber Synth Pulse (Simulated Audio)',
      badge: 'Ideation & Synthesis',
      stageBg: 'radial-gradient(ellipse at top, #083344 0%, #080D19 70%)',
    },
    war_room: {
      gradient: 'from-rose-500/20 via-amber-600/10 to-transparent',
      border: 'border-rose-500/40 hover:border-rose-400',
      glow: 'shadow-rose-500/10',
      ambient: 'Tactical Alert Radar (Simulated Audio)',
      badge: 'Blocker Triage & Incidents',
      stageBg: 'radial-gradient(ellipse at top, #4c0519 0%, #080D19 70%)',
    },
    collaboration: {
      gradient: 'from-emerald-500/20 via-teal-600/10 to-transparent',
      border: 'border-emerald-500/40 hover:border-emerald-400',
      glow: 'shadow-emerald-500/10',
      ambient: 'Studio Flow Ambient (Simulated Audio)',
      badge: 'Active Peer Syncing',
      stageBg: 'radial-gradient(ellipse at top, #064e3b 0%, #080D19 70%)',
    },
    focus: {
      gradient: 'from-blue-600/20 via-indigo-600/10 to-transparent',
      border: 'border-blue-500/40 hover:border-blue-400',
      glow: 'shadow-blue-500/10',
      ambient: 'Binaural 40Hz Waves (Simulated Audio)',
      badge: 'Deep Problem Solving',
      stageBg: 'radial-gradient(ellipse at top, #1e1b4b 0%, #080D19 70%)',
    },
    planning_review: {
      gradient: 'from-purple-500/20 via-violet-600/10 to-transparent',
      border: 'border-purple-500/40 hover:border-purple-400',
      glow: 'shadow-purple-500/10',
      ambient: 'Executive Lo-Fi Cadence (Simulated Audio)',
      badge: 'Milestone Roadmaps',
      stageBg: 'radial-gradient(ellipse at top, #3b0764 0%, #080D19 70%)',
    },
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const room = createRoom({
      type: newRoomType,
      name: newRoomName.trim(),
      tagline: 'Custom spatial collaboration workspace',
      description: newRoomDesc.trim() || 'Purpose-built workspace for team coordination.',
      accentColor: newRoomType === 'war_room' ? '#f43f5e' : '#06b6d4',
      icon: 'Compass',
      associatedProjectIds: [state.projects[0]?.id || 'proj-nexus-core'],
      members: [
        {
          id: 'usr-alex-chen',
          name: 'Alex Chen',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex',
          role: 'Host',
        },
      ],
      activeTaskIds: [],
      ambientSoundName: roomThemeStyles[newRoomType].ambient,
    });
    setActiveRoomId(room.id);
    setNewRoomName('');
    setNewRoomDesc('');
    setIsCreateModalOpen(false);
  };

  if (!currentRoom) return null;

  const currentTheme = roomThemeStyles[currentRoom.type] || roomThemeStyles.brainstorming;
  const ThemeIcon = roomThemeIcons[currentRoom.type] || Compass;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#080D19] overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-6 py-4 border-b border-slate-800 bg-[#0B132B]/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
              Spatial Rooms & Virtual Workspaces
            </h1>
            <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
              2.5D Isometric Presence
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Themed project rooms, ambient workspaces, and real-time collaboration pods
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Simulated audio toggle */}
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isAudioMuted
                ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                : 'bg-cyan-950 text-cyan-300 border-cyan-700/60'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
            <span>{isAudioMuted ? 'Mute Ambiance' : currentTheme.ambient.split('(')[0]}</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Room</span>
          </button>
        </div>
      </div>

      {/* Main Split Body: Room List on Left, Active 2.5D Stage on Right */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Side: Room Selector Grid / List */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#0B132B]/30 p-4 overflow-y-auto space-y-3 shrink-0">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            <span>Thematic Rooms ({state.rooms.length})</span>
          </div>

          {state.rooms.map((room) => {
            const IconComponent = roomThemeIcons[room.type] || Compass;
            const style = roomThemeStyles[room.type] || roomThemeStyles.brainstorming;
            const isActive = room.id === activeRoomId;
            const taskCount = state.tasks.filter(
              (t) => t.roomId === room.id || room.activeTaskIds.includes(t.id)
            ).length;

            return (
              <div
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isActive
                    ? `bg-slate-900/90 ${style.border} shadow-lg ${style.glow}`
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: room.accentColor + '30', color: room.accentColor }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {room.name}
                      </h4>
                      <span className="text-[10px] text-slate-400">{style.badge}</span>
                    </div>
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                  )}
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                  {room.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
                  <span>{room.members.length} Members</span>
                  <span className="text-cyan-300">{taskCount} Active Tasks</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Active 2.5D Room Workspace Stage */}
        <div
          className="flex-1 flex flex-col min-h-0 overflow-y-auto p-6 relative"
          style={{ background: currentTheme.stageBg }}
        >
          {/* Subtle Isometric Grid overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-25 pointer-events-none" />

          {/* Active Room HUD Banner */}
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-700/80 backdrop-blur-md shadow-2xl mb-6">
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: currentRoom.accentColor + '25', color: currentRoom.accentColor }}
              >
                <ThemeIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{currentRoom.name}</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    {currentTheme.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{currentRoom.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {onJoinMeetingRoom && (
                <button
                  onClick={() => onJoinMeetingRoom(currentRoom.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  <Video className="w-4 h-4" />
                  <span>Launch Video Session</span>
                </button>
              )}
            </div>
          </div>

          {/* 2.5D Workspace Floor / Pods Layer */}
          <div className="relative z-10 flex-1 flex flex-col gap-6">
            {/* Stage Grid: Active Tasks & Member Pods */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1 & 2: Room Tasks & Canvas Matrix */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Active Room Tasks & Deliverables ({roomTasks.length})</span>
                  </h3>
                  <span className="text-xs text-slate-400">Click to inspect or manage</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {roomTasks.length === 0 ? (
                    <div className="col-span-2 p-8 rounded-2xl border border-dashed border-slate-800 text-center">
                      <p className="text-xs text-slate-400 mb-2">No active tasks assigned to this room.</p>
                      <span className="text-[11px] text-cyan-400">
                        Create tasks in Task Universe or convert ideas on the Idea Canvas.
                      </span>
                    </div>
                  ) : (
                    roomTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-400/60 shadow-lg cursor-pointer transition-all transform hover:-translate-y-0.5 group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            {task.status.replace('_', ' ')}
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              {task.dueDate}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors mb-1.5">
                          {task.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                          {task.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800 font-mono">
                          <span>{task.projectName}</span>
                          {task.assignee && <span className="text-slate-300">{task.assignee.name}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 3: Active Room Members & Telemetry Pod */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Workspace Members</span>
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-mono">Connected</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  {currentRoom.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700"
                        />
                        <div>
                          <div className="text-xs font-bold text-white">{member.name}</div>
                          <div className="text-[10px] text-slate-400">{member.role}</div>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                    </div>
                  ))}

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 text-center font-mono">
                    Simulated workspace team presence
                  </div>
                </div>

                {/* Spatial Environment Highlights */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Environment Specs</span>
                  </div>
                  <div className="text-slate-400 text-[11px] space-y-1">
                    <div>• Perspective Stage: CSS3D Transform matrix</div>
                    <div>• Audio Resonance: {currentRoom.ambientSoundName}</div>
                    <div>• Zero-Trust Media: DTLS-SRTP Mesh Ready</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      )}

      {/* Create Room Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create Spatial Workspace</h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. AI Architecture Sprint Room"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Theme Environment</label>
                <select
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value as SpatialRoomType)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="brainstorming">Brainstorming Room (Cyan Neon Glow)</option>
                  <option value="war_room">Project War Room (Tactical Amber/Rose)</option>
                  <option value="collaboration">Team Collaboration Hub (Emerald Studio)</option>
                  <option value="focus">Focus Room (Deep Sapphire Silence)</option>
                  <option value="planning_review">Planning & Review (Strategic Violet)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="Purpose of this spatial room..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
