import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { RoomPeer, User, NetworkDiagnosticsStats, SpatialRoomTheme } from '../types';

interface RemoteParticipant {
  socketId: string;
  peerInfo: RoomPeer;
  stream: MediaStream;
  connectionState: RTCPeerConnectionState;
  isSpeaking: boolean;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(roomId: string, currentUser: User, socket: Socket | null) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, RemoteParticipant>>(new Map());
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [hostNotice, setHostNotice] = useState<string | null>(null);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState<boolean>(false);
  const [selfSocketId, setSelfSocketId] = useState<string>('');
  const [screensharePolicy, setScreensharePolicy] = useState<'anyone' | 'host_only'>('anyone');
  const [isMeetingLocked, setIsMeetingLocked] = useState<boolean>(false);
  const [spatialTheme, setSpatialTheme] = useState<SpatialRoomTheme>('innovation-lab');
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [talkTimeMap, setTalkTimeMap] = useState<Map<string, number>>(new Map());

  // Network Diagnostics State
  const [diagnostics, setDiagnostics] = useState<NetworkDiagnosticsStats>({
    connectionState: 'connected',
    rttMs: 24,
    packetLossPercent: 0,
    audioBitrateKbps: 48,
    videoBitrateKbps: 1200,
    candidateType: 'host / stun',
    resolution: '1280x720',
    framerate: 30,
    jitterMs: 4,
    qualityScore: 'Excellent',
    timestamp: Date.now(),
  });

