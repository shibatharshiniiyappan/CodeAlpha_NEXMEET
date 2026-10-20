import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Hand, Smile, Heart, Flame, Sparkles, Rocket, Lightbulb, Check } from 'lucide-react';
import { ReactionEvent } from '../types';

interface FloatingReactionsProps {
  socket: Socket | null;
  currentUser: { id: string; name: string };
  isHandRaised: boolean;
  onToggleHand: () => void;
}

const EMOJI_OPTIONS = [
  { emoji: '👏', label: 'Applause' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '🎉', label: 'Party' },
  { emoji: '💡', label: 'Idea' },
  { emoji: '👍', label: 'Thumbs Up' },
];

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({
  socket,
  currentUser,
  isHandRaised,
  onToggleHand,
}) => {
  const [activeReactions, setActiveReactions] = useState<ReactionEvent[]>([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<boolean>(false);

  // Listen for broadcasted reactions
  useEffect(() => {
    if (!socket) return;

    const handleReactionReceived = (reaction: ReactionEvent) => {
      setActiveReactions((prev) => [...prev, reaction]);

      // Remove after 3.5 seconds
      setTimeout(() => {
        setActiveReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 3500);
    };

    socket.on('reaction:received', handleReactionReceived);

    return () => {
      socket.off('reaction:received', handleReactionReceived);
    };
  }, [socket]);

  const sendReaction = (emoji: string) => {
    if (socket) {
      socket.emit('reaction:send', { emoji });
    } else {
      // Local fallback
      const localReaction: ReactionEvent = {
        id: `react-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        emoji,
        senderName: currentUser.name,
        timestamp: Date.now(),
        xOffsetPercent: Math.floor(Math.random() * 70) + 15,
      };
      setActiveReactions((prev) => [...prev, localReaction]);
      setTimeout(() => {
        setActiveReactions((prev) => prev.filter((r) => r.id !== localReaction.id));
      }, 3500);
    }
    setIsEmojiPickerOpen(false);
  };

  return (
    <>
      {/* Floating Animated Emojis Screen Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {activeReactions.map((reaction) => (
          <div
            key={reaction.id}
            style={{
              left: `${reaction.xOffsetPercent ?? 50}%`,
              bottom: '80px',
            }}
            className="absolute flex flex-col items-center animate-reaction-float select-none"
          >
            <span className="text-4xl filter drop-shadow-lg transform transition-transform hover:scale-125">
              {reaction.emoji}
            </span>
            <span className="text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded-full mt-1 border border-white/20 whitespace-nowrap shadow-md">
              {reaction.senderName}
            </span>
          </div>
        ))}
      </div>

      {/* Control Dock Trigger Buttons */}
      <div className="relative flex items-center gap-1.5">
        {/* Hand Raise Toggle Button */}
        <button
          onClick={onToggleHand}
          className={`flex items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-semibold transition-all shadow-md ${
            isHandRaised
              ? 'bg-amber-500 text-slate-950 font-bold border border-amber-400 ring-2 ring-amber-500/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
        >
          <Hand className={`w-4 h-4 ${isHandRaised ? 'fill-slate-950' : 'text-amber-400'}`} />
          <span className="hidden md:inline">{isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
        </button>

        {/* Reactions Emoji Picker Trigger */}
        <div className="relative">
          <button
            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center ${
              isEmojiPickerOpen
                ? 'bg-cyan-500 text-slate-950 border border-cyan-400'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title="Send Reaction"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Quick Reaction Popover */}
          {isEmojiPickerOpen && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-2 bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
              {EMOJI_OPTIONS.map((item) => (
                <button
                  key={item.emoji}
                  onClick={() => sendReaction(item.emoji)}
                  className="p-2 rounded-xl text-xl hover:bg-slate-800 hover:scale-125 transition-transform"
                  title={item.label}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
