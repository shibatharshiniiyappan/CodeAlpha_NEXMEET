import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import {
  Send,
  Paperclip,
  FileText,
  Download,
  Users,
  MessageSquare,
  FolderLock,
  X,
  ShieldCheck,
  Clock,
  MicOff,
  UserX,
  Lock,
  Unlock,
  Share2,
  Sparkles,
  Check,
  UserCheck,
  Crown,
  VolumeX,
  Hand,
} from 'lucide-react';
import { ChatMessage, FileItem, RoomPeer, User, WaitingParticipant } from '../types';
import { uploadMeetingFile, getMeetingFiles } from '../services/api';

interface SidePanelProps {
  roomId: string;
  currentUser: User;
  socket: Socket | null;
  activeTab: 'chat' | 'participants' | 'files';
  onTabChange: (tab: 'chat' | 'participants' | 'files') => void;
  onClose: () => void;
  participants: RoomPeer[];
  onInviteCopy: () => void;
  isHost?: boolean;
  waitingList?: WaitingParticipant[];
  onAdmitParticipant?: (socketId: string) => void;
  onRejectParticipant?: (socketId: string) => void;
  onAdmitAll?: () => void;
  onMuteParticipant?: (socketId: string) => void;
  onMuteAll?: () => void;
  onKickParticipant?: (socketId: string) => void;
  isMeetingLocked?: boolean;
  onToggleLock?: (locked: boolean) => void;
  screensharePolicy?: 'anyone' | 'host_only';
  onToggleScreensharePolicy?: (policy: 'anyone' | 'host_only') => void;
  onOpenAISummary?: () => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  roomId,
  currentUser,
  socket,
  activeTab,
  onTabChange,
  onClose,
  participants,
  onInviteCopy,
  isHost = false,
  waitingList = [],
  onAdmitParticipant,
  onRejectParticipant,
  onAdmitAll,
  onMuteParticipant,
  onMuteAll,
  onKickParticipant,
  isMeetingLocked = false,
  onToggleLock,
  screensharePolicy = 'anyone',
  onToggleScreensharePolicy,
  onOpenAISummary,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load meeting files on tab switch
  useEffect(() => {
    if (activeTab === 'files') {
      getMeetingFiles(roomId)
        .then((res) => setFiles(res.files))
        .catch((e) => console.warn('Could not load files:', e));
    }
  }, [activeTab, roomId]);

  // Socket chat listeners
  useEffect(() => {
    if (!socket) return;

    const handleHistory = (history: ChatMessage[]) => {
      setMessages(history);
    };

    const handleReceived = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.type === 'file' && msg.fileData) {
        getMeetingFiles(roomId)
          .then((res) => setFiles(res.files))
          .catch(() => {});
      }
    };

    socket.on('chat:history', handleHistory);
    socket.on('chat:received', handleReceived);

