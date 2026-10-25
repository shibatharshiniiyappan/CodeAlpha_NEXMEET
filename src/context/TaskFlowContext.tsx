import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  TaskItem,
  ProjectItem,
  SpatialWorkspaceRoom,
  MeetingPulseSession,
  AIRecommendation,
  TaskStatus,
  TaskPriority,
  TaskFlowState,
} from '../types/taskflow';
import {
  fetchTaskFlowState,
  saveTaskFlowState,
  analyzeWorkloadWithAI,
  INITIAL_DEFAULT_STATE,
} from '../services/taskflowApi';
import { useAuth } from './AuthContext';

interface TaskFlowContextType {
  state: TaskFlowState;
  isLoading: boolean;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: TaskStatus | 'all';
  setStatusFilter: (s: TaskStatus | 'all') => void;
  priorityFilter: TaskPriority | 'all';
  setPriorityFilter: (p: TaskPriority | 'all') => void;

  // Task Operations
  createTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>) => TaskItem;
  updateTask: (id: string, updates: Partial<TaskItem>) => void;
  deleteTask: (id: string) => void;
  moveTaskStatus: (id: string, newStatus: TaskStatus) => void;
  convertIdeaToTask: (idea: {
    title: string;
    description: string;
    category?: string;
    priority?: TaskPriority;
    projectId?: string;
    roomId?: string;
    dueDate?: string;
    assigneeName?: string;
  }) => TaskItem;
  convertActionItemToTask: (actionItem: {
    text: string;
    meetingId: string;
    meetingTitle: string;
    projectId?: string;
    assigneeName?: string;
  }) => TaskItem;

  // Project Operations
  createProject: (project: Omit<ProjectItem, 'id'>) => ProjectItem;
  updateProject: (id: string, updates: Partial<ProjectItem>) => void;

  // Spatial Rooms Operations
  createRoom: (room: Omit<SpatialWorkspaceRoom, 'id' | 'createdAt'>) => SpatialWorkspaceRoom;
  updateRoom: (id: string, updates: Partial<SpatialWorkspaceRoom>) => void;

  // Meeting Pulse Operations
  saveMeetingSession: (meeting: MeetingPulseSession) => void;
  addMeetingReaction: (meetingId: string, emoji: string) => void;

  // AI Mission Control
  acceptRecommendation: (recId: string) => void;
  dismissRecommendation: (recId: string) => void;
  runAIAnalysis: () => Promise<void>;
  isAnalyzing: boolean;
  refreshState: () => Promise<void>;
}

const TaskFlowContext = createContext<TaskFlowContextType | undefined>(undefined);

