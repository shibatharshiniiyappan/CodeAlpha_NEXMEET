import React from 'react';
import {
  BarChart3,
  X,
  Users,
  Mic,
  Clock,
  Sparkles,
  Award,
  AlertCircle,
  Copy,
  Check,
  TrendingUp,
} from 'lucide-react';
import { RoomPeer, TalkTimeStats } from '../types';

interface ParticipationAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  meetingDurationSeconds: number;
  talkTimeMap: Map<string, number>; // userId -> total speaking seconds
  participants: RoomPeer[];
  currentUserId: string;
}

export const ParticipationAnalyticsModal: React.FC<ParticipationAnalyticsModalProps> = ({
  isOpen,
  onClose,
  roomId,
  meetingDurationSeconds,
  talkTimeMap,
  participants,
  currentUserId,
}) => {
  const [isCopied, setIsCopied] = React.useState<boolean>(false);

  if (!isOpen) return null;

  // Calculate total seconds spoken by all participants combined
  let totalSpeakingSecondsAll = 0;
  const statsList: TalkTimeStats[] = participants.map((p) => {
    const secs = talkTimeMap.get(p.userId) || 0;
    totalSpeakingSecondsAll += secs;
    return {
      userId: p.userId,
      userName: p.userName,
      userAvatar: p.userAvatar,
      totalSpeakingSeconds: secs,
      percentage: 0,
      isCurrentlySpeaking: !!p.isSpeaking,
    };
  });

  // Calculate percentages
  statsList.forEach((stat) => {
    stat.percentage =
      totalSpeakingSecondsAll > 0
        ? Math.round((stat.totalSpeakingSeconds / totalSpeakingSecondsAll) * 100)
        : Math.round(100 / Math.max(1, statsList.length));
  });

  // Sort by talk time descending
  statsList.sort((a, b) => b.totalSpeakingSeconds - a.totalSpeakingSeconds);

  // Determine conversation balance status
  const maxPercent = statsList.length > 0 ? statsList[0].percentage : 0;
  let balanceScore = 'Balanced Collaboration';
  let balanceDescription = 'Speaking time is distributed fairly among team members.';
  let balanceColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';

  if (statsList.length > 1 && maxPercent > 65) {
    balanceScore = 'Single Speaker Dominant';
    balanceDescription = `${statsList[0].userName} accounts for ${maxPercent}% of conversation time.`;
    balanceColor = 'text-amber-400 bg-amber-950/60 border-amber-500/40';
  } else if (statsList.length > 2 && maxPercent < 45) {
    balanceScore = 'Highly Democratic Synergy';
    balanceDescription = 'Outstanding multi-perspective engagement across the team.';
    balanceColor = 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40';
  }

  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}m ${remainder}s`;
  };

  const handleCopyMetrics = () => {
    let report = `NEXMEET Participation Analytics (${roomId})\nMeeting Duration: ${formatSecs(meetingDurationSeconds)}\nTotal Speaking Time: ${formatSecs(totalSpeakingSecondsAll)}\nBalance Status: ${balanceScore}\n\n`;
    statsList.forEach((s) => {
      report += `- ${s.userName}: ${formatSecs(s.totalSpeakingSeconds)} (${s.percentage}%)\n`;
    });
    navigator.clipboard.writeText(report);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#111827] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Participation & Talk-Time Analytics</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                  Real-Time
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">Room: {roomId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMetrics}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Copy Metrics Report"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {/* Summary Overview Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400">Total Duration</span>
              <span className="text-base font-bold font-mono text-white mt-1">
                {formatSecs(meetingDurationSeconds)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400">Active Spoken Time</span>
              <span className="text-base font-bold font-mono text-cyan-400 mt-1">
                {formatSecs(totalSpeakingSecondsAll)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400">Active Speakers</span>
              <span className="text-base font-bold font-mono text-violet-400 mt-1">
                {statsList.filter((s) => s.totalSpeakingSeconds > 0).length} / {participants.length}
              </span>
            </div>
          </div>

          {/* Balance Evaluation Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${balanceColor}`}>
            <TrendingUp className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold">{balanceScore}</h4>
              <p className="text-[11px] opacity-90 mt-0.5">{balanceDescription}</p>
            </div>
          </div>

          {/* Segmented Distribution Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
              <span>Conversation Share</span>
              <span className="text-[11px] text-slate-500 font-mono">100% Breakdown</span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-800 flex overflow-hidden p-0.5 border border-slate-700">
              {statsList.map((stat, i) => {
                const colors = ['bg-cyan-400', 'bg-violet-400', 'bg-amber-400', 'bg-emerald-400', 'bg-pink-400'];
                const color = colors[i % colors.length];

                return (
                  <div
                    key={stat.userId}
                    style={{ width: `${Math.max(4, stat.percentage)}%` }}
                    className={`h-full ${color} first:rounded-l-full last:rounded-r-full transition-all duration-500`}
                    title={`${stat.userName}: ${stat.percentage}%`}
                  />
                );
              })}
            </div>
          </div>

          {/* Participant Breakdown List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Participant Talk-Time Leaderboard
            </h4>

            {statsList.map((stat, i) => {
              const isMe = stat.userId === currentUserId;

              return (
                <div
                  key={stat.userId}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    isMe
                      ? 'bg-cyan-950/20 border-cyan-500/30'
                      : 'bg-[#111827] border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-500 w-4">
                      #{i + 1}
                    </span>
                    <img
                      src={stat.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${stat.userName}`}
                      alt={stat.userName}
                      className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {stat.userName} {isMe && '(You)'}
                        </span>
                        {stat.isCurrentlySpeaking && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" title="Speaking right now" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatSecs(stat.totalSpeakingSeconds)} spoken
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold font-mono text-cyan-300">
                      {stat.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
