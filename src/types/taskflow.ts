export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskAssignee {
  id: string;
  name: string;
  avatar: string;
}

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  projectName: string;
  roomId?: string; // Spatial room id if linked
  meetingId?: string; // Meeting id if generated from meeting pulse
  canvasNoteId?: string; // Idea canvas note id if converted
  assignee?: TaskAssignee;
  dueDate?: string;
  estimatedHours?: number;
  tags: string[];
  dependencies: string[]; // Task IDs that this task depends on (blockers)
  subtasks: TaskSubtask[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: 'active' | 'archived' | 'completed';
  leadName: string;
  targetDate?: string;
  category?: string;
}

export type SpatialRoomType = 'brainstorming' | 'war_room' | 'collaboration' | 'focus' | 'planning_review';

export interface SpatialWorkspaceRoom {
  id: string;
  type: SpatialRoomType;
  name: string;
  tagline: string;
  description: string;
  accentColor: string;
  icon: string;
  associatedProjectIds: string[];
  members: Array<{ id: string; name: string; avatar: string; role: string }>;
  activeTaskIds: string[];
  ambientSoundName: string;
  canvasNodes?: Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    category: 'idea' | 'question' | 'challenge' | 'decision';
    taskId?: string;
  }>;
  createdAt: string;
}

export interface MeetingPulseParticipant {
  id: string;
  name: string;
  avatar: string;
  joinedAt: string;
  talkTimeSeconds: number;
  isSpeaking?: boolean;
}

export interface MeetingPulseSession {
  id: string;
  title: string;
  agenda: Array<{ id: string; text: string; completed: boolean }>;
  projectId?: string;
  projectName?: string;
  roomId?: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  status: 'scheduled' | 'active' | 'completed';
  participants: MeetingPulseParticipant[];
  reactions: Array<{ emoji: string; count: number }>;
  notes: Array<{ id: string; text: string; authorName: string; timestamp: string }>;
  decisions: Array<{ id: string; text: string; timestamp: string }>;
  actionItemTaskIds: string[];
}

export interface AIRecommendation {
  id: string;
  type: 'priority_shift' | 'deadline_risk' | 'subtask_breakdown' | 'workload_balance';
  title: string;
  reasoning: string;
  impact: 'high' | 'medium' | 'low';
  targetTaskId?: string;
  suggestedAction: {
    actionType: 'reschedule' | 'split' | 'reassign' | 'escalate';
    newPriority?: TaskPriority;
    newDueDate?: string;
    newSubtasks?: string[];
    suggestedAssignee?: string;
  };
  status: 'pending' | 'accepted' | 'dismissed';
  createdAt: string;
}

export interface TaskFlowState {
  projects: ProjectItem[];
  tasks: TaskItem[];
  rooms: SpatialWorkspaceRoom[];
  meetings: MeetingPulseSession[];
  recommendations: AIRecommendation[];
  lastUpdated: string;
}