export const TaskFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<TaskFlowState>(INITIAL_DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const refreshState = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await fetchTaskFlowState();
      setState(loaded);
    } catch (err) {
      console.error('[TaskFlow] Error refreshing state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load state on mount
  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Sync state helper
  const commitState = useCallback((updater: (prev: TaskFlowState) => TaskFlowState) => {
    setState((prev) => {
      const next = updater(prev);
      next.lastUpdated = new Date().toISOString();
      saveTaskFlowState(next);
      return next;
    });
  }, []);

  // --- Task Operations ---
  const createTask = useCallback(
    (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>): TaskItem => {
      const newTask: TaskItem = {
        ...taskData,
        id: `task-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      commitState((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
      }));

      return newTask;
    },
    [commitState]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<TaskItem>) => {
      commitState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)),
      }));
    },
    [commitState]
  );

  const deleteTask = useCallback(
    (id: string) => {
      commitState((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
      }));
      if (selectedTaskId === id) setSelectedTaskId(null);
    },
    [commitState, selectedTaskId]
  );

  const moveTaskStatus = useCallback(
    (id: string, newStatus: TaskStatus) => {
      commitState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t)),
      }));
    },
    [commitState]
  );

  const convertIdeaToTask = useCallback(
    (idea: {
      title: string;
      description: string;
      category?: string;
      priority?: TaskPriority;
      projectId?: string;
      roomId?: string;
      dueDate?: string;
      assigneeName?: string;
    }): TaskItem => {
      const targetProjectId = idea.projectId || state.projects[0]?.id || 'proj-nexus-core';
      const targetProject = state.projects.find((p) => p.id === targetProjectId) || state.projects[0];

      const newTask: TaskItem = {
        id: `task-idea-${Date.now().toString(36)}`,
        title: idea.title.trim(),
        description: idea.description.trim(),
        status: 'todo',
        priority: idea.priority || 'medium',
        projectId: targetProjectId,
        projectName: targetProject ? targetProject.name : 'General Project',
        roomId: idea.roomId,
        dueDate: idea.dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        assignee: idea.assigneeName
          ? {
              id: `usr-${idea.assigneeName.toLowerCase().replace(/\s+/g, '-')}`,
              name: idea.assigneeName,
              avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(idea.assigneeName)}`,
            }
          : user
          ? { id: user.id, name: user.name, avatar: user.avatar }
          : undefined,
        tags: [idea.category ? `idea:${idea.category}` : 'ideation', 'brainstorm'],
        dependencies: [],
        subtasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      commitState((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
      }));

      return newTask;
    },
    [commitState, state.projects, user]
  );

  const convertActionItemToTask = useCallback(
    (actionItem: {
      text: string;
      meetingId: string;
      meetingTitle: string;
      projectId?: string;
      assigneeName?: string;
    }): TaskItem => {
      const targetProjectId = actionItem.projectId || state.projects[0]?.id || 'proj-nexus-core';
      const targetProject = state.projects.find((p) => p.id === targetProjectId) || state.projects[0];

      const newTask: TaskItem = {
        id: `task-action-${Date.now().toString(36)}`,
        title: actionItem.text.trim(),
        description: `Action item generated from meeting: "${actionItem.meetingTitle}"`,
        status: 'todo',
        priority: 'high',
        projectId: targetProjectId,
        projectName: targetProject ? targetProject.name : 'General Project',
        meetingId: actionItem.meetingId,
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        assignee: actionItem.assigneeName
          ? {
              id: `usr-${actionItem.assigneeName.toLowerCase().replace(/\s+/g, '-')}`,
              name: actionItem.assigneeName,
              avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(actionItem.assigneeName)}`,
            }
          : undefined,
        tags: ['action-item', 'meeting-pulse'],
        dependencies: [],
        subtasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      commitState((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
        meetings: prev.meetings.map((m) =>
          m.id === actionItem.meetingId
            ? { ...m, actionItemTaskIds: [...(m.actionItemTaskIds || []), newTask.id] }
            : m
        ),
      }));

      return newTask;
    },
    [commitState, state.projects]
  );

  // --- Project Operations ---
  const createProject = useCallback(
    (projectData: Omit<ProjectItem, 'id'>): ProjectItem => {
      const newProj: ProjectItem = {
        ...projectData,
        id: `proj-${Date.now().toString(36)}`,
      };
      commitState((prev) => ({
        ...prev,
        projects: [...prev.projects, newProj],
      }));
      return newProj;
    },
    [commitState]
  );

  const updateProject = useCallback(
    (id: string, updates: Partial<ProjectItem>) => {
      commitState((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
    },
    [commitState]
  );

  // --- Spatial Rooms Operations ---
  const createRoom = useCallback(
    (roomData: Omit<SpatialWorkspaceRoom, 'id' | 'createdAt'>): SpatialWorkspaceRoom => {
      const newRoom: SpatialWorkspaceRoom = {
        ...roomData,
        id: `room-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
      };
      commitState((prev) => ({
        ...prev,
        rooms: [newRoom, ...prev.rooms],
      }));
      return newRoom;
    },
    [commitState]
  );

  const updateRoom = useCallback(
    (id: string, updates: Partial<SpatialWorkspaceRoom>) => {
      commitState((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      }));
    },
    [commitState]
  );

  // --- Meeting Pulse Operations ---
  const saveMeetingSession = useCallback(
    (meeting: MeetingPulseSession) => {
      commitState((prev) => {
        const exists = prev.meetings.some((m) => m.id === meeting.id);
        const meetings = exists ? prev.meetings.map((m) => (m.id === meeting.id ? meeting : m)) : [meeting, ...prev.meetings];
        return { ...prev, meetings };
      });
    },
    [commitState]
  );

  const addMeetingReaction = useCallback(
    (meetingId: string, emoji: string) => {
      commitState((prev) => ({
        ...prev,
        meetings: prev.meetings.map((m) => {
          if (m.id !== meetingId) return m;
          const reactions = [...(m.reactions || [])];
          const found = reactions.find((r) => r.emoji === emoji);
          if (found) {
            found.count++;
          } else {
            reactions.push({ emoji, count: 1 });
          }
          return { ...m, reactions };
        }),
      }));
    },
    [commitState]
  );

  // --- AI Mission Control ---
  const acceptRecommendation = useCallback(
    (recId: string) => {
      commitState((prev) => {
        const rec = prev.recommendations.find((r) => r.id === recId);
        if (!rec) return prev;

        let updatedTasks = [...prev.tasks];
        if (rec.targetTaskId) {
          updatedTasks = updatedTasks.map((t) => {
            if (t.id !== rec.targetTaskId) return t;
            const updates: Partial<TaskItem> = {};
            if (rec.suggestedAction.newPriority) updates.priority = rec.suggestedAction.newPriority;
            if (rec.suggestedAction.newDueDate) updates.dueDate = rec.suggestedAction.newDueDate;
            if (rec.suggestedAction.newSubtasks && rec.suggestedAction.newSubtasks.length > 0) {
              const extraSubs = rec.suggestedAction.newSubtasks.map((st) => ({
                id: `sub-ai-${Math.random().toString(36).substring(2, 7)}`,
                title: st,
                completed: false,
              }));
              updates.subtasks = [...t.subtasks, ...extraSubs];
            }
            return { ...t, ...updates, updatedAt: new Date().toISOString() };
          });
        }

        return {
          ...prev,
          tasks: updatedTasks,
          recommendations: prev.recommendations.map((r) => (r.id === recId ? { ...r, status: 'accepted' as const } : r)),
        };
      });
    },
    [commitState]
  );

  const dismissRecommendation = useCallback(
    (recId: string) => {
      commitState((prev) => ({
        ...prev,
        recommendations: prev.recommendations.map((r) => (r.id === recId ? { ...r, status: 'dismissed' as const } : r)),
      }));
    },
    [commitState]
  );

  const runAIAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeWorkloadWithAI(state.tasks);
      if (result.recommendations && result.recommendations.length > 0) {
        commitState((prev) => {
          // Merge recommendations avoiding duplicates
          const existingIds = new Set(prev.recommendations.map((r) => r.title));
          const newRecs = result.recommendations.filter((r) => !existingIds.has(r.title));
          return {
            ...prev,
            recommendations: [...newRecs, ...prev.recommendations],
          };
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [commitState, state.tasks]);

  return (
    <TaskFlowContext.Provider
      value={{
        state,
        isLoading,
        selectedTaskId,
        setSelectedTaskId,
        selectedProjectId,
        setSelectedProjectId,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        priorityFilter,
        setPriorityFilter,
        createTask,
        updateTask,
        deleteTask,
        moveTaskStatus,
        convertIdeaToTask,
        convertActionItemToTask,
        createProject,
        updateProject,
        createRoom,
        updateRoom,
        saveMeetingSession,
        addMeetingReaction,
        acceptRecommendation,
        dismissRecommendation,
        runAIAnalysis,
        isAnalyzing,
        refreshState,
      }}
    >
      {children}
    </TaskFlowContext.Provider>
  );
};

export const useTaskFlow = () => {
  const context = useContext(TaskFlowContext);
  if (!context) {
    throw new Error('useTaskFlow must be used within a TaskFlowProvider');
  }
  return context;
};
