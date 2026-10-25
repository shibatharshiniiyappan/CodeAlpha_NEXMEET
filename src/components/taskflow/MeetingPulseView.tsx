import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  Square,
  Clock,
  Users,
  CheckCircle2,
  Plus,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Target,
  CheckSquare,
  ThumbsUp,
  Folder,
  Calendar,
  X,
  Share2,
} from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { MeetingPulseSession, MeetingPulseParticipant } from '../../types/taskflow';

export const MeetingPulseView: React.FC = () => {
  const { state, saveMeetingSession, addMeetingReaction, convertActionItemToTask } = useTaskFlow();

  const [activeSessionId, setActiveSessionId] = useState<string>(state.meetings[0]?.id || '');
  const [timerSeconds, setTimerSeconds] = useState<number>(3240);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // New Note / Decision / Action Item Inputs
  const [newNoteText, setNewNoteText] = useState('');
  const [newDecisionText, setNewDecisionText] = useState('');
  const [newActionItemText, setNewActionItemText] = useState('');
  const [newAgendaText, setNewAgendaText] = useState('');

  // Floating reaction toast
  const [lastReaction, setLastReaction] = useState<string | null>(null);

  const currentMeeting = state.meetings.find((m) => m.id === activeSessionId) || state.meetings[0];

  // Live timer tick
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  if (!currentMeeting) return null;

  const formatDuration = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendReaction = (emoji: string) => {
    addMeetingReaction(currentMeeting.id, emoji);
    setLastReaction(emoji);
    setTimeout(() => setLastReaction(null), 1500);
  };

  const handleAddAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgendaText.trim()) return;
    const updated = {
      ...currentMeeting,
      agenda: [
        ...currentMeeting.agenda,
        { id: `ag-${Date.now()}`, text: newAgendaText.trim(), completed: false },
      ],
    };
    saveMeetingSession(updated);
    setNewAgendaText('');
  };

  const handleToggleAgenda = (agId: string) => {
    const updated = {
      ...currentMeeting,
      agenda: currentMeeting.agenda.map((a) => (a.id === agId ? { ...a, completed: !a.completed } : a)),
    };
    saveMeetingSession(updated);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const updated = {
      ...currentMeeting,
      notes: [
        ...currentMeeting.notes,
        {
          id: `nt-${Date.now()}`,
          text: newNoteText.trim(),
          authorName: 'Alex Chen',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    saveMeetingSession(updated);
    setNewNoteText('');
  };

  const handleAddDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecisionText.trim()) return;
    const updated = {
      ...currentMeeting,
      decisions: [
        ...currentMeeting.decisions,
        {
          id: `dc-${Date.now()}`,
          text: newDecisionText.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    saveMeetingSession(updated);
    setNewDecisionText('');
  };

  const handleConvertAction = (text: string) => {
    convertActionItemToTask({
      text,
      meetingId: currentMeeting.id,
      meetingTitle: currentMeeting.title,
      projectId: currentMeeting.projectId,
      assigneeName: 'Alex Chen',
    });
  };

  const totalSpeaking = currentMeeting.participants.reduce(
    (acc, p) => acc + (p.talkTimeSeconds || 0),
    0
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#080D19] overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-[#0B132B]/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 animate-pulse"></span>
              Meeting Pulse & Discussion Intelligence
            </h1>
            <span
              className={`text-xs font-mono uppercase px-2 py-0.5 rounded-full border ${
                currentMeeting.status === 'active'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {currentMeeting.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Participation metrics, agenda tracking, quick consensus reactions, and action item extraction
          </p>
        </div>

        {/* Live Session Timer & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-sm text-cyan-300 shadow-inner">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{formatDuration(timerSeconds)}</span>
          </div>

          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              isTimerRunning
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
            }`}
          >
            {isTimerRunning ? <Square className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
            <span>{isTimerRunning ? 'Pause Session' : 'Start Session'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Quick Reaction Strip */}
          <div className="p-4 rounded-2xl bg-[#0B132B]/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Live Quick Consensus Reactions:</span>
            </div>

            <div className="flex items-center gap-2">
              {['👍', '💡', '❤️', '👏', '❓'].map((emoji) => {
                const count =
                  currentMeeting.reactions.find((r) => r.emoji === emoji)?.count || 0;
                return (
                  <button
                    key={emoji}
                    onClick={() => handleSendReaction(emoji)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-white text-xs font-mono transition-all transform hover:scale-105 active:scale-95"
                  >
                    <span>{emoji}</span>
                    <span className="text-slate-400 font-bold">{count}</span>
                  </button>
                );
              })}
            </div>

            {lastReaction && (
              <span className="text-xs text-cyan-400 font-mono animate-bounce">
                Reaction Broadcasted! {lastReaction}
              </span>
            )}
          </div>

          {/* 2-Column Layout: Participation Insights & Agenda/Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: Participation Analytics & Speaking Distribution */}
            <div className="lg:col-span-5 space-y-6">
              {/* Speaking Time Distribution */}
              <div className="p-5 rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Speaking Time Distribution
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Actual Session Audio Events</span>
                </div>

                <div className="space-y-3.5">
                  {currentMeeting.participants.map((p) => {
                    const pct =
                      totalSpeaking > 0 ? Math.round((p.talkTimeSeconds / totalSpeaking) * 100) : 0;
                    return (
                      <div key={p.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <img
                              src={p.avatar}
                              alt={p.name}
                              className="w-5 h-5 rounded-full border border-slate-700 bg-slate-800"
                            />
                            <span className="font-semibold text-slate-200">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                            <span>{Math.round(p.talkTimeSeconds / 60)}m</span>
                            <span className="font-bold text-cyan-400">{pct}%</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/80 leading-relaxed">
                  Insights measured from active microphone volume threshold events during session. No audio is recorded or stored.
                </p>
              </div>

              {/* Attendance & Session Telemetry */}
              <div className="p-5 rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xl space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Participant Attendance ({currentMeeting.participants.length})</span>
                </div>

                <div className="space-y-2">
                  {currentMeeting.participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-full" />
                        <span className="font-medium text-slate-200">{p.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">Joined: {p.joinedAt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Agenda, Decisions & Action Items */}
            <div className="lg:col-span-7 space-y-6">
              {/* Agenda Tracker */}
              <div className="p-5 rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-cyan-400" />
                    <span>Meeting Agenda ({currentMeeting.agenda.filter((a) => a.completed).length}/{currentMeeting.agenda.length})</span>
                  </h3>
                </div>

                <div className="space-y-2">
                  {currentMeeting.agenda.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleAgenda(item.id)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs transition-colors"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-600 shrink-0" />
                      )}
                      <span
                        className={`flex-1 ${
                          item.completed ? 'line-through text-slate-500' : 'text-slate-200 font-medium'
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddAgenda} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newAgendaText}
                    onChange={(e) => setNewAgendaText(e.target.value)}
                    placeholder="Add agenda topic..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold"
                  >
                    + Add
                  </button>
                </form>
              </div>

              {/* Decisions & Consensus Log */}
              <div className="p-5 rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>Key Decisions Made ({currentMeeting.decisions.length})</span>
                  </h3>
                </div>

                <div className="space-y-2">
                  {currentMeeting.decisions.map((dec) => (
                    <div
                      key={dec.id}
                      className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs text-slate-200 flex items-start justify-between gap-3"
                    >
                      <div className="leading-relaxed font-medium">✓ {dec.text}</div>
                      <span className="text-[10px] text-emerald-400/80 font-mono shrink-0">
                        {dec.timestamp}
                      </span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddDecision} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newDecisionText}
                    onChange={(e) => setNewDecisionText(e.target.value)}
                    placeholder="Log agreed team decision..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-semibold"
                  >
                    Record
                  </button>
                </form>
              </div>

              {/* Meeting Notes with Task Conversion */}
              <div className="p-5 rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>Meeting Notes & Action Items</span>
                  </h3>
                  <span className="text-[10px] text-cyan-400 font-mono">Convert to Task Universe</span>
                </div>

                <div className="space-y-2.5">
                  {currentMeeting.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start justify-between gap-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-cyan-300">{note.authorName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{note.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">{note.text}</p>
                      </div>

                      <button
                        onClick={() => handleConvertAction(note.text)}
                        title="Create TaskFlow Task"
                        className="opacity-80 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-semibold transition-all shrink-0"
                      >
                        <span>Convert</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Add meeting note or action item..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold"
                  >
                    Add Note
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
