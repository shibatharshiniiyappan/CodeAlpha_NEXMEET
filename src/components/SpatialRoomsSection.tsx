import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  Zap,
  Coffee,
  Palette,
  Briefcase,
  Users,
  Volume2,
  ArrowRight,
  Shield,
  Layers,
  Check,
  Maximize2,
} from 'lucide-react';
import { SpatialRoomTheme } from '../types';

interface SpatialRoomsSectionProps {
  onEnterSpatialRoom: (theme: SpatialRoomTheme) => void;
}

interface RoomConfig {
  id: SpatialRoomTheme;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  badgeColor: string;
  gradient: string;
  borderColor: string;
  ambientSound: string;
  capacity: string;
  previewBg: string;
  icon: React.ElementType;
  highlights: string[];
}

export const SPATIAL_ROOMS_CONFIG: RoomConfig[] = [
  {
    id: 'innovation-lab',
    name: 'Innovation Lab',
    tagline: 'Futuristic Cyber Workspace',
    description: 'Neon-infused isometric workspace equipped with holographic podiums, ambient cyber glow, and brainstorming matrices.',
    badge: 'Popular for Brainstorming',
    badgeColor: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/40',
    gradient: 'from-cyan-500/20 via-violet-600/10 to-transparent',
    borderColor: 'border-cyan-500/30 hover:border-cyan-400',
    ambientSound: 'Cyber Drone Synth',
    capacity: '1–16 Collaborators',
    previewBg: 'bg-gradient-to-b from-[#0F172A] to-[#080D19]',
    icon: Zap,
    highlights: ['Holographic 2.5D Podiums', 'Cyber Neon Floor Grid', 'Live Idea Matrices', 'Audio Synth Ambiance'],
  },
  {
    id: 'focus-room',
    name: 'Focus Room',
    tagline: 'Distraction-Free Zen Retreat',
    description: 'Calm, minimalist aesthetic designed for deep technical problem-solving, architectural reviews, and flow state.',
    badge: 'Deep Work & Retros',
    badgeColor: 'text-amber-400 bg-amber-950/80 border-amber-500/40',
    gradient: 'from-amber-500/15 via-slate-800/10 to-transparent',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    ambientSound: 'Rain & White Noise',
    capacity: '1–8 Focused Peers',
    previewBg: 'bg-gradient-to-b from-[#18181B] to-[#0A0A0B]',
    icon: Coffee,
    highlights: ['Minimalist Zen Spatial Stage', 'Integrated Focus Timer', 'Synthesized Rain Soundscape', 'Zero Visual Noise'],
  },
  {
    id: 'creative-studio',
    name: 'Creative Studio',
    tagline: 'Vibrant Design & Jam Atelier',
    description: 'Colourful, expressive environment tailored for UI/UX design crits, mood-boarding, sprint planning, and interactive canvas workshops.',
    badge: 'Creative Teams',
    badgeColor: 'text-fuchsia-400 bg-fuchsia-950/80 border-fuchsia-500/40',
    gradient: 'from-fuchsia-500/20 via-pink-600/10 to-transparent',
    borderColor: 'border-fuchsia-500/30 hover:border-fuchsia-400',
    ambientSound: 'Lo-Fi Acoustic Pad',
    capacity: '1–20 Participants',
    previewBg: 'bg-gradient-to-b from-[#1E112A] to-[#0A0410]',
    icon: Palette,
    highlights: ['Multi-Hue Ambient Mood', 'Sticky Note Wall Integration', 'Live Freehand Canvas', 'Dynamic Palette Swatches'],
  },
  {
    id: 'boardroom',
    name: 'Executive Boardroom',
    tagline: 'High-Stakes Formal Space',
    description: 'Polished obsidian marble oval conference hub with executive spotlights, agenda tracking podium, and structured speaker etiquette.',
    badge: 'Formal & All-Hands',
    badgeColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40',
    gradient: 'from-emerald-500/20 via-teal-900/10 to-transparent',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400',
    ambientSound: '10Hz Alpha Wave',
    capacity: '1–30 Executive Seats',
    previewBg: 'bg-gradient-to-b from-[#091E19] to-[#030B09]',
    icon: Briefcase,
    highlights: ['Executive Oval Conference Table', 'Pendant Spotlight Optics', 'Formal Hand-Raise Priority', 'Alpha Wave Focus Flow'],
  },
];

