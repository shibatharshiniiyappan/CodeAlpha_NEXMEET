import React, { useState } from 'react';
import {
  Lightbulb,
  HelpCircle,
  AlertTriangle,
  Target,
  CheckSquare,
  Plus,
  Trash2,
  ThumbsUp,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  X,
  Layers,
  Folder,
  Compass,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { planIdeaWithAI } from '../../services/taskflowApi';
import { TaskPriority } from '../../types/taskflow';

type NoteCategory = 'idea' | 'question' | 'challenge' | 'decision' | 'action';

interface CanvasCard {
  id: string;
  category: NoteCategory;
  title: string;
  description: string;
  x: number;
  y: number;
  votes: number;
  voted: boolean;
  status: 'new' | 'exploring' | 'ready' | 'converted';
  tags: string[];
  linkedCardId?: string;
}

export const IdeaActionCanvasView: React.FC = () => {
  const { state, convertIdeaToTask } = useTaskFlow();

  // Initial sticky note cards
  const [cards, setCards] = useState<CanvasCard[]>([
    {
      id: 'card-1',
      category: 'idea',
      title: 'Orbital Mesh Task Dependency Visualizer',
      description: 'Render interactive bezier connection curves between blocking tasks directly in the canvas.',
      x: 60,
      y: 40,
      votes: 7,
      voted: true,
      status: 'ready',
      tags: ['Visualization', 'WebRTC'],
    },
    {
      id: 'card-2',
      category: 'question',
      title: 'How do we handle WebSocket reconnect storms on Render?',
      description: 'Implement exponential backoff with jitter and cache delta canvas strokes locally.',
      x: 420,
      y: 50,
      votes: 4,
      voted: false,
      status: 'exploring',
      tags: ['Architecture', 'SocketIO'],
      linkedCardId: 'card-1',
    },
    {
      id: 'card-3',
      category: 'challenge',
      title: 'Mobile viewport perspective distortion',
      description: 'On screens <640px, CSS perspective(1200px) causes element clipping on vertical scroll.',
      x: 780,
      y: 60,
      votes: 5,
      voted: false,
      status: 'new',
      tags: ['Mobile', 'CSS'],
    },
    {
      id: 'card-4',
      category: 'decision',
      title: 'Enforce deterministic fallback for all AI planning RPCs',
      description: 'Zero external dependencies will break offline users if Gemini API key is missing.',
      x: 180,
      y: 320,
      votes: 11,
      voted: true,
      status: 'ready',
      tags: ['Reliability', 'AI'],
    },
    {
      id: 'card-5',
      category: 'action',
      title: 'Audit DTLS-SRTP packet loss in high latency conditions',
      description: 'Execute synthetic stress testing with simulated 150ms RTT and 2% jitter.',
      x: 580,
      y: 330,
      votes: 6,
      voted: false,
      status: 'converted',
      tags: ['Security', 'Testing'],
    },
  ]);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<NoteCategory | 'all'>('all');
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<NoteCategory>('idea');

  // Convert Modal State
  const [convertingCard, setConvertingCard] = useState<CanvasCard | null>(null);
  const [convertProject, setConvertProject] = useState(state.projects[0]?.id || '');
  const [convertRoom, setConvertRoom] = useState(state.rooms[0]?.id || '');
  const [convertPriority, setConvertPriority] = useState<TaskPriority>('medium');
  const [convertDueDate, setConvertDueDate] = useState(
    new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]
  );
  const [convertAssignee, setConvertAssignee] = useState('Alex Chen');

  // AI Smart Planning Modal State
  const [planningCard, setPlanningCard] = useState<CanvasCard | null>(null);
  const [aiPlanningLoading, setAiPlanningLoading] = useState(false);
  const [aiPlanningData, setAiPlanningData] = useState<{
    subtasks: string[];
    suggestedPriority: TaskPriority;
    estimatedDays: number;
    risks: string[];
    dependenciesAdvice: string;
    isAI: boolean;
  } | null>(null);

  const categoryConfigs: Record<
    NoteCategory,
    { label: string; icon: React.ElementType; border: string; bg: string; badgeText: string }
  > = {
    idea: {
      label: 'Idea',
      icon: Lightbulb,
      border: 'border-amber-500/40 hover:border-amber-400',
      bg: 'bg-amber-950/20',
      badgeText: 'text-amber-300 bg-amber-950/60 border-amber-700/60',
    },
    question: {
      label: 'Question',
      icon: HelpCircle,
      border: 'border-cyan-500/40 hover:border-cyan-400',
      bg: 'bg-cyan-950/20',
      badgeText: 'text-cyan-300 bg-cyan-950/60 border-cyan-700/60',
    },
    challenge: {
      label: 'Challenge',
      icon: AlertTriangle,
      border: 'border-rose-500/40 hover:border-rose-400',
      bg: 'bg-rose-950/20',
      badgeText: 'text-rose-300 bg-rose-950/60 border-rose-700/60',
    },
    decision: {
      label: 'Decision',
      icon: Target,
      border: 'border-emerald-500/40 hover:border-emerald-400',
      bg: 'bg-emerald-950/20',
      badgeText: 'text-emerald-300 bg-emerald-950/60 border-emerald-700/60',
    },
    action: {
      label: 'Action Item',
      icon: CheckSquare,
      border: 'border-violet-500/40 hover:border-violet-400',
      bg: 'bg-violet-950/20',
      badgeText: 'text-violet-300 bg-violet-950/60 border-violet-700/60',
    },
  };

  const handleVote = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        const newVoted = !c.voted;
        return {
          ...c,
          voted: newVoted,
          votes: newVoted ? c.votes + 1 : c.votes - 1,
        };
      })
    );
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newCard: CanvasCard = {
      id: `card-${Date.now().toString(36)}`,
      category: newCategory,
      title: newTitle.trim(),
      description: newDesc.trim() || 'No description provided.',
      x: 80 + (cards.length % 4) * 80,
      y: 80 + Math.floor(cards.length / 4) * 60,
      votes: 1,
      voted: true,
      status: 'new',
      tags: ['brainstorm', newCategory],
    };
    setCards([newCard, ...cards]);
    setNewTitle('');
    setNewDesc('');
    setIsNewCardModalOpen(false);
  };

  const handleDeleteCard = (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handleOpenSmartPlan = async (card: CanvasCard) => {
    setPlanningCard(card);
    setAiPlanningLoading(true);
    try {
      const plan = await planIdeaWithAI(card.title, card.description, card.category);
      setAiPlanningData(plan);
    } finally {
      setAiPlanningLoading(false);
    }
  };

  const handleExecuteConversion = () => {
    if (!convertingCard) return;

    // Convert to TaskFlow Task
    convertIdeaToTask({
      title: convertingCard.title,
      description: convertingCard.description,
      category: convertingCard.category,
      priority: convertPriority,
      projectId: convertProject,
      roomId: convertRoom,
      dueDate: convertDueDate,
      assigneeName: convertAssignee,
    });

    // Mark card as converted
    setCards((prev) =>
      prev.map((c) => (c.id === convertingCard.id ? { ...c, status: 'converted' } : c))
    );

    setConvertingCard(null);
  };

  const filteredCards = cards.filter(
    (c) => activeCategoryFilter === 'all' || c.category === activeCategoryFilter
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#080D19] overflow-hidden">
      {/* Canvas Top Bar */}
      <div className="px-6 py-4 border-b border-slate-800 bg-[#0B132B]/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
              Idea-to-Action Collaborative Canvas
            </h1>
            <span className="text-xs font-mono text-amber-300 bg-amber-950/60 border border-amber-800/40 px-2.5 py-0.5 rounded-full">
              {cards.length} Notes ({cards.filter((c) => c.status === 'converted').length} Converted)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Brainstorm ideas, vote on team concepts, and turn approved items into actionable tasks
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeCategoryFilter === 'all'
                ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Notes ({cards.length})
          </button>
          {Object.entries(categoryConfigs).map(([key, cfg]) => {
            const count = cards.filter((c) => c.category === key).length;
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveCategoryFilter(key as NoteCategory)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCategoryFilter === key
                    ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cfg.label}</span>
                <span className="font-mono text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsNewCardModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Freeform Interactive Canvas Stage */}
      <div className="flex-1 overflow-auto p-6 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
        {/* Canvas Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
          {filteredCards.map((card) => {
            const cfg = categoryConfigs[card.category] || categoryConfigs.idea;
            const CardIcon = cfg.icon;

            return (
              <div
                key={card.id}
                className={`p-4 rounded-2xl bg-[#0F172A]/90 border ${cfg.border} shadow-xl hover:shadow-2xl transition-all duration-200 flex flex-col justify-between group relative`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 font-mono ${cfg.badgeText}`}
                    >
                      <CardIcon className="w-3 h-3" />
                      <span>{cfg.label}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                          card.status === 'converted'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {card.status}
                      </span>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-bold text-white mb-2 leading-snug group-hover:text-amber-200 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {card.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions Bottom Bar */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {/* Vote Button */}
                  <button
                    onClick={() => handleVote(card.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      card.voted
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{card.votes}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* AI Smart Plan Suggestion */}
                    <button
                      onClick={() => handleOpenSmartPlan(card)}
                      title="AI Subtask Breakdown & Planning"
                      className="flex items-center gap-1 px-2.5 py-1 bg-violet-950/80 hover:bg-violet-900 text-violet-300 border border-violet-800/60 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      <span>AI Plan</span>
                    </button>

                    {/* Convert to Task */}
                    {card.status !== 'converted' ? (
                      <button
                        onClick={() => setConvertingCard(card)}
                        className="flex items-center gap-1 px-3 py-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        <span>Convert</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono font-semibold px-2 py-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>In Tasks</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Convert to Task Modal */}
      {convertingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Convert Idea to Actionable Task</h3>
              </div>
              <button
                onClick={() => setConvertingCard(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs font-bold text-white mb-1">{convertingCard.title}</div>
              <p className="text-xs text-slate-400">{convertingCard.description}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Destination Project
                </label>
                <select
                  value={convertProject}
                  onChange={(e) => setConvertProject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Link to Spatial Room
                </label>
                <select
                  value={convertRoom}
                  onChange={(e) => setConvertRoom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  {state.rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={convertPriority}
                    onChange={(e) => setConvertPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={convertDueDate}
                    onChange={(e) => setConvertDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assigned Collaborator
                </label>
                <input
                  type="text"
                  value={convertAssignee}
                  onChange={(e) => setConvertAssignee(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setConvertingCard(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteConversion}
                className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Create Actionable Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Smart Planning Suggestion Modal */}
      {planningCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#0F172A] border border-violet-800/80 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <h3 className="text-base font-bold text-white">AI Planning & Subtask Breakdown</h3>
              </div>
              <button
                onClick={() => {
                  setPlanningCard(null);
                  setAiPlanningData(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">Concept: </span>
              <span className="font-bold text-white">{planningCard.title}</span>
            </div>

            {aiPlanningLoading ? (
              <div className="py-12 text-center space-y-3">
                <Sparkles className="w-6 h-6 text-violet-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-300">
                  Synthesizing execution dependencies and technical subtasks...
                </p>
              </div>
            ) : aiPlanningData ? (
              <div className="space-y-4 text-xs">
                {/* AI / Fallback Source Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
                      aiPlanningData.isAI
                        ? 'bg-violet-950 text-violet-300 border-violet-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {aiPlanningData.isAI
                      ? '⚡ Powered by Gemini 3.8 Flash'
                      : '⚙️ Deterministic Rule-Based Planner (Offline Mode)'}
                  </span>
                  <span className="text-slate-400 font-mono">
                    Est. Duration: {aiPlanningData.estimatedDays} Days
                  </span>
                </div>

                {/* Subtasks */}
                <div>
                  <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-2">
                    Recommended Subtasks
                  </h4>
                  <div className="space-y-1.5">
                    {aiPlanningData.subtasks.map((st, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risks & Dependencies */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40">
                    <div className="font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Potential Risks</span>
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4">
                      {aiPlanningData.risks.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/40">
                    <div className="font-bold text-blue-300 mb-1 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Dependencies</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {aiPlanningData.dependenciesAdvice}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setPlanningCard(null);
                      setAiPlanningData(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setConvertingCard(planningCard);
                      setConvertPriority(aiPlanningData.suggestedPriority);
                      setPlanningCard(null);
                      setAiPlanningData(null);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-950 font-bold text-xs rounded-xl shadow-md"
                  >
                    Proceed to Convert →
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Add New Note Modal */}
      {isNewCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create Idea Canvas Note</h3>
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as NoteCategory)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="idea">Idea (Brainstorming & Innovations)</option>
                  <option value="question">Question (Technical Queries)</option>
                  <option value="challenge">Challenge (Blockers & Bottlenecks)</option>
                  <option value="decision">Decision (Consensus & Architecture)</option>
                  <option value="action">Action Item (Direct Tasks)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement WebRTC Simulcast layers"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Context, requirements, and design notes..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewCardModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Create Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
