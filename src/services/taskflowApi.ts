import {
  TaskFlowState,
  TaskItem,
  ProjectItem,
  SpatialWorkspaceRoom,
  MeetingPulseSession,
  AIRecommendation,
} from '../types/taskflow';
import { BASE_URL } from './api';

const STORAGE_KEY = 'codealpha_taskflow_state_v1';

export const INITIAL_DEFAULT_STATE: TaskFlowState = {
  projects: [
    {
      id: 'proj-nexus-core',
      name: 'Nexus Core 2.0',
      description: 'Distributed real-time communication mesh and spatial presence engine.',
      color: '#06b6d4', // cyan-500
      icon: 'Layers',
      status: 'active',
      leadName: 'Alex Chen',
      targetDate: '2026-11-15',
      category: 'Core Infrastructure',
    },
    {
      id: 'proj-cyber-security',
      name: 'Zero-Trust DTLS Shield',
      description: 'End-to-end media encryption, ephemeral key exchanges, and access controls.',
      color: '#8b5cf6', // violet-500
      icon: 'Shield',
      status: 'active',
      leadName: 'Security Lead',
      targetDate: '2026-10-31',
      category: 'Security & Compliance',
    },
    {
      id: 'proj-creative-canvas',
      name: 'Spatial Collaboration Canvas',
      description: 'Interactive 2.5D visual ideation cards, real-time node linking, and task converter.',
      color: '#f59e0b', // amber-500
      icon: 'Sparkles',
      status: 'active',
      leadName: 'Elena Rostova',
      targetDate: '2026-12-01',
      category: 'Product Experience',
    },
  ],
  tasks: [
    {
      id: 'task-101',
      title: 'Architect 2.5D Spatial Perspective Canvas',
      description: 'Design isometric grid depth math, smooth camera transitions, and dynamic card scaling.',
      status: 'in_progress',
      priority: 'high',
      projectId: 'proj-creative-canvas',
      projectName: 'Spatial Collaboration Canvas',
      roomId: 'room-innovation-lab',
      assignee: {
        id: 'usr-alex-chen',
        name: 'Alex Chen',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex',
      },
      dueDate: '2026-10-25',
      estimatedHours: 12,
      tags: ['Frontend', 'Spatial', 'UX'],
      dependencies: [],
      subtasks: [
        { id: 'sub-1', title: 'Implement CSS transform3d perspective stage', completed: true },
        { id: 'sub-2', title: 'Bind card coordinate zoom & drag handles', completed: true },
        { id: 'sub-3', title: 'Connect visual connector arrows between dependent notes', completed: false },
      ],
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-102',
      title: 'Audit DTLS-SRTP Media Handshake Telemetry',
      description: 'Verify packet loss, round-trip time, and cipher suite verification in network modal.',
      status: 'in_progress',
      priority: 'urgent',
      projectId: 'proj-cyber-security',
      projectName: 'Zero-Trust DTLS Shield',
      assignee: {
        id: 'usr-security-lead',
        name: 'Security Lead',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Security',
      },
      dueDate: '2026-10-23',
      estimatedHours: 8,
      tags: ['Security', 'WebRTC', 'Backend'],
      dependencies: [],
      subtasks: [
        { id: 'sub-4', title: 'Verify TLS 1.3 certificate rotation', completed: true },
        { id: 'sub-5', title: 'Record ICE candidate pool jitter bounds', completed: false },
      ],
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-103',
      title: 'Implement Meeting Pulse Speaking Time Tracker',
      description: 'Capture live participant audio volume levels and calculate speaking distribution without audio recording.',
      status: 'todo',
      priority: 'medium',
      projectId: 'proj-nexus-core',
      projectName: 'Nexus Core 2.0',
      roomId: 'room-war-room',
      assignee: {
        id: 'usr-marcus-vance',
        name: 'Marcus Vance',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Marcus',
      },
      dueDate: '2026-10-28',
      estimatedHours: 14,
      tags: ['Meeting Pulse', 'Analytics'],
      dependencies: ['task-101'],
      subtasks: [
        { id: 'sub-6', title: 'AudioContext AnalyserNode integration', completed: false },
        { id: 'sub-7', title: 'Emit speaking event throttle over socket', completed: false },
      ],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-104',
      title: 'Build AI Mission Control Workload Prober',
      description: 'Analyze active task deadlines and workload balancing to generate automated proactive advice.',
      status: 'review',
      priority: 'high',
      projectId: 'proj-nexus-core',
      projectName: 'Nexus Core 2.0',
      assignee: {
        id: 'usr-alex-chen',
        name: 'Alex Chen',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex',
      },
      dueDate: '2026-10-24',
      estimatedHours: 10,
      tags: ['AI', 'Productivity', 'Gemini'],
      dependencies: [],
      subtasks: [
        { id: 'sub-8', title: 'Define risk scoring heuristics', completed: true },
        { id: 'sub-9', title: 'Wire server-side Gemini 3.8 Flash endpoint', completed: true },
      ],
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-105',
      title: 'Deploy Production Vercel & Express Health Routing',
      description: 'Ensure same-origin API proxy, trust proxy headers, and static bundle delivery are verified.',
      status: 'completed',
      priority: 'medium',
      projectId: 'proj-nexus-core',
      projectName: 'Nexus Core 2.0',
      assignee: {
        id: 'usr-devops-guru',
        name: 'DevOps Lead',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DevOps',
      },
      dueDate: '2026-10-22',
      estimatedHours: 6,
      tags: ['Deployment', 'Vercel', 'Render'],
      dependencies: [],
      subtasks: [
        { id: 'sub-10', title: 'Add express trust proxy configuration', completed: true },
        { id: 'sub-11', title: 'Pass all 12 automated auth & routing checks', completed: true },
      ],
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  rooms: [
    {
      id: 'room-brainstorming',
      type: 'brainstorming',
      name: 'Cyber Brainstorming Lab',
      tagline: 'High-frequency ideation and visual thought mapping',
      description: 'Equipped with holographic 2.5D nodes, color-coded concept cards, and instant task conversion.',
      accentColor: '#06b6d4',
      icon: 'Lightbulb',
      associatedProjectIds: ['proj-creative-canvas', 'proj-nexus-core'],
      members: [
        { id: 'usr-alex-chen', name: 'Alex Chen', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex', role: 'Architect' },
        { id: 'usr-elena', name: 'Elena Rostova', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Elena', role: 'Design Lead' },
      ],
      activeTaskIds: ['task-101'],
      ambientSoundName: 'Cyber Ambient Synth',
      createdAt: '2026-10-20T10:00:00.000Z',
    },
    {
      id: 'room-war-room',
      type: 'war_room',
      name: 'Project War Room',
      tagline: 'Critical blockers, live countdowns, and sprint triage',
      description: 'High-alert tactical dashboard with live telemetry, urgent blocker flags, and quick escalations.',
      accentColor: '#f43f5e',
      icon: 'AlertTriangle',
      associatedProjectIds: ['proj-cyber-security'],
      members: [
        { id: 'usr-security-lead', name: 'Security Lead', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Security', role: 'Commander' },
        { id: 'usr-marcus-vance', name: 'Marcus Vance', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Marcus', role: 'Engineer' },
      ],
      activeTaskIds: ['task-102'],
      ambientSoundName: 'Deep Focus Radar',
      createdAt: '2026-10-20T11:00:00.000Z',
    },
    {
      id: 'room-collaboration',
      type: 'collaboration',
      name: 'Team Collaboration Hub',
      tagline: 'Cross-functional syncing and collective workflows',
      description: 'Open digital studio supporting live synchronized whiteboards, notes, and task allocation.',
      accentColor: '#10b981',
      icon: 'Users',
      associatedProjectIds: ['proj-nexus-core', 'proj-creative-canvas'],
      members: [
        { id: 'usr-alex-chen', name: 'Alex Chen', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex', role: 'Host' },
        { id: 'usr-marcus-vance', name: 'Marcus Vance', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Marcus', role: 'Member' },
      ],
      activeTaskIds: ['task-103'],
      ambientSoundName: 'Studio Flow Ambient',
      createdAt: '2026-10-20T12:00:00.000Z',
    },
    {
      id: 'room-focus',
      type: 'focus',
      name: 'Deep Focus Retreat',
      tagline: 'Distraction-free deep work and technical problem solving',
      description: 'Minimalist sapphire lighting, Pomodoro flow timers, and zero-notification quiet space.',
      accentColor: '#3b82f6',
      icon: 'Zap',
      associatedProjectIds: ['proj-nexus-core'],
      members: [
        { id: 'usr-alex-chen', name: 'Alex Chen', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex', role: 'Solo Deep Work' },
      ],
      activeTaskIds: ['task-104'],
      ambientSoundName: 'Binaural Alpha Waves',
      createdAt: '2026-10-20T13:00:00.000Z',
    },
    {
      id: 'room-planning-review',
      type: 'planning_review',
      name: 'Planning & Review Chamber',
      tagline: 'Quarterly roadmaps, milestones, and release retrospectives',
      description: 'Strategic layout for velocity estimation, milestone timeline reviews, and executive decisions.',
      accentColor: '#a855f7',
      icon: 'Calendar',
      associatedProjectIds: ['proj-nexus-core', 'proj-cyber-security', 'proj-creative-canvas'],
      members: [
        { id: 'usr-alex-chen', name: 'Alex Chen', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex', role: 'Lead' },
        { id: 'usr-devops-guru', name: 'DevOps Lead', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DevOps', role: 'Reviewer' },
      ],
      activeTaskIds: ['task-105'],
      ambientSoundName: 'Calm Executive Tone',
      createdAt: '2026-10-20T14:00:00.000Z',
    },
  ],
  meetings: [
    {
      id: 'meeting-sync-849',
      title: 'NEXMEET Architecture & Spatial Roadmap Review',
      agenda: [
        { id: 'ag-1', text: 'Review 2.5D spatial room perspective matrix', completed: true },
        { id: 'ag-2', text: 'Validate idea-to-action task conversion pipeline', completed: true },
        { id: 'ag-3', text: 'Demo Meeting Pulse speaking distribution tracker', completed: false },
      ],
      projectId: 'proj-nexus-core',
      projectName: 'Nexus Core 2.0',
      roomId: 'room-planning-review',
      startTime: new Date(Date.now() - 3600000 * 2).toISOString(),
      endTime: new Date(Date.now() - 3600000 * 1).toISOString(),
      durationSeconds: 3240,
      status: 'completed',
      participants: [
        { id: 'usr-alex-chen', name: 'Alex Chen', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex', joinedAt: '2:00 PM', talkTimeSeconds: 1420 },
        { id: 'usr-security-lead', name: 'Security Lead', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Security', joinedAt: '2:02 PM', talkTimeSeconds: 980 },
        { id: 'usr-elena', name: 'Elena Rostova', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Elena', joinedAt: '2:05 PM', talkTimeSeconds: 840 },
      ],
      reactions: [
        { emoji: '💡', count: 14 },
        { emoji: '👍', count: 22 },
        { emoji: '👏', count: 18 },
        { emoji: '❤️', count: 8 },
      ],
      notes: [
        { id: 'nt-1', text: 'Unified Task Universe will support 5 views: Kanban, Timeline, Spatial Map, Project Explorer, and List.', authorName: 'Alex Chen', timestamp: '2:15 PM' },
        { id: 'nt-2', text: 'AI Mission Control must include deterministic offline rules so zero features break if Gemini API key is absent.', authorName: 'Security Lead', timestamp: '2:35 PM' },
      ],
      decisions: [
        { id: 'dc-1', text: 'Approved converting any idea card or meeting action item directly into a Task Universe task.', timestamp: '2:40 PM' },
      ],
      actionItemTaskIds: ['task-101', 'task-103'],
    },
  ],
  recommendations: [
    {
      id: 'rec-1',
      type: 'deadline_risk',
      title: 'DTLS Audit deadline is tomorrow (High Priority)',
      reasoning: 'Task "Audit DTLS-SRTP Media Handshake Telemetry" is due in less than 24 hours and is still marked in_progress with 1 pending subtask.',
      impact: 'high',
      targetTaskId: 'task-102',
      suggestedAction: {
        actionType: 'escalate',
        newPriority: 'urgent',
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rec-2',
      type: 'subtask_breakdown',
      title: 'Decompose Spatial Canvas task into smaller review milestones',
      reasoning: 'Task "Architect 2.5D Spatial Perspective Canvas" has 12 estimated hours; splitting it reduces blocker friction for Marcus Vance.',
      impact: 'medium',
      targetTaskId: 'task-101',
      suggestedAction: {
        actionType: 'split',
        newSubtasks: [
          'Calibrate CSS perspective(1200px) rotateX tilt',
          'Add keyboard pan shortcuts (WASD/Arrows)',
          'Implement visual SVG bezier links',
        ],
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ],
  lastUpdated: new Date().toISOString(),
};

/**
 * Fetch persistent TaskFlow state from backend API with localStorage fallback
 */
export async function fetchTaskFlowState(): Promise<TaskFlowState> {
  try {
    const res = await fetch(`${BASE_URL}/api/taskflow/state`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.tasks && data.projects) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('[TaskFlow API] Backend state sync unreachable, falling back to local storage:', err);
  }

  // Local fallback
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback to initial default
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_STATE));
  return INITIAL_DEFAULT_STATE;
}

/**
 * Save TaskFlow state to backend and local storage
 */
export async function saveTaskFlowState(state: TaskFlowState): Promise<void> {
  // Always update local cache
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  try {
    await fetch(`${BASE_URL}/api/taskflow/state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(state),
    });
  } catch (err) {
    console.warn('[TaskFlow API] Failed to push state to server:', err);
  }
}

/**
 * Request AI subtask breakdown and smart planning suggestions for an idea card
 */
export async function planIdeaWithAI(
  title: string,
  description: string,
  category: string
): Promise<{
  subtasks: string[];
  suggestedPriority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDays: number;
  risks: string[];
  dependenciesAdvice: string;
  isAI: boolean;
}> {
  try {
    const res = await fetch(`${BASE_URL}/api/taskflow/ai/plan-idea`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ title, description, category }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // continue to fallback
  }

  // Deterministic rule-based fallback
  const wordCount = (description || '').split(/\s+/).length;
  const isHigh = title.toLowerCase().includes('security') || title.toLowerCase().includes('core') || title.toLowerCase().includes('api');
  return {
    subtasks: [
      `Specify technical interface requirements for ${title.slice(0, 30)}`,
      `Implement core prototype logic & state binding`,
      `Add responsive UI controls with accessibility review`,
      `Conduct end-to-end integration verification`,
    ],
    suggestedPriority: isHigh ? 'urgent' : wordCount > 15 ? 'high' : 'medium',
    estimatedDays: wordCount > 20 ? 5 : 3,
    risks: [
      'Potential state synchronization latency under high concurrency',
      'Requires validation across mobile viewport dimensions',
    ],
    dependenciesAdvice: 'Link as a downstream task to foundational data models before deploying.',
    isAI: false,
  };
}

/**
 * Request AI Mission Control workload optimization advice
 */
export async function analyzeWorkloadWithAI(tasks: TaskItem[]): Promise<{
  summary: string;
  recommendations: AIRecommendation[];
  isAI: boolean;
}> {
  try {
    const res = await fetch(`${BASE_URL}/api/taskflow/ai/analyze-workload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ tasks }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // continue to fallback
  }

  // Deterministic rule-based workload evaluation
  const now = new Date();
  const overdue = tasks.filter((t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now);
  const inProgress = tasks.filter((t) => t.status === 'in_progress');

  const recs: AIRecommendation[] = [];

  if (overdue.length > 0) {
    recs.push({
      id: `rec-rule-${Date.now()}-1`,
      type: 'deadline_risk',
      title: `${overdue.length} Task(s) Overdue or Approaching Immediate Deadline`,
      reasoning: `Identified overdue items: "${overdue[0].title}". Recommend expediting or resetting deadline to avoid velocity drag.`,
      impact: 'high',
      targetTaskId: overdue[0].id,
      suggestedAction: {
        actionType: 'reschedule',
        newDueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  if (inProgress.length > 3) {
    recs.push({
      id: `rec-rule-${Date.now()}-2`,
      type: 'workload_balance',
      title: 'Context Switching Alert: High WIP Count',
      reasoning: `Team currently has ${inProgress.length} concurrent in-progress tasks. Limiting WIP to 3 will accelerate cycle time.`,
      impact: 'medium',
      suggestedAction: {
        actionType: 'reassign',
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  return {
    summary: `Workload status: ${tasks.length} total tasks. ${tasks.filter((t) => t.status === 'completed').length} completed, ${inProgress.length} in-progress, ${overdue.length} requiring immediate attention.`,
    recommendations: recs,
    isAI: false,
  };
}
