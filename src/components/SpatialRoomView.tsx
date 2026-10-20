import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import {
  Compass,
  Zap,
  Coffee,
  Palette,
  Briefcase,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Sliders,
  ChevronDown,
  Sparkles,
  Crown,
  Hand,
  Clock,
  Layers,
  Grid,
} from 'lucide-react';
import { RoomPeer, SpatialRoomTheme, User as AuthUser } from '../types';
import { ambientAudio, SoundscapeType } from '../services/ambientAudio';

interface SpatialRoomViewProps {
  roomId: string;
  socket: Socket | null;
  currentUser: AuthUser | { id: string; name: string; avatar: string };
  isHost: boolean;
  spatialTheme: SpatialRoomTheme;
  onThemeChange: (theme: SpatialRoomTheme) => void;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isLocalSpeaking: boolean;
  remoteParticipants: Map<
    string,
    {
      socketId: string;
      peerInfo: RoomPeer;
      stream: MediaStream | null;
      connectionState: RTCPeerConnectionState;
      isSpeaking: boolean;
    }
  >;
  handRaised?: boolean;
}

interface ThemeVisuals {
  name: string;
  floorClass: string;
  gridColor: string;
  tableClass: string;
  glowClass: string;
  ambientSound: SoundscapeType;
  accentColor: string;
  badgeText: string;
}

const THEME_VISUALS: Record<SpatialRoomTheme, ThemeVisuals> = {
  'innovation-lab': {
    name: 'Innovation Lab',
    floorClass: 'bg-gradient-to-b from-[#0B1528] via-[#070D1B] to-[#040810]',
    gridColor: 'rgba(6, 182, 212, 0.25)',
    tableClass: 'bg-gradient-to-br from-cyan-900/40 via-slate-900/80 to-violet-950/50 border border-cyan-400/40 shadow-[0_0_50px_rgba(6,182,212,0.25)]',
    glowClass: 'from-cyan-500/20 via-violet-600/10 to-transparent',
    ambientSound: 'cyber-drone',
    accentColor: 'text-cyan-400 border-cyan-500/40',
    badgeText: 'Cyber Neon Matrix',
  },
  'focus-room': {
    name: 'Focus Room',
    floorClass: 'bg-gradient-to-b from-[#18181B] via-[#0F1012] to-[#070708]',
    gridColor: 'rgba(245, 158, 11, 0.15)',
    tableClass: 'bg-gradient-to-br from-slate-900 via-stone-900 to-amber-950/20 border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)]',
    glowClass: 'from-amber-500/15 via-slate-900/20 to-transparent',
    ambientSound: 'focus-rain',
    accentColor: 'text-amber-400 border-amber-500/40',
    badgeText: 'Distraction-Free Zen',
  },
  'creative-studio': {
    name: 'Creative Studio',
    floorClass: 'bg-gradient-to-b from-[#1C102A] via-[#10081B] to-[#08030F]',
    gridColor: 'rgba(217, 70, 239, 0.22)',
    tableClass: 'bg-gradient-to-br from-fuchsia-950/40 via-purple-950/60 to-pink-950/40 border border-fuchsia-400/40 shadow-[0_0_50px_rgba(217,70,239,0.25)]',
    glowClass: 'from-fuchsia-500/20 via-pink-600/10 to-transparent',
    ambientSound: 'lofi-pad',
    accentColor: 'text-fuchsia-400 border-fuchsia-500/40',
    badgeText: 'Design Atelier Jam',
  },
  'boardroom': {
    name: 'Executive Boardroom',
    floorClass: 'bg-gradient-to-b from-[#071B16] via-[#05110E] to-[#020706]',
    gridColor: 'rgba(16, 185, 129, 0.2)',
    tableClass: 'bg-gradient-to-br from-slate-950 via-emerald-950/50 to-slate-900 border border-emerald-400/40 shadow-[0_0_45px_rgba(16,185,129,0.2)]',
    glowClass: 'from-emerald-500/20 via-teal-900/10 to-transparent',
    ambientSound: 'alpha-wave',
    accentColor: 'text-emerald-400 border-emerald-500/40',
    badgeText: 'Executive Oval Suite',
  },
};