    return () => {
      socket.off('chat:history', handleHistory);
      socket.off('chat:received', handleReceived);
    };
  }, [socket, roomId]);

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit('chat:send', { text: inputText.trim() });
    setInputText('');
  };

  // Upload file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File exceeds 25 MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      await uploadMeetingFile(roomId, file, currentUser.id, currentUser.name);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] border-l border-slate-800 text-slate-200 w-80 lg:w-96 shrink-0 shadow-2xl z-20">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800 bg-[#0E1524]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTabChange('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'chat'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => onTabChange('participants')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors relative ${
              activeTab === 'participants'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>People ({participants.length})</span>
            {waitingList.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1 right-1" />
            )}
          </button>

          <button
            onClick={() => onTabChange('files')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'files'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderLock className="w-3.5 h-3.5" />
            <span>Files</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Close Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab: Chat */}
      {activeTab === 'chat' && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="mx-3 my-2 p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Direct mesh media protected via DTLS-SRTP.</span>
            </div>
            {onOpenAISummary && (
              <button
                onClick={onOpenAISummary}
                className="text-[11px] font-semibold text-cyan-300 hover:text-white flex items-center gap-1 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/40"
              >
                <Sparkles className="w-3 h-3 text-cyan-300" />
                <span>AI Summary</span>
              </button>
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center py-8">
                <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs text-slate-600 mt-1">Say hello or share files with the team</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;

                if (msg.type === 'system') {
                  return (
                    <div key={msg.id} className="text-center my-2">
                      <span className="text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                      <span className="font-medium text-slate-300">{isMe ? 'You' : msg.senderName}</span>
                      <span>·</span>
                      <span className="tabular-nums">{formatTime(msg.timestamp)}</span>
                    </div>

                    {msg.type === 'file' && msg.fileData ? (
                      <div className="bg-[#1A2234] border border-cyan-500/30 rounded-xl p-3 max-w-[85%] shadow-md">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate">{msg.fileData.originalName}</p>
                            <p className="text-[11px] text-slate-400 tabular-nums">{formatFileSize(msg.fileData.size)}</p>
                          </div>
                        </div>
                        <a
                          href={msg.fileData.downloadUrl}
                          download={msg.fileData.originalName}
                          className="mt-2.5 flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 rounded-lg transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download File</span>
                        </a>
                      </div>
                    ) : (
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed max-w-[85%] break-words ${
                          isMe
                            ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md'
                            : 'bg-slate-800/90 text-slate-100 border border-slate-700/60'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div className="px-4 py-1.5 text-xs text-rose-400 bg-rose-950/40 border-t border-rose-900/50">
              {uploadError}
            </div>
          )}

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-[#0E1524]">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-lg transition-colors disabled:opacity-50"
                title="Share File (Max 25MB)"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-900/90 text-sm text-slate-100 placeholder-slate-500 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 transition-colors"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg font-semibold transition-colors disabled:opacity-30"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {isUploading && (
              <p className="text-[11px] text-cyan-400 mt-1 animate-pulse">Uploading file securely...</p>
            )}
          </form>
        </div>
      )}

      {/* Tab: Participants & Host Controls */}
      {activeTab === 'participants' && (
        <div className="flex flex-col flex-1 p-4 overflow-y-auto space-y-4">
          {/* Host Control Actions Panel */}
          {isHost && (
            <div className="p-3.5 rounded-xl bg-[#0B1120] border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Host Security Controls</span>
                </span>
                {onMuteAll && (
                  <button
                    onClick={onMuteAll}
                    className="flex items-center gap-1 text-[11px] font-semibold text-rose-300 hover:text-rose-200 bg-rose-950/60 hover:bg-rose-900/60 px-2 py-0.5 rounded border border-rose-500/30 transition-colors"
                  >
                    <VolumeX className="w-3 h-3" />
                    <span>Mute All</span>
                  </button>
                )}
              </div>

              {/* Lock Meeting Toggle */}
              {onToggleLock && (
                <div className="flex items-center justify-between py-1 text-xs">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    {isMeetingLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Lock Meeting</span>
                  </span>
                  <button
                    onClick={() => onToggleLock(!isMeetingLocked)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      isMeetingLocked
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {isMeetingLocked ? 'Locked' : 'Unlocked'}
                  </button>
                </div>
              )}

              {/* Screen Share Permission Selector */}
              {onToggleScreensharePolicy && (
                <div className="flex items-center justify-between py-1 text-xs">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Screen Share:</span>
                  </span>
                  <select
                    value={screensharePolicy}
                    onChange={(e) => onToggleScreensharePolicy(e.target.value as 'anyone' | 'host_only')}
                    className="bg-slate-900 text-slate-200 text-[11px] rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="anyone">All Participants</option>
                    <option value="host_only">Host Only</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Waiting Room Section (for Host) */}
          {isHost && waitingList.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Waiting Room ({waitingList.length})</span>
                </span>
                {onAdmitAll && (
                  <button
                    onClick={onAdmitAll}
                    className="text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/30"
                  >
                    Admit All
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                {waitingList.map((waitUser) => (
                  <div
                    key={waitUser.socketId}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={waitUser.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${waitUser.userName}`}
                        alt={waitUser.userName}
                        className="w-6 h-6 rounded-full bg-slate-800"
                      />
                      <span className="text-xs font-medium text-white truncate max-w-[120px]">
                        {waitUser.userName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onAdmitParticipant && (
                        <button
                          onClick={() => onAdmitParticipant(waitUser.socketId)}
                          className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/40"
                          title="Admit to meeting"
                        >
                          Admit
                        </button>
                      )}
                      {onRejectParticipant && (
                        <button
                          onClick={() => onRejectParticipant(waitUser.socketId)}
                          className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] border border-rose-500/40"
                          title="Deny entry"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real-Time Hand-Raising Queue */}
          {participants.some((p) => p.handRaised) && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Hand className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Raised Hands Queue ({participants.filter((p) => p.handRaised).length})</span>
                </span>
              </div>
              <div className="space-y-1.5">
                {participants
                  .filter((p) => p.handRaised)
                  .map((p) => (
                    <div
                      key={`queue-${p.socketId}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 border border-amber-500/30 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={p.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.userName}`}
                          alt={p.userName}
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="font-medium text-white">{p.userName}</span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-mono">Ready to speak</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Active Participants List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                In Meeting ({participants.length})
              </span>
              <button
                onClick={onInviteCopy}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                Copy Invite Code
              </button>
            </div>

            <div className="space-y-2">
              {participants.map((p) => {
                const isMe = p.userId === currentUser.id;
                const isPeerHost = p.isHost;

                return (
                  <div
                    key={p.socketId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={p.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.userName}`}
                        alt={p.userName}
                        className="w-8 h-8 rounded-full border border-cyan-500/30 bg-slate-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white flex items-center gap-1.5 truncate">
                          <span className="truncate">{p.userName}</span>
                          {isMe && (
                            <span className="text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded font-normal shrink-0">
                              You
                            </span>
                          )}
                          {isPeerHost && (
                            <span className="text-[10px] text-amber-300 bg-amber-950 px-1.5 py-0.2 rounded font-semibold border border-amber-500/30 flex items-center gap-1 shrink-0">
                              <Crown className="w-2.5 h-2.5 text-amber-400" />
                              <span>Host</span>
                            </span>
                          )}
                          {p.handRaised && (
                            <span className="text-[10px] text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded font-semibold border border-amber-500/30 flex items-center gap-1 shrink-0">
                              <Hand className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                              <span>Hand</span>
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Connected</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <span className={p.audioEnabled ? 'text-emerald-400' : 'text-slate-600'}>
                          {p.audioEnabled ? 'Mic ON' : 'Muted'}
                        </span>
                      </div>

                      {/* Host Actions on remote participant */}
                      {isHost && !isMe && p.socketId !== 'local' && (
                        <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
                          {onMuteParticipant && (
                            <button
                              onClick={() => onMuteParticipant(p.socketId)}
                              className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                              title="Mute participant"
                            >
                              <MicOff className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onKickParticipant && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Remove ${p.userName} from this meeting?`)) {
                                  onKickParticipant(p.socketId);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                              title="Remove from meeting"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Files */}
      {activeTab === 'files' && (
        <div className="flex flex-col flex-1 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Shared Room Assets</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-cyan-400 hover:underline"
            >
              + Upload File
            </button>
          </div>

          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-500 text-center py-12">
              <FolderLock className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-medium">No files shared yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Upload PDFs, wireframes, project documents, or test files (max 25MB).
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate max-w-[170px]">{file.originalName}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="tabular-nums">{formatFileSize(file.size)}</span>
                        <span>·</span>
                        <span className="truncate">By {file.uploadedByName}</span>
                      </p>
                    </div>
                  </div>

                  <a
                    href={file.downloadUrl}
                    download={file.originalName}
                    className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
