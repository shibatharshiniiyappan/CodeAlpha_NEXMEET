import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { CanvasNote, CanvasNoteCategory, User } from '../types';

export interface UseIdeaCanvasOptions {
  roomId: string;
  socket: Socket | null;
  currentUser: User | { id: string; name: string; avatar?: string };
}

export interface UseIdeaCanvasReturn {
  notes: CanvasNote[];
  isLoading: boolean;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  filteredNotes: CanvasNote[];
  addNote: (params: {
    category: CanvasNoteCategory;
    title: string;
    content?: string;
    x?: number;
    y?: number;
    assignee?: string;
  }) => CanvasNote;
  updateNote: (id: string, updates: Partial<CanvasNote>) => void;
  moveNote: (id: string, x: number, y: number) => void;
  deleteNote: (id: string) => void;
  toggleVote: (id: string) => void;
  clearNotes: () => void;
}

export function useIdeaCanvas({
  roomId,
  socket,
  currentUser,
}: UseIdeaCanvasOptions): UseIdeaCanvasReturn {
  const [notes, setNotes] = useState<CanvasNote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Keep a ref of notes for event handlers to avoid stale closures
  const notesRef = useRef<CanvasNote[]>([]);
  notesRef.current = notes;

  // Socket.IO event synchronization layer
  useEffect(() => {
    if (!socket || !roomId) return;

    let isMounted = true;

    // 1. Initial load from server
    const handleInit = (initialNotes: CanvasNote[]) => {
      if (!isMounted) return;
      setNotes(initialNotes || []);
      setIsLoading(false);
    };

    // 2. Note added by any participant
    const handleNoteAdded = (newNote: CanvasNote) => {
      setNotes((prev) => {
        if (prev.some((n) => n.id === newNote.id)) return prev;
        return [...prev, newNote];
      });
    };

    // 3. Note updated (text, title, status, votes)
    const handleNoteUpdated = (updatedNote: CanvasNote) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === updatedNote.id ? { ...n, ...updatedNote } : n))
      );
    };

    // 4. Note repositioned on canvas
    const handleNoteMoved = ({ id, x, y }: { id: string; x: number; y: number }) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, x, y } : n))
      );
    };

    // 5. Note deleted
    const handleNoteDeleted = ({ id }: { id: string }) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    };

    // 6. Canvas cleared
    const handleCanvasCleared = () => {
      setNotes([]);
    };

    // Listen to standard and alias events
    socket.on('canvas:init', handleInit);
    socket.on('canvas:note-added', handleNoteAdded);
    socket.on('canvas:note-updated', handleNoteUpdated);
    socket.on('canvas:note-moved', handleNoteMoved);
    socket.on('canvas:note-deleted', handleNoteDeleted);
    socket.on('canvas:cleared', handleCanvasCleared);

    socket.on('idea-canvas:init', handleInit);
    socket.on('idea-canvas:note-added', handleNoteAdded);
    socket.on('idea-canvas:note-updated', handleNoteUpdated);
    socket.on('idea-canvas:note-moved', handleNoteMoved);
    socket.on('idea-canvas:note-deleted', handleNoteDeleted);

    // If socket is already connected, fetch current canvas notes
    fetch(`/api/meetings/${encodeURIComponent(roomId)}/canvas-notes`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && Array.isArray(data.notes)) {
          setNotes((prev) => (prev.length > 0 ? prev : data.notes));
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      socket.off('canvas:init', handleInit);
      socket.off('canvas:note-added', handleNoteAdded);
      socket.off('canvas:note-updated', handleNoteUpdated);
      socket.off('canvas:note-moved', handleNoteMoved);
      socket.off('canvas:note-deleted', handleNoteDeleted);
      socket.off('canvas:cleared', handleCanvasCleared);

      socket.off('idea-canvas:init', handleInit);
      socket.off('idea-canvas:note-added', handleNoteAdded);
      socket.off('idea-canvas:note-updated', handleNoteUpdated);
      socket.off('idea-canvas:note-moved', handleNoteMoved);
      socket.off('idea-canvas:note-deleted', handleNoteDeleted);
    };
  }, [socket, roomId]);

  // Action: Add Note
  const addNote = useCallback(
    ({
      category,
      title,
      content = '',
      x,
      y,
      assignee,
    }: {
      category: CanvasNoteCategory;
      title: string;
      content?: string;
      x?: number;
      y?: number;
      assignee?: string;
    }) => {
      const count = notesRef.current.length;
      const initialX = x !== undefined ? x : 40 + ((count * 45) % 460);
      const initialY = y !== undefined ? y : 40 + ((count * 40) % 320);

      const newNote: CanvasNote = {
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        category,
        title: title.trim(),
        content: content.trim(),
        x: initialX,
        y: initialY,
        votes: 0,
        votedUserIds: [],
        assignee: assignee || (category === 'action' ? currentUser.name : undefined),
        status: category === 'action' ? 'pending' : undefined,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        createdAt: Date.now(),
      };

      // Optimistic state update
      setNotes((prev) => [...prev, newNote]);

      // Emit across Socket.IO
      if (socket) {
        socket.emit('canvas:add-note', newNote);
        socket.emit('idea-canvas:add-note', newNote);
      }

      return newNote;
    },
    [socket, currentUser]
  );

  // Action: Update Note
  const updateNote = useCallback(
    (id: string, updates: Partial<CanvasNote>) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
      );

      const existing = notesRef.current.find((n) => n.id === id);
      if (existing && socket) {
        const updated = { ...existing, ...updates };
        socket.emit('canvas:update-note', updated);
        socket.emit('idea-canvas:update-note', updated);
      }
    },
    [socket]
  );

  // Action: Move Note
  const moveNote = useCallback(
    (id: string, x: number, y: number) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, x, y } : n))
      );

      if (socket) {
        socket.emit('canvas:move-note', { id, x, y });
        socket.emit('idea-canvas:move-note', { id, x, y });
      }
    },
    [socket]
  );

  // Action: Delete Note
  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));

      if (socket) {
        socket.emit('canvas:delete-note', { id });
        socket.emit('idea-canvas:delete-note', { id });
      }
    },
    [socket]
  );

  // Action: Toggle Upvote (+1 / -1)
  const toggleVote = useCallback(
    (id: string) => {
      const note = notesRef.current.find((n) => n.id === id);
      if (!note) return;

      const hasVoted = (note.votedUserIds || []).includes(currentUser.id);
      const updatedVotedIds = hasVoted
        ? note.votedUserIds.filter((uid) => uid !== currentUser.id)
        : [...(note.votedUserIds || []), currentUser.id];
      const updatedVotes = hasVoted ? Math.max(0, note.votes - 1) : note.votes + 1;

      const updatedNote: CanvasNote = {
        ...note,
        votes: updatedVotes,
        votedUserIds: updatedVotedIds,
      };

      setNotes((prev) => prev.map((n) => (n.id === id ? updatedNote : n)));

      if (socket) {
        socket.emit('canvas:vote-note', { id, userId: currentUser.id });
        socket.emit('idea-canvas:vote-note', { id, userId: currentUser.id });
      }
    },
    [socket, currentUser.id]
  );

  // Action: Clear Canvas
  const clearNotes = useCallback(() => {
    setNotes([]);
    if (socket) {
      socket.emit('canvas:clear');
      socket.emit('idea-canvas:clear');
    }
  }, [socket]);

  // Filtered Notes
  const filteredNotes =
    activeFilter === 'all'
      ? notes
      : notes.filter((n) => n.category === activeFilter);

  return {
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
    clearNotes,
  };
}
