import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Meeting } from '../types';
import { getMeeting } from '../services/api';

interface LobbyViewProps {
  roomId: string;
  onJoin: () => void;
  onBack: () => void;
  onJoinAnother?: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomId,
  onJoin,
  onBack,
  onJoinAnother,
}) => {
  const { user, setGuestUser } = useAuth();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoadingMeeting, setIsLoadingMeeting] = useState<boolean>(true);
  const [meetingError, setMeetingError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState<string>(user?.name || '');
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Validate and load meeting metadata from server
  useEffect(() => {
    let mounted = true;
    setIsLoadingMeeting(true);
    setMeetingError(null);

    getMeeting(roomId)
      .then((res) => {
        if (!mounted) return;
        setMeeting(res.meeting);
        setIsLoadingMeeting(false);
      })
      .catch((err: any) => {
        if (!mounted) return;
        setMeetingError(
          err.message ||
            `Meeting ID "${roomId}" does not exist. Please check your link or invitation code.`
        );
        setIsLoadingMeeting(false);
      });

    return () => {
      mounted = false;
    };
  }, [roomId]);

  // Request preview camera & mic stream
  useEffect(() => {
    let mounted = true;

    async function setupPreview() {
      try {
        setPermissionError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: 1280, height: 720 },
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Setup audio visualizer meter
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const loop = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(loop);
        };
        loop();
      } catch (err: any) {
        setPermissionError('Camera or microphone access is unavailable. You can still join using text and whiteboard.');
      }
    }

    setupPreview();

    return () => {
      mounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleToggleAudio = () => {
    if (streamRef.current) {
      const track = streamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsAudioEnabled(track.enabled);
      }
    } else {
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const handleToggleVideo = () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoEnabled(track.enabled);
      }
    } else {
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const handleStartJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    if (!user || user.name !== displayName.trim()) {
      setGuestUser(displayName.trim());
    }

    // Stop preview stream before entering meeting room so useWebRTC acquires exclusive handle
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onJoin();
  };

  const handleCopyInviteLink = () => {
    const url = `${window.location.origin}/?room=${encodeURIComponent(meeting?.code || roomId)}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // State 1: Loading
  if (isLoadingMeeting) {
    return (
      <div className="min-h-screen bg-[#080D19] flex flex-col justify-center items-center px-4 py-8 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-300">Verifying Meeting ID...</p>
          <p className="text-xs font-mono text-slate-500">{roomId}</p>
        </div>
      </div>
    );
  }

  // State 2: Invalid Room Error
  if (meetingError || !meeting) {
    return (
      <div className="min-h-screen bg-[#080D19] flex flex-col justify-center items-center px-4 py-8 text-slate-100">
        <div className="w-full max-w-md bg-[#111827] border border-rose-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-white">Invalid Meeting ID</h2>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-400">
            <p>
              We could not find an active meeting with ID:
            </p>
            <p className="font-mono text-rose-300 font-semibold text-sm mt-1 select-all">
              {roomId}
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Please verify the 10-digit meeting code or invitation link with your host, or start your own meeting room.
          </p>

          <div className="pt-2 flex flex-col gap-2.5">
            {onJoinAnother && (
              <button
                onClick={onJoinAnother}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-md"
              >
                Join Another Meeting
              </button>
            )}

            <button
              onClick={onBack}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Back to Home / Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Valid Meeting - Zoom-Style Pre-Flight Lobby
  return (
    <div className="min-h-screen bg-[#080D19] flex flex-col justify-center items-center px-4 py-8 text-slate-100">
      <div className="w-full max-w-4xl">
        {/* Top return link */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Leave Lobby</span>
          </button>

          <button
            onClick={handleCopyInviteLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{isCopied ? 'Link Copied!' : 'Copy Invitation Link'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Video Preview Box (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="relative aspect-video rounded-2xl bg-[#111827] border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
              {isVideoEnabled && !permissionError ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-3">
                    <VideoOff className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-sm font-semibold text-white">Camera is Off</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    {permissionError || 'You can toggle your camera on below whenever you are ready.'}
                  </p>
                </div>
              )}

              {/* In-Preview Controls Dock */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className={`p-3 rounded-full transition-all shadow-lg ${
                    isAudioEnabled
                      ? 'bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 backdrop-blur-md'
                      : 'bg-rose-600 text-white ring-2 ring-rose-500/50'
                  }`}
                  title={isAudioEnabled ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={handleToggleVideo}
                  className={`p-3 rounded-full transition-all shadow-lg ${
                    isVideoEnabled
                      ? 'bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 backdrop-blur-md'
                      : 'bg-rose-600 text-white ring-2 ring-rose-500/50'
                  }`}
                  title={isVideoEnabled ? 'Turn Off Video' : 'Turn On Video'}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </div>

              {/* Mic Volume Level Bar */}
              {isAudioEnabled && !permissionError && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">Mic Level</span>
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-75"
                      style={{ width: `${micVolume}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Join Form & Details (5 cols) */}
          <div className="lg:col-span-5 flex flex-col bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="mb-6">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                Ready to Join
              </span>
              <h2 className="text-xl font-bold text-white mt-1 leading-tight">
                {meeting.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                <span>Meeting ID:</span>
                <span className="font-mono text-cyan-300 font-bold text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800 select-all">
                  {meeting.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Host: <span className="text-slate-300 font-medium">{meeting.hostName}</span>
              </p>
            </div>

            <form onSubmit={handleStartJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Display Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus={!displayName}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Encrypted WebRTC P2P media session</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>Real-time chat, whiteboard & screen share active</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!displayName.trim()}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <span>Join Meeting Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
