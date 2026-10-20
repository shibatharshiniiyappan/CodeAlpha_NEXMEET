export interface User {
  id: string;
  name: string;
  email?: string;
  avatar: string;
}

export interface AISummary {
  summary: string;
  topics: string[];
  decisions: string[];
  actionItems: Array<{ task: string; assignee?: string; status: string }>;
  generatedAt: string;
}

export type SpatialRoomTheme = 'innovation-lab' | 'focus-room' | 'creative-studio' | 'boardroom';

export interface Meeting {
  id: string;
  code: string;
  title: string;
  hostId: string;
  hostName: string;
  createdAt: string;
  isLocked: boolean;
  passcode?: string;
  hasPasscode?: boolean;
  waitingRoomEnabled?: boolean;
  screensharePolicy?: 'anyone' | 'host_only';
  spatialTheme?: SpatialRoomTheme;
  aiSummary?: AISummary;
}

export interface RoomPeer {
  socketId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
  isSpeaking?: boolean;
  handRaised?: boolean;
  isHost?: boolean;
  joinedAt: number;
}

export interface WaitingParticipant {
  socketId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  requestedAt: number;
}

export interface ChatMessage {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text?: string;
  timestamp: string;
  type: 'text' | 'file' | 'system';
  fileData?: {
    id: string;
    originalName: string;
    size: number;
    mimeType: string;
    downloadUrl: string;
  };
}

export interface FileItem {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedByName: string;
  uploadedAt: string;
  downloadUrl: string;
}

export interface WhiteboardStroke {
  id: string;
  type: 'freehand' | 'line' | 'rect' | 'circle' | 'text' | 'eraser';
  points?: { x: number; y: number }[];
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  color: string;
  width: number;
  text?: string;
  userId: string;
  timestamp: number;
}

export interface SecuritySpecs {
  platform: string;
  encryption: {
    media: {
      protocol: string;
      cipherSuites: string[];
      verification: string;
    };
    signaling: {
      protocol: string;
      certificates: string;
    };
    fileStorage: {
      isolation: string;
      maximumSize: string;
    };
  };
  iceConfiguration: {
    stunServers: string[];
    turnSupported: boolean;
    topology: string;
  };
}

export interface MeetingHistoryRecord {
  id: string;
  meetingCode: string;
  meetingTitle: string;
  role: 'host' | 'participant';
  userId: string;
  userName: string;
  joinedAt: string;
  leftAt?: string;
  durationSeconds: number;
  participantCount: number;
  hasSummary?: boolean;
}

export interface NetworkDiagnosticsStats {
  connectionState: RTCPeerConnectionState | 'disconnected';
  rttMs: number;
  packetLossPercent: number;
  audioBitrateKbps: number;
  videoBitrateKbps: number;
  candidateType: string;
  resolution: string;
  framerate: number;
  jitterMs: number;
  qualityScore: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  timestamp: number;
}

export type CanvasNoteCategory = 'idea' | 'question' | 'challenge' | 'decision' | 'action';

export interface CanvasNote {
  id: string;
  category: CanvasNoteCategory;
  title: string;
  content: string;
  x: number;
  y: number;
  votes: number;
  votedUserIds: string[];
  assignee?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
}

export interface ReactionEvent {
  id: string;
  emoji: string;
  senderName: string;
  timestamp: number;
  xOffsetPercent?: number;
}

export interface TalkTimeStats {
  userId: string;
  userName: string;
  userAvatar: string;
  totalSpeakingSeconds: number;
  percentage: number;
  isCurrentlySpeaking: boolean;
}