  // Refs to prevent stale closures and manage WebRTC lifecycles
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const iceCandidateQueues = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Local Media Stream (Camera + Microphone)
  const initLocalStream = useCallback(async () => {
    try {
      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Setup audio analyzer for speaking detection
      setupAudioAnalyser(stream);

      return stream;
    } catch (err: any) {
      console.warn('Could not acquire audio/video devices:', err);
      // Fallback: try audio only if video failed
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = audioOnly;
        setLocalStream(audioOnly);
        setIsVideoEnabled(false);
        setupAudioAnalyser(audioOnly);
        return audioOnly;
      } catch (audioErr: any) {
        setPermissionError('Microphone and Camera access denied. You can still participate via chat and whiteboard.');
        return null;
      }
    }
  }, []);

  // Web Audio API Speaking Visualizer
  const setupAudioAnalyser = (stream: MediaStream) => {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setIsLocalSpeaking(average > 18 && isAudioEnabled);
        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('AudioAnalyser setup skipped', e);
    }
  };

  // Broadcast speaking state change
  useEffect(() => {
    if (socket) {
      socket.emit('peer:speaking', { isSpeaking: isLocalSpeaking });
    }
  }, [isLocalSpeaking, socket]);

  // Real-Time Talk Time Tracker: Accumulate active seconds per speaker
  useEffect(() => {
    const timer = setInterval(() => {
      setTalkTimeMap((prev) => {
        const next = new Map(prev);
        if (isLocalSpeaking) {
          next.set(currentUser.id, (next.get(currentUser.id) || 0) + 1);
        }
        remoteParticipants.forEach((remote) => {
          if (remote.isSpeaking) {
            next.set(remote.peerInfo.userId, (next.get(remote.peerInfo.userId) || 0) + 1);
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLocalSpeaking, remoteParticipants, currentUser.id]);

  // Toggle Hand Raise
  const toggleHandRaise = useCallback(() => {
    setIsHandRaised((prev) => {
      const next = !prev;
      if (socket) {
        socket.emit('hand:toggle', { raised: next });
      }
      return next;
    });
  }, [socket]);

  // Helper to create an RTCPeerConnection for a remote peer
  const createPeerConnection = useCallback((remoteSocketId: string, peerInfo: RoomPeer) => {
    if (peerConnections.current.has(remoteSocketId)) {
      return peerConnections.current.get(remoteSocketId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(remoteSocketId, pc);

    // Add local media tracks to peer connection
    const currentStream = screenStreamRef.current || localStreamRef.current;
    if (currentStream && currentStream.getTracks().length > 0) {
      currentStream.getTracks().forEach((track) => {
        pc.addTrack(track, currentStream);
      });
    } else {
      try {
        pc.addTransceiver('audio', { direction: 'recvonly' });
        pc.addTransceiver('video', { direction: 'recvonly' });
      } catch {
        // Fallback for older browsers
      }
    }

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc:ice-candidate', {
          targetSocketId: remoteSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      setRemoteParticipants((prev) => {
        const next = new Map(prev);
        const existing = next.get(remoteSocketId);
        if (existing) {
          next.set(remoteSocketId, {
            ...existing,
            connectionState: pc.connectionState,
          });
        }
        return next;
      });
    };

    // Handle Remote Media Tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        setRemoteParticipants((prev) => {
          const next = new Map(prev);
          next.set(remoteSocketId, {
            socketId: remoteSocketId,
            peerInfo,
            stream: remoteStream,
            connectionState: pc.connectionState,
            isSpeaking: false,
          });
          return next;
        });
      }
    };

    return pc;
  }, [socket]);

  // Main Socket.IO Signaling Hooks
  useEffect(() => {
    if (!socket || !roomId) return;

    let mounted = true;

    // 1. Initialize local stream then join room
    initLocalStream().then(() => {
      if (!mounted) return;
      socket.emit('join-room', {
        roomId,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
          audioEnabled: isAudioEnabled,
          videoEnabled: isVideoEnabled,
        },
      });
    });

    // 2. Existing peers in room
    const handleRoomUsers = async ({
      peers,
      selfSocketId: myId,
      meetingDetails,
    }: {
      peers: RoomPeer[];
      selfSocketId: string;
      meetingDetails?: any;
    }) => {
      setSelfSocketId(myId);
      if (meetingDetails) {
        if (typeof meetingDetails.isLocked === 'boolean') setIsMeetingLocked(meetingDetails.isLocked);
        if (meetingDetails.screensharePolicy) setScreensharePolicy(meetingDetails.screensharePolicy);
        if (meetingDetails.spatialTheme) setSpatialTheme(meetingDetails.spatialTheme);
      }

      for (const peer of peers) {
        if (peer.socketId === myId) continue;
        const pc = createPeerConnection(peer.socketId, peer);

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc:offer', {
            targetSocketId: peer.socketId,
            sdp: pc.localDescription,
          });
        } catch (err) {
          console.error(`Failed to create offer for ${peer.socketId}`, err);
        }
      }
    };

    // 3. New peer joined room
    const handleUserJoined = ({ peer }: { peer: RoomPeer }) => {
      createPeerConnection(peer.socketId, peer);
    };

    // 4. Incoming SDP Offer
    const handleOffer = async ({
      callerSocketId,
      sdp,
      callerInfo,
    }: {
      callerSocketId: string;
      sdp: RTCSessionDescriptionInit;
      callerInfo: RoomPeer;
    }) => {
      const pc = createPeerConnection(callerSocketId, callerInfo);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        const queue = iceCandidateQueues.current.get(callerSocketId) || [];
        for (const candidate of queue) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        iceCandidateQueues.current.delete(callerSocketId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc:answer', {
          targetSocketId: callerSocketId,
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.error('Failed to handle incoming offer:', err);
      }
    };

    // 5. Incoming SDP Answer
    const handleAnswer = async ({
      responderSocketId,
      sdp,
    }: {
      responderSocketId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      const pc = peerConnections.current.get(responderSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));

          const queue = iceCandidateQueues.current.get(responderSocketId) || [];
          for (const candidate of queue) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          iceCandidateQueues.current.delete(responderSocketId);
        } catch (err) {
          console.error('Failed to set remote description on answer:', err);
        }
      }
    };

    // 6. Incoming ICE Candidate
    const handleIceCandidate = async ({
      senderSocketId,
      candidate,
    }: {
      senderSocketId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peerConnections.current.get(senderSocketId);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      } else {
        if (!iceCandidateQueues.current.has(senderSocketId)) {
          iceCandidateQueues.current.set(senderSocketId, []);
        }
        iceCandidateQueues.current.get(senderSocketId)!.push(candidate);
      }
    };

    // 7. Peer State Change
    const handlePeerStateChanged = ({
      socketId,
      audioEnabled,
      videoEnabled,
      isScreenSharing: remoteScreen,
    }: any) => {
      setRemoteParticipants((prev) => {
        const next = new Map(prev);
        const existing = next.get(socketId);
        if (existing) {
          next.set(socketId, {
            ...existing,
            peerInfo: {
              ...existing.peerInfo,
              audioEnabled,
              videoEnabled,
              isScreenSharing: remoteScreen,
            },
          });
        }
        return next;
      });
    };

    // 8. User Left
    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      const pc = peerConnections.current.get(socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(socketId);
      }
      setRemoteParticipants((prev) => {
        const next = new Map(prev);
        next.delete(socketId);
        return next;
      });
    };

    // 9. Host Controls Handlers
    const handleForceMute = ({ reason }: { reason: string }) => {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
          setIsAudioEnabled(false);
        }
      }
      setHostNotice(reason || 'The host has muted your microphone.');
    };

    const handleForceStopScreenshare = ({ reason }: { reason: string }) => {
      if (isScreenSharing) {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
          screenStreamRef.current = null;
        }
        setScreenStream(null);
        setIsScreenSharing(false);
      }
      setHostNotice(reason || 'Screen sharing stopped by meeting policy.');
    };

    const handleLockUpdated = ({ isLocked }: { isLocked: boolean }) => {
      setIsMeetingLocked(isLocked);
    };

    const handleScreensharePolicyUpdated = ({ policy }: { policy: 'anyone' | 'host_only' }) => {
      setScreensharePolicy(policy);
    };

    const handleSpatialThemeUpdated = ({ theme }: { theme: SpatialRoomTheme }) => {
      setSpatialTheme(theme);
    };

    const handlePeerSpeakingChanged = ({ socketId, isSpeaking }: { socketId: string; isSpeaking: boolean }) => {
      setRemoteParticipants((prev) => {
        const next = new Map(prev);
        const existing = next.get(socketId);
        if (existing) {
          next.set(socketId, { ...existing, isSpeaking });
        }
        return next;
      });
    };

    const handleHandUpdated = ({ socketId, userId, handRaised }: { socketId: string; userId: string; handRaised: boolean }) => {
      if (userId === currentUser.id) {
        setIsHandRaised(handRaised);
      }
      setRemoteParticipants((prev) => {
        const next = new Map(prev);
        const existing = next.get(socketId);
        if (existing) {
          next.set(socketId, {
            ...existing,
            peerInfo: { ...existing.peerInfo, handRaised },
          });
        }
        return next;
      });
    };

    socket.on('room-users', handleRoomUsers);
    socket.on('user-joined', handleUserJoined);
    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('peer:state-changed', handlePeerStateChanged);
    socket.on('user-left', handleUserLeft);
    socket.on('host:force-mute', handleForceMute);
    socket.on('host:force-stop-screenshare', handleForceStopScreenshare);
    socket.on('meeting:lock-updated', handleLockUpdated);
    socket.on('meeting:screenshare-policy-updated', handleScreensharePolicyUpdated);
    socket.on('spatial:theme-updated', handleSpatialThemeUpdated);
    socket.on('peer:speaking-changed', handlePeerSpeakingChanged);
    socket.on('hand:updated', handleHandUpdated);

    return () => {
      mounted = false;
      socket.off('room-users', handleRoomUsers);
      socket.off('user-joined', handleUserJoined);
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
      socket.off('peer:state-changed', handlePeerStateChanged);
      socket.off('user-left', handleUserLeft);
      socket.off('host:force-mute', handleForceMute);
      socket.off('host:force-stop-screenshare', handleForceStopScreenshare);
      socket.off('meeting:lock-updated', handleLockUpdated);
      socket.off('meeting:screenshare-policy-updated', handleScreensharePolicyUpdated);
      socket.off('spatial:theme-updated', handleSpatialThemeUpdated);
      socket.off('peer:speaking-changed', handlePeerSpeakingChanged);
      socket.off('hand:updated', handleHandUpdated);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, [socket, roomId, currentUser, initLocalStream, createPeerConnection, isAudioEnabled, isVideoEnabled, isScreenSharing]);

  // Periodic WebRTC Network Diagnostics Polling via pc.getStats()
  useEffect(() => {
    const interval = setInterval(async () => {
      if (peerConnections.current.size === 0) {
        // Standalone or local preview stats
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        const settings = videoTrack?.getSettings();
        setDiagnostics((prev) => ({
          ...prev,
          connectionState: 'connected',
          resolution: settings ? `${settings.width || 1280}x${settings.height || 720}` : '1280x720',
          framerate: settings?.frameRate ? Math.round(settings.frameRate) : 30,
          timestamp: Date.now(),
        }));
        return;
      }

      let totalRtt = 0;
      let rttCount = 0;
      let totalPacketsLost = 0;
      let totalPacketsReceived = 0;
      let candidateType = 'host / stun';
      let overallState: RTCPeerConnectionState = 'connected';

      for (const [, pc] of peerConnections.current) {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          overallState = pc.connectionState;
        }

        try {
          const stats = await pc.getStats();
          stats.forEach((report) => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              if (report.currentRoundTripTime) {
                totalRtt += report.currentRoundTripTime * 1000;
                rttCount++;
              }
            }
            if (report.type === 'inbound-rtp') {
              if (report.packetsLost) totalPacketsLost += report.packetsLost;
              if (report.packetsReceived) totalPacketsReceived += report.packetsReceived;
            }
            if (report.type === 'local-candidate') {
              candidateType = report.candidateType || candidateType;
            }
          });
        } catch {
          // ignore stats errors
        }
      }

      const avgRtt = rttCount > 0 ? Math.round(totalRtt / rttCount) : 28;
      const totalPackets = totalPacketsReceived + totalPacketsLost;
      const lossPercent = totalPackets > 0 ? Number(((totalPacketsLost / totalPackets) * 100).toFixed(1)) : 0;

      let score: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Excellent';
      if (avgRtt > 200 || lossPercent > 5) score = 'Poor';
      else if (avgRtt > 100 || lossPercent > 2) score = 'Fair';
      else if (avgRtt > 60 || lossPercent > 0.5) score = 'Good';

      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      const settings = videoTrack?.getSettings();

      setDiagnostics({
        connectionState: overallState,
        rttMs: avgRtt,
        packetLossPercent: lossPercent,
        audioBitrateKbps: isAudioEnabled ? 48 : 0,
        videoBitrateKbps: isVideoEnabled ? 1150 : 0,
        candidateType,
        resolution: settings ? `${settings.width || 1280}x${settings.height || 720}` : '1280x720',
        framerate: settings?.frameRate ? Math.round(settings.frameRate) : 30,
        jitterMs: Math.max(2, Math.round(avgRtt * 0.12)),
        qualityScore: score,
        timestamp: Date.now(),
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isAudioEnabled, isVideoEnabled]);

  // Audio Toggle
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        if (socket) {
          socket.emit('media:state-change', {
            audioEnabled: audioTrack.enabled,
            videoEnabled: isVideoEnabled,
            isScreenSharing,
          });
        }
      }
    }
  }, [socket, isVideoEnabled, isScreenSharing]);

  // Video Toggle
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        if (socket) {
          socket.emit('media:state-change', {
            audioEnabled: isAudioEnabled,
            videoEnabled: videoTrack.enabled,
            isScreenSharing,
          });
        }
      }
    }
  }, [socket, isAudioEnabled, isScreenSharing]);

  // Screen Sharing Toggle with Policy Enforcement
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setScreenStream(null);
      setIsScreenSharing(false);

      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack) {
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(cameraTrack);
          }
        });
      }

      if (socket) {
        socket.emit('media:state-change', {
          audioEnabled: isAudioEnabled,
          videoEnabled: isVideoEnabled,
          isScreenSharing: false,
        });
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'monitor',
          },
          audio: false,
        });

        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);

        const screenVideoTrack = stream.getVideoTracks()[0];

        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenVideoTrack);
          }
        });

        screenVideoTrack.onended = () => {
          toggleScreenShare();
        };

        if (socket) {
          socket.emit('media:state-change', {
            audioEnabled: isAudioEnabled,
            videoEnabled: isVideoEnabled,
            isScreenSharing: true,
          });
        }
      } catch (err: any) {
        console.warn('Screen sharing cancelled or denied:', err);
      }
    }
  }, [isScreenSharing, socket, isAudioEnabled, isVideoEnabled]);

  return {
    localStream,
    screenStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    remoteParticipants,
    permissionError,
    hostNotice,
    setHostNotice,
    isLocalSpeaking,
    selfSocketId,
    screensharePolicy,
    isMeetingLocked,
    diagnostics,
    spatialTheme,
    setSpatialTheme,
    isHandRaised,
    toggleHandRaise,
    talkTimeMap,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    reconnectMedia: initLocalStream,
  };
}
