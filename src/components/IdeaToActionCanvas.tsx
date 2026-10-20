import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import {
  Lightbulb,
  HelpCircle,
  AlertTriangle,
  Target,
  CheckSquare,
  Plus,
  Trash2,
  ThumbsUp,
  Download,
  Copy,
  Check,
  X,
  Maximize2,
  Minimize2,
  Filter,
  Columns,
  Grid,
  Layers,
  ArrowRight,
  User,
  Sparkles,
} from 'lucide-react';
import { CanvasNote, CanvasNoteCategory, RoomPeer, User as AuthUser } from '../types';

interface IdeaToActionCanvasProps {
  roomId: string;
  socket: Socket | null;
  currentUser: AuthUser | { id: string; name: string; avatar: string };
  participants: RoomPeer[];
  isOpen: boolean;
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const CATEGORY_CONFIG: Record<
  CanvasNoteCategory,
  {
    name: string;
    icon: React.ElementType;
    badgeBg: string;
    badgeText: string;
    noteBorder: string;
    noteGlow: string;
    headerBg: string;
  }
> = {
  idea: {
    name: 'Ideas',
    icon: Lightbulb,
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    badgeText: 'text-amber-400',
    noteBorder: 'border-amber-500/40 hover:border-amber-400',
    noteGlow: 'shadow-amber-500/10',
    headerBg: 'from-amber-500/20 to-transparent',
  },
  question: {
    name: 'Questions',
    icon: HelpCircle,
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30',
    badgeText: 'text-cyan-400',
    noteBorder: 'border-cyan-500/40 hover:border-cyan-400',
    noteGlow: 'shadow-cyan-500/10',
    headerBg: 'from-cyan-500/20 to-transparent',
  },
  challenge: {
    name: 'Challenges',
    icon: AlertTriangle,
    badgeBg: 'bg-rose-500/10 border-rose-500/30',
    badgeText: 'text-rose-400',
    noteBorder: 'border-rose-500/40 hover:border-rose-400',
    noteGlow: 'shadow-rose-500/10',
    headerBg: 'from-rose-500/20 to-transparent',
  },
  decision: {
    name: 'Decisions',
    icon: Target,
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    badgeText: 'text-emerald-400',
    noteBorder: 'border-emerald-500/40 hover:border-emerald-400',
    noteGlow: 'shadow-emerald-500/10',
    headerBg: 'from-emerald-500/20 to-transparent',
  },
  action: {
    name: 'Action Items',
    icon: CheckSquare,
    badgeBg: 'bg-violet-500/10 border-violet-500/30',
    badgeText: 'text-violet-400',
    noteBorder: 'border-violet-500/40 hover:border-violet-400',
    noteGlow: 'shadow-violet-500/10',
    headerBg: 'from-violet-500/20 to-transparent',
  },
};

export const IdeaToActionCanvas: React.FC<IdeaToActionCanvasProps> = ({
  roomId,
  socket,
  currentUser,
  participants,
  isOpen,
  onClose,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [notes, setNotes] = useState<CanvasNote[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'board' | 'columns'>('board');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // New Note Modal / Input state
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newCategory, setNewCategory] = useState<CanvasNoteCategory>('idea');
  const [newAssignee, setNewAssignee] = useState<string>('');

  // Dragging state
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    const handleInit = (initialNotes: CanvasNote[]) => {
      setNotes(initialNotes);
    };

    const handleAdded = (note: CanvasNote) => {
      setNotes((prev) => [...prev.filter((n) => n.id !== note.id), note]);
    };

    const handleUpdated = (note: CanvasNote) => {
      setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
    };

    const handleMoved = ({ id, x, y }: { id: string; x: number; y: number }) => {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    };

    const handleDeleted = ({ id }: { id: string }) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    };

    const handleCleared = () => {
      setNotes([]);
    };

    socket.on('canvas:init', handleInit);
    socket.on('canvas:note-added', handleAdded);
    socket.on('canvas:note-updated', handleUpdated);
    socket.on('canvas:note-moved', handleMoved);
    socket.on('canvas:note-deleted', handleDeleted);
    socket.on('canvas:cleared', handleCleared);

    return () => {
      socket.off('canvas:init', handleInit);
      socket.off('canvas:note-added', handleAdded);
      socket.off('canvas:note-updated', handleUpdated);
      socket.off('canvas:note-moved', handleMoved);
      socket.off('canvas:note-deleted', handleDeleted);
      socket.off('canvas:cleared', handleCleared);
    };
  }, [socket]);

  if (!isOpen) return null;

  // Add Note Handler
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Default position with staggered layout
    const count = notes.length;
    const initialX = 40 + ((count * 30) % 400);
    const initialY = 40 + ((count * 35) % 300);

    const note: CanvasNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      x: initialX,
      y: initialY,
      votes: 0,
      votedUserIds: [],
      assignee: newCategory === 'action' ? newAssignee || currentUser.name : undefined,
      status: newCategory === 'action' ? 'pending' : undefined,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: Date.now(),
    };

    setNotes((prev) => [...prev, note]);
    if (socket) {
      socket.emit('canvas:add-note', note);
    }

    setNewTitle('');
    setNewContent('');
    setNewAssignee('');
    setIsCreating(false);
  };

  // Vote Handler
  const handleVote = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const voted = (note.votedUserIds || []).includes(currentUser.id);
    const updatedVotedIds = voted
      ? note.votedUserIds.filter((id) => id !== currentUser.id)
      : [...(note.votedUserIds || []), currentUser.id];
    const updatedVotes = voted ? Math.max(0, note.votes - 1) : note.votes + 1;

    const updatedNote = {
      ...note,
      votes: updatedVotes,
      votedUserIds: updatedVotedIds,
    };

    setNotes((prev) => prev.map((n) => (n.id === noteId ? updatedNote : n)));
    if (socket) {
      socket.emit('canvas:vote-note', { id: noteId, userId: currentUser.id });
    }
  };

  // Convert Note to Action Item
  const handleConvertToAction = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const updatedNote: CanvasNote = {
      ...note,
      category: 'action',
      status: 'pending',
      assignee: note.assignee || currentUser.name,
    };

    setNotes((prev) => prev.map((n) => (n.id === noteId ? updatedNote : n)));
    if (socket) {
      socket.emit('canvas:update-note', updatedNote);
    }
  };

  // Toggle Action Status
  const handleToggleStatus = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note || note.category !== 'action') return;

    const nextStatus: 'pending' | 'in_progress' | 'completed' =
      note.status === 'completed'
        ? 'pending'
        : note.status === 'pending'
        ? 'in_progress'
        : 'completed';

    const updatedNote: CanvasNote = { ...note, status: nextStatus };
    setNotes((prev) => prev.map((n) => (n.id === noteId ? updatedNote : n)));
    if (socket) {
      socket.emit('canvas:update-note', updatedNote);
    }
  };

  // Delete Note
  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (socket) {
      socket.emit('canvas:delete-note', { id: noteId });
    }
  };

  // Dragging start
  const handleMouseDown = (e: React.MouseEvent, note: CanvasNote) => {
    if (viewMode === 'columns') return;
    setDraggedNoteId(note.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNoteId || !canvasRef.current || viewMode === 'columns') return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(10, Math.min(canvasRect.width - 240, e.clientX - canvasRect.left - dragOffset.x));
    const newY = Math.max(10, Math.min(canvasRect.height - 220, e.clientY - canvasRect.top - dragOffset.y));

    setNotes((prev) =>
      prev.map((n) => (n.id === draggedNoteId ? { ...n, x: newX, y: newY } : n))
    );
  };

  const handleMouseUp = () => {
    if (draggedNoteId && socket && viewMode === 'board') {
      const moved = notes.find((n) => n.id === draggedNoteId);
      if (moved) {
        socket.emit('canvas:move-note', { id: moved.id, x: moved.x, y: moved.y });
      }
    }
    setDraggedNoteId(null);
  };

  // Export to Markdown
  const handleExportMarkdown = () => {
    let md = `# NEXMEET Idea-to-Action Canvas\nRoom: ${roomId}\nExported: ${new Date().toLocaleString()}\n\n`;

    const categories: CanvasNoteCategory[] = ['idea', 'question', 'challenge', 'decision', 'action'];
    categories.forEach((cat) => {
      const catNotes = notes.filter((n) => n.category === cat);
      if (catNotes.length > 0) {
        md += `## ${CATEGORY_CONFIG[cat].name} (${catNotes.length})\n`;
        catNotes.forEach((n) => {
          if (cat === 'action') {
            const check = n.status === 'completed' ? '[x]' : '[ ]';
            md += `- ${check} **${n.title}** (${n.status?.toUpperCase()}) — Assigned to: ${n.assignee || 'Unassigned'}\n`;
            if (n.content) md += `  - ${n.content}\n`;
          } else {
            md += `- **${n.title}** (+${n.votes} votes by ${n.createdByName})\n`;
            if (n.content) md += `  - ${n.content}\n`;
          }
        });
        md += '\n';
      }
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas-export-${roomId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    let md = `# NEXMEET Idea-to-Action Canvas (${roomId})\n\n`;
    notes.forEach((n) => {
      md += `[${n.category.toUpperCase()}] ${n.title} (${n.assignee ? `Assignee: ${n.assignee}` : `Votes: ${n.votes}`})\n`;
      if (n.content) md += `Details: ${n.content}\n`;
    });
    navigator.clipboard.writeText(md);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const filteredNotes = activeCategoryFilter === 'all'
    ? notes
    : notes.filter((n) => n.category === activeCategoryFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative flex flex-col bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isExpanded ? 'w-[98vw] h-[95vh]' : 'w-full max-w-5xl h-[85vh]'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#111827] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-violet-600/30 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Idea-to-Action Canvas</span>
                <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Live Sync ({notes.length} items)
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Brainstorm, vote, prioritize, and transform team discussions into assigned tasks.
              </p>
            </div>
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'board'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Freeform Spatial Board"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Canvas</span>
              </button>
              <button
                onClick={() => setViewMode('columns')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'columns'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Structured Columns by Category"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Columns</span>
              </button>
            </div>

            {/* Export Markdown */}
            <button
              onClick={handleExportMarkdown}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Download Markdown Report"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export</span>
            </button>

            {/* Copy Markdown */}
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Copy Summary to Clipboard"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{isCopied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Expand / Minimize */}
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title={isExpanded ? 'Normal Size' : 'Expand View'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-header Filter & Quick Add Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 shrink-0">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeCategoryFilter === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              All ({notes.length})
            </button>
            {(Object.keys(CATEGORY_CONFIG) as CanvasNoteCategory[]).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const Icon = cfg.icon;
              const count = notes.filter((n) => n.category === cat).length;
              const isActive = activeCategoryFilter === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                    isActive
                      ? `${cfg.badgeBg} ${cfg.badgeText} border-current font-bold`
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cfg.name}</span>
                  <span className="opacity-70 font-mono text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Add Item Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sticky Note</span>
          </button>
        </div>

        {/* Canvas Body Area */}
        <div
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="relative flex-1 min-h-0 overflow-auto bg-[#0A0F1D] p-4 select-none"
        >
          {/* Subtle Dot Grid Background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* VIEW MODE: BOARD (Free Positioning) */}
          {viewMode === 'board' ? (
            <div className="relative min-w-[900px] min-h-[600px] w-full h-full">
              {filteredNotes.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-cyan-400">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-300">No Canvas Notes Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Click "Add Sticky Note" to capture brainstorm ideas, raise challenges, record key decisions, or assign action items.
                  </p>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const cfg = CATEGORY_CONFIG[note.category];
                  const Icon = cfg.icon;
                  const hasVoted = (note.votedUserIds || []).includes(currentUser.id);

                  return (
                    <div
                      key={note.id}
                      onMouseDown={(e) => handleMouseDown(e, note)}
                      style={{
                        position: 'absolute',
                        left: `${note.x}px`,
                        top: `${note.y}px`,
                        cursor: draggedNoteId === note.id ? 'grabbing' : 'grab',
                      }}
                      className={`w-64 rounded-xl p-4 bg-[#111827] border ${cfg.noteBorder} shadow-lg transition-shadow duration-200 z-10 ${
                        draggedNoteId === note.id ? 'ring-2 ring-cyan-400 z-30 scale-105' : ''
                      }`}
                    >
                      {/* Top Bar */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeBg} ${cfg.badgeText}`}>
                          <Icon className="w-3 h-3" />
                          <span>{cfg.name}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete note"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Body */}
                      <h4 className="text-xs font-bold text-white mb-1 leading-snug">{note.title}</h4>
                      {note.content && (
                        <p className="text-[11px] text-slate-300 leading-relaxed mb-3 font-normal line-clamp-4">
                          {note.content}
                        </p>
                      )}

                      {/* Action Item specific status & assignee */}
                      {note.category === 'action' ? (
                        <div className="pt-2 border-t border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(note.id);
                              }}
                              className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded cursor-pointer ${
                                note.status === 'completed'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                  : note.status === 'in_progress'
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              <CheckSquare className="w-3 h-3" />
                              <span>{note.status ? note.status.replace('_', ' ') : 'pending'}</span>
                            </button>

                            <span className="text-slate-400 text-[10px] truncate max-w-[100px] flex items-center gap-1">
                              <User className="w-2.5 h-2.5" />
                              {note.assignee || 'Unassigned'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Non-action item footer (Votes & Convert button) */
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVote(note.id);
                            }}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-colors ${
                              hasVoted
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold'
                                : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700'
                            }`}
                            title="Upvote idea"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span className="font-mono">{note.votes}</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConvertToAction(note.id);
                            }}
                            className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 font-semibold transition-colors"
                            title="Turn into Action Item"
                          >
                            <span>To Action</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* VIEW MODE: COLUMNS (Kanban by Category) */
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 min-w-[1000px] h-full pb-4">
              {(Object.keys(CATEGORY_CONFIG) as CanvasNoteCategory[]).map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const Icon = cfg.icon;
                const columnNotes = notes.filter((n) => n.category === cat);

                return (
                  <div
                    key={cat}
                    className="flex flex-col rounded-xl bg-[#111827]/70 border border-slate-800 p-3 h-full overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-4 h-4 ${cfg.badgeText}`} />
                        <h4 className="text-xs font-bold text-white">{cfg.name}</h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {columnNotes.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                      {columnNotes.map((note) => (
                        <div
                          key={note.id}
                          className={`rounded-xl p-3 bg-[#162032] border ${cfg.noteBorder} shadow-sm`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h5 className="text-xs font-bold text-white leading-tight">{note.title}</h5>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-slate-500 hover:text-rose-400 p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {note.content && (
                            <p className="text-[11px] text-slate-300 line-clamp-3 mb-2">{note.content}</p>
                          )}

                          {cat === 'action' ? (
                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-700/60">
                              <button
                                onClick={() => handleToggleStatus(note.id)}
                                className="font-semibold text-cyan-400 cursor-pointer"
                              >
                                {note.status?.toUpperCase()}
                              </button>
                              <span className="text-slate-400 truncate max-w-[80px]">
                                {note.assignee || 'Unassigned'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-700/60">
                              <button
                                onClick={() => handleVote(note.id)}
                                className="flex items-center gap-1 text-cyan-400 font-mono"
                              >
                                <ThumbsUp className="w-2.5 h-2.5" />
                                <span>{note.votes}</span>
                              </button>
                              <button
                                onClick={() => handleConvertToAction(note.id)}
                                className="text-violet-400 font-semibold"
                              >
                                → Action
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Create New Sticky Note */}
        {isCreating && (
          <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-[#111827] border border-cyan-500/40 rounded-2xl p-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>Create Canvas Note</span>
                </h3>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddNote} className="space-y-4">
                {/* Category Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Note Category</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {(Object.keys(CATEGORY_CONFIG) as CanvasNoteCategory[]).map((cat) => {
                      const cfg = CATEGORY_CONFIG[cat];
                      const Icon = cfg.icon;
                      const isSel = newCategory === cat;

                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewCategory(cat)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-semibold transition-all ${
                            isSel
                              ? `${cfg.badgeBg} ${cfg.badgeText} border-current ring-1 ring-current`
                              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4 mb-1" />
                          <span className="truncate">{cfg.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Title / Key Point <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Implement adaptive bitrate streaming"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Details / Content */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Details / Discussion Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Elaborate on the idea, rationale, or steps..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                  />
                </div>

                {/* Assignee if Action Item */}
                {newCategory === 'action' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Assignee
                    </label>
                    <select
                      value={newAssignee}
                      onChange={(e) => setNewAssignee(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value={currentUser.name}>Assign to Me ({currentUser.name})</option>
                      {participants
                        .filter((p) => p.userName !== currentUser.name)
                        .map((p) => (
                          <option key={p.socketId} value={p.userName}>
                            {p.userName}
                          </option>
                        ))}
                      <option value="All Attendees">Entire Team</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-md shadow-cyan-500/20"
                  >
                    Post to Canvas
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
