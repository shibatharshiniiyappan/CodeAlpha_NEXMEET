import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  StopCircle,
  PenTool,
  MessageSquare,
  Users,
  Shield,
  PhoneOff,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Pin,
  Lock,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { Whiteboard } from './Whiteboard';
import { SidePanel } from './SidePanel';
import { SecurityModal } from './SecurityModal';
import { InviteModal } from './InviteModal';
import { Meeting, RoomPeer } from '../types';
import { getMeeting } from '../services/api';

interface MeetingRoomProps {
  roomId: string;
  onLeave: () => void;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({ roomId, onLeave }) => {
  const { user } = useAuth();
  const currentUser = user || {
    id: `guest-${Math.random().toString(36).substring(2, 8)}`,
    name: 'Guest Collaborator',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest',
  };

  const [socket, setSocket] = useState<Socket | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Panels & Views
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState<boolean>(false);
  const [isWhiteboardExpanded, setIsWhiteboardExpanded] = useState<boolean>(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(false);
  const [sidePanelTab, setSidePanelTab] = useState<'chat' | 'participants' | 'files'>('chat');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  // Initialize Socket.IO connection
  useEffect(() => {
    const s = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
    setSocket(s);

    // Fetch meeting details
    getMeeting(roomId)
      .then((res) => setMeeting(res.meeting))
      .catch((e) => console.warn('Could not load meeting metadata', e));

    return () => {
      s.emit('leave-room');
      s.disconnect();
    };
  }, [roomId]);

  // Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WebRTC Hook
  const {
    localStream,
    screenStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    remoteParticipants,
    permissionError,
    isLocalSpeaking,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  } = useWebRTC(roomId, currentUser, socket);

  // Listen for unread messages if side panel is closed
  useEffect(() => {
    if (!socket) return;
    const handleMessage = () => {
      if (!isSidePanelOpen || sidePanelTab !== 'chat') {
        setUnreadChatCount((prev) => prev + 1);
      }
    };
    socket.on('chat:received', handleMessage);
    return () => {
      socket.off('chat:received', handleMessage);
    };
  }, [socket, isSidePanelOpen, sidePanelTab]);

  const handleOpenSidePanel = (tab: 'chat' | 'participants' | 'files') => {
    setSidePanelTab(tab);
    setIsSidePanelOpen(true);
    if (tab === 'chat') {
      setUnreadChatCount(0);
    }
  };

  // Local Video Ref
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (localVideoRef.current) {
      if (isScreenSharing && screenStream) {
        localVideoRef.current.srcObject = screenStream;
      } else if (localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream, screenStream, isScreenSharing]);

  // Copy Invite Code / Link
  const handleCopyInvite = () => {
    const inviteLink = `${window.location.origin}/?room=${encodeURIComponent(meeting?.code || roomId)}`;
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert remote participants to array
  const remoteArray = Array.from(remoteParticipants.values());
  const allParticipantsList: RoomPeer[] = [
    {
      socketId: 'local',
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      audioEnabled: isAudioEnabled,
      videoEnabled: isVideoEnabled,
      isScreenSharing,
      joinedAt: Date.now(),
    },
    ...remoteArray.map((r) => r.peerInfo),
  ];

  return (
    <div className="relative flex flex-col h-screen w-full bg-[#080D19] overflow-hidden text-slate-100 font-sans">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#111827]/90 backdrop-blur-md border-b border-slate-800/80 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center font-bold text-slate-950 text-base shadow-lg shadow-cyan-500/20">
            N
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>{meeting?.title || 'NEXMEET Collaborative Room'}</span>
              <span className="text-[11px] font-mono font-normal text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                {meeting?.code || roomId}
              </span>
            </h1>
          </div>
        </div>

        {/* Center Indicators */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono tabular-nums text-slate-200">{formatTimer(durationSeconds)}</span>
          </div>

          <button
            onClick={() => setIsSecurityModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/30 text-xs text-cyan-300 transition-colors"
            title="DTLS-SRTP Encryption Specifications"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px]">DTLS-SRTP SECURED</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-colors border border-cyan-500/30"
            title="Invite Participants"
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Invite</span>
          </button>

          <button
            onClick={handleCopyInvite}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
            title="Copy Meeting Link"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{isCopied ? 'Link Copied!' : 'Copy Invitation Link'}</span>
          </button>

          <button
            onClick={() => handleOpenSidePanel('participants')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="tabular-nums">{allParticipantsList.length}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <div className="relative flex-1 flex min-h-0 overflow-hidden p-3 gap-3">
        {/* Permission Denied Alert */}
        {permissionError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2.5 rounded-xl bg-amber-950/90 border border-amber-500/50 text-amber-200 text-xs shadow-xl flex items-center gap-2">
            <span>{permissionError}</span>
          </div>
        )}

        {/* Video Stage Area */}
        <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden rounded-2xl bg-[#0B1120] border border-slate-800/80 p-2 shadow-inner">
          {/* Main Video Layout */}
          <div
            className={`w-full h-full grid gap-3 p-1 transition-all ${
              remoteArray.length === 0
                ? 'grid-cols-1'
                : remoteArray.length === 1
                ? 'grid-cols-1 md:grid-cols-2'
                : remoteArray.length <= 3
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }`}
          >
            {/* LOCAL USER TILE */}
            <div
              className={`relative rounded-xl overflow-hidden bg-[#111827] border transition-all flex items-center justify-center ${
                isLocalSpeaking ? 'border-cyan-400 ring-2 ring-cyan-500/30' : 'border-slate-800'
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
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-20 h-20 rounded-full border-2 border-cyan-500/40 bg-slate-800 mb-3 shadow-lg"
                  />
                  <p className="text-sm font-semibold text-white">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Camera Disabled</p>
                </div>
              )}

              {/* Status Badges Overlay */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-xs text-white border border-white/10">
                <span className="font-semibold">{currentUser.name} (You)</span>
                {!isAudioEnabled && <MicOff className="w-3.5 h-3.5 text-rose-400 ml-1" />}
                {isScreenSharing && <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1 rounded">Sharing</span>}
              </div>

              {/* Speaking Ripple Indicator */}
              {isLocalSpeaking && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-[10px] text-cyan-300 font-semibold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Speaking
                </div>
              )}
            </div>

            {/* REMOTE PARTICIPANT TILES */}
            {remoteArray.map((remote) => (
              <RemoteVideoTile
                key={remote.socketId}
                participant={remote}
                isPinned={pinnedParticipantId === remote.socketId}
                onPinToggle={() =>
                  setPinnedParticipantId(pinnedParticipantId === remote.socketId ? null : remote.socketId)
                }
              />
            ))}
          </div>

          {/* Whiteboard Floating / Overlay Panel */}
          {isWhiteboardOpen && (
            <div
              className={`absolute z-30 transition-all duration-300 ${
                isWhiteboardExpanded
                  ? 'inset-2'
                  : 'bottom-4 left-4 right-4 md:left-auto md:right-4 w-full md:w-[720px] h-[480px]'
              }`}
            >
              <Whiteboard
                roomId={roomId}
                currentUser={currentUser}
                socket={socket}
                onClose={() => setIsWhiteboardOpen(false)}
                isExpanded={isWhiteboardExpanded}
                onToggleExpand={() => setIsWhiteboardExpanded(!isWhiteboardExpanded)}
              />
            </div>
          )}
        </div>

        {/* Side Panel Drawer (Chat, Participants, Files) */}
        {isSidePanelOpen && (
          <SidePanel
            roomId={roomId}
            currentUser={currentUser}
            socket={socket}
            activeTab={sidePanelTab}
            onTabChange={(t) => {
              setSidePanelTab(t);
              if (t === 'chat') setUnreadChatCount(0);
            }}
            onClose={() => setIsSidePanelOpen(false)}
            participants={allParticipantsList}
            onInviteCopy={handleCopyInvite}
          />
        )}
      </div>

      {/* Bottom Floating Control Dock */}
      <footer className="flex items-center justify-center p-3 bg-[#111827]/95 backdrop-blur-lg border-t border-slate-800/80 shrink-0 z-20">
        <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center">
          {/* Mic Button */}
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center ${
              isAudioEnabled
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 ring-1 ring-rose-500/50'
            }`}
            title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera Button */}
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center ${
              isVideoEnabled
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 ring-1 ring-rose-500/50'
            }`}
            title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share Button */}
          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center ${
              isScreenSharing
                ? 'bg-cyan-500 text-slate-950 font-bold border border-cyan-400 ring-2 ring-cyan-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            {isScreenSharing ? <StopCircle className="w-5 h-5 text-slate-950" /> : <Share2 className="w-5 h-5" />}
          </button>

          <div className="w-[1px] h-6 bg-slate-800 mx-1 hidden sm:block" />

          {/* Whiteboard Toggle */}
          <button
            onClick={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
            className={`flex items-center gap-2 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all shadow-md ${
              isWhiteboardOpen
                ? 'bg-violet-600 hover:bg-violet-500 text-white border border-violet-400 ring-2 ring-violet-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Collaborative Whiteboard"
          >
            <PenTool className="w-4 h-4" />
            <span className="hidden sm:inline">Whiteboard</span>
          </button>

          {/* Chat Toggle */}
          <button
            onClick={() => handleOpenSidePanel('chat')}
            className={`relative p-3 rounded-xl transition-all shadow-md flex items-center justify-center ${
              isSidePanelOpen && sidePanelTab === 'chat'
                ? 'bg-cyan-500 text-slate-950 border border-cyan-400'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title="Meeting Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-cyan-400 text-slate-950 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-[#111827] tabular-nums">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Participants Toggle */}
          <button
            onClick={() => handleOpenSidePanel('participants')}
            className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center ${
              isSidePanelOpen && sidePanelTab === 'participants'
                ? 'bg-cyan-500 text-slate-950 border border-cyan-400'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title="Participants"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* Invite Button */}
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all shadow-md"
            title="Invite Participants"
          >
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Invite</span>
          </button>

          <div className="w-[1px] h-6 bg-slate-800 mx-1 hidden sm:block" />

          {/* Leave Meeting Button */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to exit this meeting room?')) {
                onLeave();
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/30 ml-2"
            title="Leave Meeting"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>
      </footer>

      {/* Security Specifications Modal */}
      {isSecurityModalOpen && (
        <SecurityModal
          onClose={() => setIsSecurityModalOpen(false)}
          roomId={meeting?.code || roomId}
        />
      )}

      {/* Zoom-Style Invite Modal */}
      {isInviteModalOpen && (
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          meeting={meeting}
          roomId={roomId}
        />
      )}
    </div>
  );
};

// Remote Video Tile Subcomponent
const RemoteVideoTile: React.FC<{
  participant: any;
  isPinned: boolean;
  onPinToggle: () => void;
}> = ({ participant, isPinned, onPinToggle }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const hasVideo = participant.peerInfo.videoEnabled;

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-[#111827] border transition-all flex items-center justify-center ${
        isPinned ? 'ring-2 ring-cyan-400 border-cyan-500/50' : 'border-slate-800'
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${!hasVideo ? 'hidden' : ''}`}
      />

      {!hasVideo && (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <img
            src={participant.peerInfo.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${participant.peerInfo.userName}`}
            alt={participant.peerInfo.userName}
            className="w-20 h-20 rounded-full border-2 border-violet-500/40 bg-slate-800 mb-3 shadow-lg"
          />
          <p className="text-sm font-semibold text-white">{participant.peerInfo.userName}</p>
          <p className="text-xs text-slate-500 mt-0.5">Camera Muted</p>
        </div>
      )}

      {/* Overlay details */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-xs text-white border border-white/10">
        <span className="font-semibold">{participant.peerInfo.userName}</span>
        {!participant.peerInfo.audioEnabled && <MicOff className="w-3.5 h-3.5 text-rose-400 ml-1" />}
        {participant.peerInfo.isScreenSharing && (
          <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1 rounded">Screen</span>
        )}
      </div>

      {/* Pin button */}
      <button
        onClick={onPinToggle}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/80 text-slate-300 hover:text-white transition-colors"
        title={isPinned ? 'Unpin' : 'Pin to Focus'}
      >
        <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-cyan-400 fill-cyan-400' : ''}`} />
      </button>
    </div>
  );
};