export const SpatialRoomsSection: React.FC<SpatialRoomsSectionProps> = ({ onEnterSpatialRoom }) => {
  const [selectedRoom, setSelectedRoom] = useState<SpatialRoomTheme>('innovation-lab');

  const activeConfig = SPATIAL_ROOMS_CONFIG.find((r) => r.id === selectedRoom) || SPATIAL_ROOMS_CONFIG[0];

  return (
    <section className="mb-10 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20">
              <Compass className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Spatial Rooms</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                NEXMEET 2.0
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immersive virtual environments with 2.5D spatial audio-visual depth, ambient lighting, and synchronized real-time collaboration.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Real-Time Socket.IO Synchronized</span>
        </div>
      </div>

      {/* Main 4-Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {SPATIAL_ROOMS_CONFIG.map((room) => {
          const Icon = room.icon;
          const isSelected = selectedRoom === room.id;

          return (
            <div
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`relative group rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden border ${
                isSelected
                  ? `${room.borderColor} bg-slate-900/90 shadow-xl shadow-cyan-500/10 ring-2 ring-cyan-500/30 scale-[1.02]`
                  : 'border-slate-800 bg-[#111827]/70 hover:bg-[#162032] hover:border-slate-700'
              }`}
            >
              {/* Subtle top ambient glow */}
              <div
                className={`absolute top-0 left-0 right-0 h-28 bg-gradient-to-b ${room.gradient} pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      room.id === 'innovation-lab'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : room.id === 'focus-room'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : room.id === 'creative-studio'
                        ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${room.badgeColor}`}>
                    {room.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-0.5">{room.name}</h3>
                <p className="text-[11px] font-mono text-cyan-300/80 mb-2">{room.tagline}</p>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                  {room.description}
                </p>
              </div>

              {/* Card Bottom Meta & Quick Launch */}
              <div className="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate max-w-[100px]">{room.ambientSound}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnterSpatialRoom(room.id);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-cyan-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <span>Launch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Room 2.5D Interactive Environment Showcase Banner */}
      <div className="relative rounded-2xl p-6 bg-[#0E1526] border border-cyan-500/20 shadow-2xl overflow-hidden">
        {/* Decorative 2.5D Isometric Grid Backdrop */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${activeConfig.badgeColor}`}>
                Active Environment Preview
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {activeConfig.capacity}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{activeConfig.name}</span>
              <span className="text-sm font-normal text-slate-400">— {activeConfig.tagline}</span>
            </h3>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {activeConfig.description} In this space, every participant’s real WebRTC video is mapped onto synchronized 2.5D holographic seats with dynamic speaking indicators and category-driven brainstorm canvases.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {activeConfig.highlights.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 font-medium"
                >
                  <Check className="w-3 h-3 text-cyan-400" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive 2.5D Perspective Room Simulator Preview */}
          <div className="relative w-full lg:w-72 h-44 rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-950 flex flex-col items-center justify-center shadow-inner group">
            {/* 2.5D Isometric Stage Floor */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                perspective: '800px',
              }}
            >
              <div
                className={`w-52 h-40 rounded-xl transition-all duration-700 ${
                  activeConfig.id === 'innovation-lab'
                    ? 'bg-gradient-to-t from-cyan-950/60 to-violet-950/40 border border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.3)]'
                    : activeConfig.id === 'focus-room'
                    ? 'bg-gradient-to-t from-amber-950/40 to-slate-900/60 border border-amber-400/40'
                    : activeConfig.id === 'creative-studio'
                    ? 'bg-gradient-to-t from-fuchsia-950/50 to-pink-950/40 border border-fuchsia-400/40 shadow-[0_0_20px_rgba(217,70,239,0.3)]'
                    : 'bg-gradient-to-t from-emerald-950/40 to-slate-900/60 border border-emerald-400/40'
                }`}
                style={{
                  transform: 'rotateX(55deg) rotateZ(0deg)',
                }}
              >
                {/* Central holographic table representation */}
                <div className="absolute inset-6 rounded-lg bg-slate-900/80 border border-white/20 flex items-center justify-center">
                  <span className="text-[9px] font-mono text-cyan-300 uppercase tracking-widest">
                    TABLE
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated 2.5D Floating Participant Nodes */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-xs font-bold text-cyan-300 shadow-lg shadow-cyan-500/30 animate-bounce">
                P1
              </div>
              <div className="w-10 h-10 rounded-xl bg-violet-600/30 border-2 border-violet-400 flex items-center justify-center text-xs font-bold text-violet-200 shadow-xl">
                Host
              </div>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-xs font-bold text-cyan-300 shadow-lg shadow-cyan-500/30 animate-bounce" style={{ animationDelay: '0.2s' }}>
                P2
              </div>
            </div>

            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Theme: {activeConfig.id}</span>
              <span className="text-cyan-400">2.5D Ready</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0 flex flex-col gap-2 w-full sm:w-auto">
            <button
              onClick={() => onEnterSpatialRoom(activeConfig.id)}
              className="px-6 py-3.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-violet-400 hover:from-cyan-300 hover:to-violet-300 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 group"
            >
              <span>Enter {activeConfig.name}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <span className="text-[11px] text-slate-500 text-center font-mono">
              Instant Session with Selected Theme
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
