import React, { useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
import {
  Lightbulb,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Plus,
  Trash2,
  ThumbsUp,
  X,
  Maximize2,
  Minimize2,
  Grid,
  Columns,
  Download,
  Copy,
  Check,
  Sparkles,
  Edit2,
  ArrowRight,
  RotateCcw,
  User as UserIcon,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { CanvasNote, CanvasNoteCategory, User as AuthUser } from '../types';
import { useIdeaCanvas } from '../hooks/useIdeaCanvas';

export interface IdeaCanvasProps {
  roomId: string;
  socket: Socket | null;
  currentUser: AuthUser | { id: string; name: string; avatar?: string };
  isOpen?: boolean;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
  participants?: Array<{ userId: string; userName: string }>;
  onConvertTaskToWorkspace?: (task: { title: string; description: string; priority: 'low' | 'medium' | 'high' | 'urgent'; assignee?: string }) => void;
}

// 5 Note Categories with curated colors: amber, cyan, rose, emerald, violet
export const STICKY_CATEGORIES: Record<
  CanvasNoteCategory,
  {
    name: string;
    icon: React.ElementType;
    badgeBg: string;
    badgeText: string;
    bgGradient: string;
    border: string;
    glow: string;
    tapeColor: string;
    placeholder: string;
    accentColor: string;
  }
> = {
  idea: {
    name: 'Idea',
    icon: Lightbulb,
    badgeBg: 'bg-amber-500/20 border-amber-400/40',
    badgeText: 'text-amber-300',
    bgGradient: 'from-amber-950/80 via-amber-900/40 to-[#14120B]',
    border: 'border-amber-500/50 hover:border-amber-400',
    glow: 'shadow-amber-500/10',
    tapeColor: 'bg-amber-400/40',
    placeholder: 'Share an innovative concept or brainstorm solution...',
    accentColor: '#f59e0b',
  },
  question: {
    name: 'Question',
    icon: HelpCircle,
    badgeBg: 'bg-cyan-500/20 border-cyan-400/40',
    badgeText: 'text-cyan-300',
    bgGradient: 'from-cyan-950/80 via-sky-900/40 to-[#0A141F]',
    border: 'border-cyan-500/50 hover:border-cyan-400',
    glow: 'shadow-cyan-500/10',
    tapeColor: 'bg-cyan-400/40',
    placeholder: 'Ask a clarifying question or query for the team...',
    accentColor: '#06b6d4',
  },
  challenge: {
    name: 'Challenge',
    icon: AlertTriangle,
    badgeBg: 'bg-rose-500/20 border-rose-400/40',
    badgeText: 'text-rose-300',
    bgGradient: 'from-rose-950/80 via-red-900/40 to-[#1B0B0E]',
    border: 'border-rose-500/50 hover:border-rose-400',
    glow: 'shadow-rose-500/10',
    tapeColor: 'bg-rose-400/40',
    placeholder: 'Highlight a blocker, constraint, or risk...',
    accentColor: '#f43f5e',
  },
  decision: {
    name: 'Decision',
    icon: CheckCircle2,
    badgeBg: 'bg-emerald-500/20 border-emerald-400/40',
    badgeText: 'text-emerald-300',
    bgGradient: 'from-emerald-950/80 via-teal-900/40 to-[#071913]',
    border: 'border-emerald-500/50 hover:border-emerald-400',
    glow: 'shadow-emerald-500/10',
    tapeColor: 'bg-emerald-400/40',
    placeholder: 'Document an agreed architecture or product decision...',
    accentColor: '#10b981',
  },
  action: {
    name: 'Action Item',
    icon: CheckSquare,
    badgeBg: 'bg-violet-500/20 border-violet-400/40',
    badgeText: 'text-violet-300',
    bgGradient: 'from-violet-950/80 via-purple-900/40 to-[#12081F]',
    border: 'border-violet-500/50 hover:border-violet-400',
    glow: 'shadow-violet-500/10',
    tapeColor: 'bg-violet-400/40',
    placeholder: 'Define an actionable task to be executed...',
    accentColor: '#8b5cf6',
  },
};

export const IdeaCanvas: React.FC<IdeaCanvasProps> = ({
  roomId,
  socket,
  currentUser,
  isOpen = true,
  onClose,
  isExpanded = false,
  onToggleExpand,
  className = '',
  participants = [],
  onConvertTaskToWorkspace,
}) => {
  const {
    notes,
    isLoading,
    activeFilter,
    setActiveFilter,
    filteredNotes,
    addNote,
    updateNote,
    moveNote,
    deleteNote,
    toggleVote,
  } = useIdeaCanvas({ roomId, socket, currentUser });

  const [viewMode, setViewMode] = useState<'canvas' | 'columns'>('canvas');
  const [isCreatingModalOpen, setIsCreatingModalOpen] = useState<boolean>(false);
  const [quickAddCategory, setQuickAddCategory] = useState<CanvasNoteCategory>('idea');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newAssignee, setNewAssignee] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Undo history buffer for deleted notes
  const [undoStack, setUndoStack] = useState<CanvasNote[]>([]);

  // Dragging state for freeform 2D canvas
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasBoardRef = useRef<HTMLDivElement | null>(null);

  // Inline edit state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');

  // Task Conversion Modal state
  const [convertingNote, setConvertingNote] = useState<CanvasNote | null>(null);
  const [taskStatus, setTaskStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [taskAssignee, setTaskAssignee] = useState<string>('');

  if (!isOpen) return null;

  // Handle Note Submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addNote({
      category: quickAddCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      assignee: newAssignee.trim() || undefined,
    });

    setNewTitle('');
    setNewContent('');
    setNewAssignee('');
    setIsCreatingModalOpen(false);
  };

  const handleQuickAdd = (category: CanvasNoteCategory) => {
    setQuickAddCategory(category);
    setIsCreatingModalOpen(true);
  };

  const handleDeleteWithUndo = (note: CanvasNote) => {
    setUndoStack((prev) => [note, ...prev.slice(0, 9)]);
    deleteNote(note.id);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const [lastNote, ...rest] = undoStack;
    setUndoStack(rest);
    addNote({
      category: lastNote.category,
      title: lastNote.title,
      content: lastNote.content,
      x: lastNote.x,
      y: lastNote.y,
      assignee: lastNote.assignee,
    });
  };

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent, note: CanvasNote) => {
    if (viewMode === 'columns' || editingNoteId === note.id) return;
    setDraggedNoteId(note.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNoteId || !canvasBoardRef.current || viewMode === 'columns') return;
    const boardRect = canvasBoardRef.current.getBoundingClientRect();
    const newX = Math.max(10, Math.min(boardRect.width - 250, e.clientX - boardRect.left - dragOffset.x));
    const newY = Math.max(10, Math.min(boardRect.height - 220, e.clientY - boardRect.top - dragOffset.y));

    moveNote(draggedNoteId, Math.round(newX), Math.round(newY));
  };

  const handleMouseUp = () => {
    setDraggedNoteId(null);
  };

  // Inline edit handlers
  const handleStartEdit = (note: CanvasNote) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content || '');
  };

  const handleSaveEdit = (noteId: string) => {
    if (editTitle.trim()) {
      updateNote(noteId, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });
    }
    setEditingNoteId(null);
  };

  // Convert note to actionable task
  const handleOpenTaskConvert = (note: CanvasNote) => {
    setConvertingNote(note);
    setTaskStatus(note.status || 'pending');
    setTaskAssignee(note.assignee || currentUser.name);
  };

  const handleConfirmConvertTask = () => {
    if (!convertingNote) return;
    updateNote(convertingNote.id, {
      category: 'action',
      status: taskStatus,
      assignee: taskAssignee.trim() || undefined,
    });

    if (onConvertTaskToWorkspace) {
      onConvertTaskToWorkspace({
        title: convertingNote.title,
        description: convertingNote.content || 'Converted from Idea-to-Action Canvas.',
        priority: convertingNote.category === 'challenge' ? 'high' : 'medium',
        assignee: taskAssignee.trim() || undefined,
      });
    }

    setConvertingNote(null);
  };

  // Toggle status directly on note
  const handleCycleStatus = (note: CanvasNote) => {
    const nextStatusMap: Record<string, 'pending' | 'in_progress' | 'completed'> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    };
    const current = note.status || 'pending';
    updateNote(note.id, { status: nextStatusMap[current] });
  };

  // Copy Markdown Summary
  const handleCopySummary = () => {
    let report = `# NEXMEET 2.0 Idea-to-Action Canvas Summary\nRoom: ${roomId}\nExported: ${new Date().toLocaleString()}\n\n`;
    const categories: CanvasNoteCategory[] = ['idea', 'question', 'challenge', 'decision', 'action'];

    categories.forEach((cat) => {
      const catNotes = notes.filter((n) => n.category === cat);
      if (catNotes.length > 0) {
        report += `## ${STICKY_CATEGORIES[cat].name}s (${catNotes.length})\n`;
        catNotes.forEach((n) => {
          const statusText = n.status ? ` [Status: ${n.status.replace('_', ' ').toUpperCase()}]` : '';
          const assigneeText = n.assignee ? ` [Assignee: ${n.assignee}]` : '';
          report += `- **${n.title}** (+${n.votes} votes by ${n.createdByName})${statusText}${assigneeText}\n`;
          if (n.content) report += `  > ${n.content}\n`;
        });
        report += '\n';
      }
    });

    navigator.clipboard.writeText(report);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Download Markdown File
  const handleDownloadMarkdown = () => {
    let report = `# NEXMEET 2.0 Idea-to-Action Canvas Report\nRoom: ${roomId}\nGenerated: ${new Date().toLocaleString()}\n\n`;
    notes.forEach((n) => {
      report += `### [${n.category.toUpperCase()}] ${n.title}\n`;
      report += `- **Creator:** ${n.createdByName} | **Votes:** ${n.votes}\n`;
      if (n.assignee) report += `- **Assignee:** ${n.assignee}\n`;
      if (n.status) report += `- **Status:** ${n.status}\n`;
      if (n.content) report += `\n${n.content}\n`;
      report += '\n---\n\n';
    });
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexmeet-canvas-${roomId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allCategories: CanvasNoteCategory[] = ['idea', 'question', 'challenge', 'decision', 'action'];

  return (
    <div
      className={`relative flex flex-col bg-[#0B1120] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-sans ${className} ${
        isExpanded ? 'w-[98vw] h-[94vh]' : 'w-full max-w-5xl h-[82vh]'
      }`}
    >
      {/* Top Header & Toolbar */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-[#111827] border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 via-cyan-500/20 to-violet-600/30 text-amber-300 border border-amber-500/30 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Idea-to-Action Canvas</span>
              <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                Live Sync ({notes.length} items)
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Transform brainstorming into structured, trackable work with 5 note categories.
            </p>
          </div>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-2">
          {undoStack.length > 0 && (
            <button
              onClick={handleUndo}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors"
              title="Undo last deleted note"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}

          {/* View Mode Toggle: Freeform Canvas vs 5-Column Kanban */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setViewMode('canvas')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'canvas'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Freeform 2D Canvas"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Canvas</span>
            </button>
            <button
              onClick={() => setViewMode('columns')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'columns'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="5-Column Categorized Kanban View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">5-Column Kanban</span>
            </button>
          </div>

          {/* Export Actions */}
          <button
            onClick={handleDownloadMarkdown}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Download Canvas Markdown Report"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export</span>
          </button>

          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Copy Markdown Summary to Clipboard"
          >
            {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copiedNotification ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Expand / Minimize */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={isExpanded ? 'Restore View' : 'Expand View'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Sub-toolbar: 5 Category Badges & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-6 py-2 bg-slate-900/80 border-b border-slate-800 shrink-0">
        {/* Quick Add Buttons for all 5 Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline mr-1">Add:</span>

          {allCategories.map((cat) => {
            const cfg = STICKY_CATEGORIES[cat];
            const Icon = cfg.icon;

            return (
              <button
                key={cat}
                onClick={() => handleQuickAdd(cat)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all shadow-sm ${cfg.badgeBg} ${cfg.badgeText} hover:scale-105`}
              >
                <Icon className="w-3 h-3" />
                <span>+ {cfg.name}</span>
              </button>
            );
          })}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All ({notes.length})
          </button>
          {allCategories.map((cat) => {
            const cfg = STICKY_CATEGORIES[cat];
            const Icon = cfg.icon;
            const count = notes.filter((n) => n.category === cat).length;
            const isActive = activeFilter === cat;

            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors border ${
                  isActive
                    ? `${cfg.badgeBg} ${cfg.badgeText} font-bold`
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden md:inline">{cfg.name}</span>
                <span className="font-mono text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div
        ref={canvasBoardRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative flex-1 min-h-0 overflow-auto bg-[#070C16] p-4 select-none"
      >
        {/* Subtle Isometric/Dot Pattern Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Synchronizing Idea-to-Action Canvas...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-cyan-400 shadow-xl">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-300">Canvas is Ready for Collaboration</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              Add sticky notes to brainstorm ideas, capture questions, highlight challenges, record decisions, or schedule actionable tasks.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {allCategories.map((cat) => {
                const cfg = STICKY_CATEGORIES[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => handleQuickAdd(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${cfg.badgeBg} ${cfg.badgeText}`}
                  >
                    + Post {cfg.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : viewMode === 'canvas' ? (
          /* FREEFORM 2D CANVAS VIEW */
          <div className="relative min-w-[1020px] min-h-[680px] w-full h-full">
            {filteredNotes.map((note) => {
              const catKey = (note.category in STICKY_CATEGORIES ? note.category : 'idea') as CanvasNoteCategory;
              const cfg = STICKY_CATEGORIES[catKey];
              const Icon = cfg.icon;
              const hasVoted = (note.votedUserIds || []).includes(currentUser.id);
              const isDragging = draggedNoteId === note.id;
              const isEditing = editingNoteId === note.id;

              return (
                <div
                  key={note.id}
                  onMouseDown={(e) => handleMouseDown(e, note)}
                  style={{
                    position: 'absolute',
                    left: `${note.x}px`,
                    top: `${note.y}px`,
                    cursor: isDragging ? 'grabbing' : isEditing ? 'auto' : 'grab',
                  }}
                  className={`w-64 rounded-2xl p-4 bg-gradient-to-br ${cfg.bgGradient} border ${cfg.border} shadow-xl transition-all duration-150 z-10 ${
                    isDragging ? 'ring-2 ring-cyan-400 scale-105 z-30 shadow-2xl' : ''
                  }`}
                >
                  {/* Top Sticky Tape Accent */}
                  <div
                    className={`absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 rounded-sm ${cfg.tapeColor} backdrop-blur-sm border border-white/20 transform rotate-1 pointer-events-none`}
                  />

                  {/* Header: Category Badge & Actions */}
                  <div className="flex items-center justify-between mb-2 mt-0.5">
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeBg} ${cfg.badgeText}`}>
                      <Icon className="w-3 h-3" />
                      <span>{cfg.name}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTaskConvert(note);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-violet-300 hover:bg-black/30 transition-colors"
                        title="Convert to Actionable Task"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(note);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-black/30 transition-colors"
                        title="Edit Sticky Note"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWithUndo(note);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-black/30 transition-colors"
                        title="Delete Sticky Note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Body */}
                  {isEditing ? (
                    <div className="space-y-2 mb-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-2 py-1 bg-black/60 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                      <textarea
                        rows={2}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-2 py-1 bg-black/60 border border-slate-700 rounded-lg text-[11px] text-white focus:outline-none focus:border-cyan-400 resize-none"
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(note.id)}
                          className="px-2.5 py-0.5 rounded text-[10px] font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-xs font-bold text-white mb-1 leading-snug">{note.title}</h4>
                      {note.content && (
                        <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5 line-clamp-3">
                          {note.content}
                        </p>
                      )}
                    </>
                  )}

                  {/* Task Metadata (if converted) */}
                  {(note.status || note.assignee) && (
                    <div className="mb-2 p-1.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between text-[10px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCycleStatus(note);
                        }}
                        className={`px-1.5 py-0.5 rounded font-mono uppercase font-bold transition-colors ${
                          note.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : note.status === 'in_progress'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                        title="Click to toggle status"
                      >
                        {note.status ? note.status.replace('_', ' ') : 'pending'}
                      </button>

                      {note.assignee && (
                        <span className="text-slate-300 flex items-center gap-1 truncate max-w-[110px]">
                          <UserIcon className="w-2.5 h-2.5 text-cyan-400" />
                          <span className="truncate">{note.assignee}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Sticky Footer: Votes & Author */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVote(note.id);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all ${
                        hasVoted
                          ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 font-bold'
                          : 'bg-black/40 text-slate-400 hover:text-white border-white/10'
                      }`}
                      title="Upvote note"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span className="font-mono text-xs">{note.votes}</span>
                    </button>

                    <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                      By {note.createdByName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 5-COLUMN CATEGORIZED KANBAN VIEW */
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 min-w-[980px] h-full pb-4">
            {allCategories.map((cat) => {
              const cfg = STICKY_CATEGORIES[cat];
              const Icon = cfg.icon;
              const columnNotes = notes.filter((n) => n.category === cat);

              return (
                <div
                  key={cat}
                  className="flex flex-col rounded-2xl bg-[#111827]/70 border border-slate-800 p-3 h-full overflow-hidden shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={`p-1 rounded-md border ${cfg.badgeBg} ${cfg.badgeText}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{cfg.name}s</h4>
                    </div>
                    <button
                      onClick={() => handleQuickAdd(cat)}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title={`Add ${cfg.name}`}
                    >
                      +
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {columnNotes.map((note) => (
                      <div
                        key={note.id}
                        className={`rounded-xl p-3 bg-gradient-to-br ${cfg.bgGradient} border ${cfg.border} shadow-md`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h5 className="text-xs font-bold text-white leading-snug">{note.title}</h5>
                          <button
                            onClick={() => handleDeleteWithUndo(note)}
                            className="text-slate-400 hover:text-rose-400 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {note.content && (
                          <p className="text-[11px] text-slate-300 mb-2 line-clamp-3">
                            {note.content}
                          </p>
                        )}

                        {(note.status || note.assignee) && (
                          <div className="mb-2 p-1 rounded bg-black/40 border border-white/10 flex items-center justify-between text-[10px]">
                            <span className="font-mono text-cyan-300 text-[9px] uppercase font-bold">
                              {note.status || 'pending'}
                            </span>
                            {note.assignee && <span className="text-slate-300 truncate max-w-[80px]">{note.assignee}</span>}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10px]">
                          <button
                            onClick={() => toggleVote(note.id)}
                            className="flex items-center gap-1 text-cyan-300 font-mono font-bold"
                          >
                            <ThumbsUp className="w-2.5 h-2.5" />
                            <span>{note.votes}</span>
                          </button>
                          <button
                            onClick={() => handleOpenTaskConvert(note)}
                            className="text-violet-300 hover:underline flex items-center gap-0.5"
                          >
                            <span>Convert</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add New Sticky Note */}
      {isCreatingModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#111827] border border-cyan-500/40 rounded-2xl p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Create Sticky Note</span>
              </h3>
              <button
                onClick={() => setIsCreatingModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Category Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {allCategories.map((cat) => {
                    const cfg = STICKY_CATEGORIES[cat];
                    const Icon = cfg.icon;
                    const isSel = quickAddCategory === cat;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setQuickAddCategory(cat)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-bold transition-all ${
                          isSel
                            ? `${cfg.badgeBg} ${cfg.badgeText} border-current ring-1 ring-current`
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 mb-1" />
                        <span className="truncate w-full text-center">{cfg.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Note Headline <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={STICKY_CATEGORIES[quickAddCategory].placeholder}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Discussion Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Elaborate on details, context, or next steps..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assignee (Optional)
                </label>
                <input
                  type="text"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  placeholder="Assignee name (e.g. Alex Chen)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-md shadow-cyan-500/20"
                >
                  Post Sticky Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Convert Idea to Actionable Task */}
      {convertingNote && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0F172A] border border-violet-500/40 rounded-2xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-violet-400" />
                <span>Convert to Actionable Task</span>
              </h3>
              <button
                onClick={() => setConvertingNote(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <p className="text-xs font-bold text-white">{convertingNote.title}</p>
                {convertingNote.content && (
                  <p className="text-[11px] text-slate-400 mt-1">{convertingNote.content}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Task Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pending', 'in_progress', 'completed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTaskStatus(st)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        taskStatus === st
                          ? 'bg-violet-500/20 text-violet-300 border-violet-400 font-bold ring-1 ring-violet-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assign To</label>
                <select
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-400"
                >
                  <option value={currentUser.name}>{currentUser.name} (You)</option>
                  {participants
                    .filter((p) => p.userName !== currentUser.name)
                    .map((p) => (
                      <option key={p.userId} value={p.userName}>
                        {p.userName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConvertingNote(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmConvertTask}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-violet-400 hover:bg-violet-300 transition-colors shadow-md shadow-violet-500/20"
                >
                  Save as Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaCanvas;