export const SpatialRoomView: React.FC<SpatialRoomViewProps> = ({
  roomId,
  socket,
  currentUser,
  isHost,
  spatialTheme,
  onThemeChange,
  localStream,
  screenStream,
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isLocalSpeaking,
  remoteParticipants,
  handRaised,
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(0.3);
  const [perspectiveAngle, setPerspectiveAngle] = useState<{ x: number; y: number }>({ x: 18, y: 0 });

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const activeVisuals = THEME_VISUALS[spatialTheme] || THEME_VISUALS['innovation-lab'];

  // Handle Local Video Stream
  useEffect(() => {
    if (localVideoRef.current) {
      if (isScreenSharing && screenStream) {
        localVideoRef.current.srcObject = screenStream;
      } else if (localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream, screenStream, isScreenSharing]);

  // Handle Ambient Soundscape toggle
  const toggleSoundscape = () => {
    if (isPlayingAudio) {
      ambientAudio.stop();
      setIsPlayingAudio(false);
    } else {
      ambientAudio.setVolume(audioVolume);
      ambientAudio.play(activeVisuals.ambientSound);
      setIsPlayingAudio(true);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAudioVolume(vol);
    ambientAudio.setVolume(vol);
  };

  // Host Theme Selector handler
  const handleSelectTheme = (theme: SpatialRoomTheme) => {
    onThemeChange(theme);
    setIsThemeMenuOpen(false);
    if (isPlayingAudio) {
      const nextVisuals = THEME_VISUALS[theme];
      ambientAudio.play(nextVisuals.ambientSound);
    }
    if (socket) {
      socket.emit('spatial:set-theme', { theme });
    }
  };

  // Mouse interaction for subtle 3D parallax tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width - 0.5;
    const yRatio = (e.clientY - rect.top) / rect.height - 0.5;
    setPerspectiveAngle({
      x: 18 - yRatio * 8,
      y: xRatio * 12,
    });
  };

  const handleMouseLeave = () => {
    setPerspectiveAngle({ x: 18, y: 0 });
  };

  const remoteList = Array.from(remoteParticipants.values());

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden transition-all duration-700 select-none ${activeVisuals.floorClass}`}
    >
      {/* Dynamic Top Ambient Glow Strip */}
      <div
        className={`absolute top-0 left-0 right-0 h-48 bg-gradient-to-b ${activeVisuals.glowClass} pointer-events-none opacity-80`}
      />

      {/* Spatial HUD Overlay Bar */}
      <div className="relative z-30 flex items-center justify-between px-6 py-3 bg-[#080D19]/60 backdrop-blur-md border-b border-slate-800/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white tracking-wide">
              {activeVisuals.name}
            </span>
          </div>

          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${activeVisuals.accentColor} bg-black/40`}>
            {activeVisuals.badgeText}
          </span>
        </div>

        {/* Ambient Audio & Host Theme Switcher */}
        <div className="flex items-center gap-3">
          {/* Ambient Soundscape Controller */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800">
            <button
              onClick={toggleSoundscape}
              className={`p-1 rounded-md transition-colors ${
                isPlayingAudio ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
              title={isPlayingAudio ? 'Mute Ambient Soundscape' : 'Play Ambient Soundscape'}
            >
              {isPlayingAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {isPlayingAudio && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                title="Soundscape Volume"
              />
            )}
          </div>

          {/* Host Theme Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
            >
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>Theme: {activeVisuals.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0F172A] border border-cyan-500/40 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                  Select Room Space
                </div>

                {(['innovation-lab', 'focus-room', 'creative-studio', 'boardroom'] as SpatialRoomTheme[]).map((theme) => {
                  const tv = THEME_VISUALS[theme];
                  const isSelected = spatialTheme === theme;

                  return (
                    <button
                      key={theme}
                      onClick={() => handleSelectTheme(theme)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{tv.name}</span>
                      {isSelected && <span className="text-[10px] text-cyan-400 font-mono">Active</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2.5D Isometric Interactive Stage Container */}
      <div
        className="relative flex-1 flex items-center justify-center p-4 overflow-hidden"
        style={{
          perspective: '1200px',
        }}
      >
        {/* Animated Perspective Plane */}
        <div
          className="relative w-full max-w-4xl h-[480px] flex items-center justify-center transition-transform duration-300 ease-out"
          style={{
            transform: `rotateX(${perspectiveAngle.x}deg) rotateY(${perspectiveAngle.y}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Ground Spatial Grid Texture */}
          <div
            className="absolute inset-0 rounded-3xl opacity-40 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(${activeVisuals.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${activeVisuals.gridColor} 1px, transparent 1px)`,
              backgroundSize: '36px 36px',
              transform: 'translateZ(-40px)',
            }}
          />

          {/* Central Conference Table */}
          <div
            className={`relative w-[480px] h-[260px] rounded-[100px] flex flex-col items-center justify-center p-6 transition-all duration-700 ${activeVisuals.tableClass}`}
            style={{
              transform: 'translateZ(10px)',
            }}
          >
            {/* Table Inset Display (Meeting Branding / Hologram) */}
            <div className="flex flex-col items-center text-center select-none pointer-events-none">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center mb-2 shadow-lg shadow-cyan-500/20 animate-pulse">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-sm font-extrabold text-white tracking-widest uppercase">
                {activeVisuals.name}
              </h3>
              <p className="text-[10px] font-mono text-cyan-300/80 mt-0.5">
                Room ID: {roomId}
              </p>
            </div>
          </div>

          {/* ================= PARTICIPANT PODIUMS (Arranged around table) ================= */}

          {/* LOCAL USER PODIUM (Bottom Center) */}
          <div
            className="absolute bottom-2 flex flex-col items-center z-20"
            style={{
              transform: 'translateZ(40px)',
            }}
          >
            <div
              className={`relative w-40 h-28 rounded-2xl overflow-hidden bg-slate-900 border-2 transition-all shadow-2xl flex items-center justify-center ${
                isLocalSpeaking
                  ? 'border-cyan-400 ring-4 ring-cyan-500/40 scale-105'
                  : 'border-slate-700'
              }`}
            >
              {isVideoEnabled || isScreenSharing ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isScreenSharing ? 'scale-x-[-1]' : ''}`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-full border border-cyan-400/40 bg-slate-800 mb-1"
                  />
                  <span className="text-[10px] text-slate-400">Camera Off</span>
                </div>
              )}

              {/* Status Badges */}
              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] text-white">
                <span className="font-semibold truncate max-w-[80px]">
                  {currentUser.name} (You)
                </span>
                <div className="flex items-center gap-1">
                  {!isAudioEnabled && <MicOff className="w-3 h-3 text-rose-400" />}
                  {handRaised && <Hand className="w-3 h-3 text-amber-400 fill-amber-400" />}
                </div>
              </div>

              {/* Speaking Indicator Badge */}
              {isLocalSpeaking && (
                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-bold text-[9px] animate-pulse">
                  Speaking
                </div>
              )}

              {isHost && (
                <div className="absolute top-1.5 left-1.5 p-1 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-300">
                  <Crown className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Spatial Seat Base Pedestal */}
            <div className="w-20 h-3 rounded-full bg-cyan-500/30 blur-[2px] mt-1" />
          </div>

          {/* REMOTE PARTICIPANTS PODIUMS */}
          {remoteList.map((remote, idx) => {
            // Position remote peers around the oval table in 2.5D space
            const totalRemotes = remoteList.length;
            const positions = getPodiumPosition(idx, totalRemotes);

            return (
              <RemoteSpatialPodium
                key={remote.socketId}
                remote={remote}
                positionStyle={positions}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="relative z-20 flex items-center justify-between px-6 py-2.5 bg-[#080D19]/70 backdrop-blur-md border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Spatial 2.5D Mode Active</span>
          <span>·</span>
          <span>{remoteList.length + 1} Participants In Room</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-cyan-300">
            Interactive Orbit & Parallax Enabled
          </span>
        </div>
      </div>
    </div>
  );
};

// Calculate podium coordinates around the table
function getPodiumPosition(idx: number, total: number) {
  // If 1 remote peer: top center
  if (total === 1) {
    return {
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%) translateZ(35px)',
    };
  }
  // If 2 remote peers: top left, top right
  if (total === 2) {
    const isLeft = idx === 0;
    return {
      top: '25px',
      left: isLeft ? '20%' : '80%',
      transform: 'translateX(-50%) translateZ(35px)',
    };
  }
  // If 3-6 peers: evenly spaced around the top/sides
  const angles = [180, 240, 300, 135, 45, 0];
  const angle = angles[idx % angles.length] * (Math.PI / 180);
  const rx = 340; // horizontal radius
  const ry = 140; // vertical radius
  const x = Math.cos(angle) * rx;
  const y = Math.sin(angle) * ry;

  return {
    top: `calc(50% - ${y}px - 60px)`,
    left: `calc(50% + ${x}px - 80px)`,
    transform: 'translateZ(35px)',
  };
}

// Remote Video Podium Subcomponent
const RemoteSpatialPodium: React.FC<{
  remote: any;
  positionStyle: React.CSSProperties;
}> = ({ remote, positionStyle }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && remote.stream) {
      videoRef.current.srcObject = remote.stream;
    }
  }, [remote.stream]);

  const hasVideo = remote.peerInfo?.videoEnabled;
  const isSpeaking = remote.isSpeaking;

  return (
    <div
      className="absolute flex flex-col items-center z-10 transition-all duration-300"
      style={positionStyle}
    >
      <div
        className={`relative w-36 h-26 rounded-2xl overflow-hidden bg-slate-900 border-2 transition-all shadow-xl flex items-center justify-center ${
          isSpeaking
            ? 'border-cyan-400 ring-4 ring-cyan-500/40 scale-105'
            : 'border-slate-800'
        }`}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${!hasVideo ? 'hidden' : ''}`}
        />

        {!hasVideo && (
          <div className="flex flex-col items-center justify-center p-2 text-center">
            <img
              src={remote.peerInfo?.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${remote.peerInfo?.userName}`}
              alt={remote.peerInfo?.userName}
              className="w-10 h-10 rounded-full border border-violet-500/40 bg-slate-800 mb-1"
            />
            <span className="text-[10px] text-slate-400">Camera Off</span>
          </div>
        )}

        {/* Status Badges */}
        <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] text-white">
          <span className="font-semibold truncate max-w-[70px]">
            {remote.peerInfo?.userName}
          </span>
          <div className="flex items-center gap-1">
            {!remote.peerInfo?.audioEnabled && <MicOff className="w-2.5 h-2.5 text-rose-400" />}
            {remote.peerInfo?.handRaised && <Hand className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
          </div>
        </div>

        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-bold text-[8px] animate-pulse">
            Speaking
          </div>
        )}

        {remote.peerInfo?.isHost && (
          <div className="absolute top-1 left-1 p-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300">
            <Crown className="w-2.5 h-2.5" />
          </div>
        )}
      </div>

      {/* Seat Pedestal Shadow */}
      <div className="w-16 h-2 rounded-full bg-cyan-500/20 blur-[2px] mt-1" />
    </div>
  );
};
