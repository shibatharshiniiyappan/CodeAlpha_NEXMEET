# Implementation Plan — CodeAlpha_TaskFlow Advanced Feature Integration

Upgrade **CodeAlpha_TaskFlow** into a futuristic, interactive productivity platform featuring five unified capabilities:
1. **Spatial Rooms** (Immersive 2.5D virtual project workspaces with thematic environments)
2. **Idea-to-Action Canvas** (Visual brainstorming board converting ideas into actionable tasks with AI subtask breakdown)
3. **Meeting Pulse** (Meeting collaboration workspace with participation insights, quick reactions, and action item extraction)
4. **Interactive Task Universe** (Kanban, Timeline, Spatial Node Map, Project Explorer, and Compact List views)
5. **AI Mission Control** (Intelligent workload analytics, deadline risk prober, and task prioritization assistant with robust offline fallback)

---

## 1. Codebase Architecture & Current State Inspection

### Existing Technology Stack
- **Frontend**: React 19.0.1, TypeScript, Vite 8.3.0, Tailwind CSS 4.3.3, Lucide React icons, Motion 12.23.24.
- **Backend / Signaling**: Node.js + Express 4.21.2 (`server.ts`), Socket.IO 4.8.4, Multer (file uploads), `@google/genai` 2.4.0 (server-side Gemini).
- **Data Persistence**: JSON-backed local storage in `/data/` (`meetings.json`, `history.json`, `users.json`, `sessions.json`).
- **Real-Time Layer**: Full WebRTC peer mesh with STUN servers, Socket.IO signaling rooms, and DTLS-SRTP diagnostics.

### Existing Functionality to Preserve
- **Authentication & User Profiles**: Express auth (`/api/auth/*`), scrypt password hashing, session tokens, demo account (`alex@nexmeet.dev`).
- **Meeting & Video Infrastructure**: WebRTC audio/video calling, screen sharing, meeting locks, host controls, waiting room admission, chat with file uploads, whiteboard strokes sync.
- **Persistent Data Store**: Disk-backed meetings and history records in `/data/`.
- **Existing Meeting Room Views**: Spatial room theme selector, idea canvas notes in video rooms, participation analytics modal.

---

## 2. Proposed Shared Data Model & Storage Schema

To ensure seamless integration across all 5 features without breaking existing meeting functionality, we define a unified schema in `src/types/taskflow.ts` and persist it via `/api/taskflow/*` endpoints into `/data/taskflow.json`.

```ts
// Unified Task Model (Shared across Canvas, Meetings, Universe, and Mission Control)
export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId: string;
  projectName: string;
  roomId?: string; // Associated Spatial Room
  meetingId?: string; // Originating meeting (if created from Meeting Pulse)
  canvasNoteId?: string; // Originating idea note (if created from Idea Canvas)
  assignee?: { id: string; name: string; avatar: string };
  dueDate?: string;
  estimatedHours?: number;
  tags: string[];
  dependencies: string[]; // IDs of blocker tasks
  subtasks: Array<{ id: string; title: string; completed: boolean }>;
  createdAt: string;
  updatedAt: string;
}

// Project Model
export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: 'active' | 'archived' | 'completed';
  leadName: string;
  targetDate?: string;
  taskCount?: number;
  completedCount?: number;
}

// Spatial Room Workspace Model (Expanded)
export interface SpatialWorkspaceRoom {
  id: string;
  type: 'brainstorming' | 'war_room' | 'collaboration' | 'focus' | 'planning_review';
  name: string;
  description: string;
  accentColor: string;
  icon: string;
  associatedProjectIds: string[];
  members: Array<{ id: string; name: string; avatar: string; role: string }>;
  activeTaskIds: string[];
  createdAt: string;
  canvasData?: {
    nodes: Array<{ id: string; text: string; x: number; y: number; color: string; taskId?: string }>;
  };
}

// Meeting Pulse Session Model
export interface MeetingPulseSession {
  id: string;
  title: string;
  agenda: string[];
  projectId?: string;
  roomId?: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  status: 'scheduled' | 'active' | 'completed';
  participants: Array<{ id: string; name: string; avatar: string; joinedAt: string; talkTimeSeconds: number }>;
  reactions: Array<{ emoji: string; count: number }>;
  notes: Array<{ id: string; text: string; authorName: string; timestamp: string }>;
  decisions: Array<{ id: string; text: string; timestamp: string }>;
  actionItemTaskIds: string[];
}

// AI Mission Control Recommendation
export interface AIRecommendation {
  id: string;
  type: 'priority_shift' | 'deadline_risk' | 'subtask_breakdown' | 'workload_balance';
  title: string;
  reasoning: string;
  impact: 'high' | 'medium' | 'low';
  suggestedAction: {
    taskId?: string;
    actionType: 'reschedule' | 'split' | 'reassign' | 'escalate';
    payload: any;
  };
  status: 'pending' | 'accepted' | 'dismissed';
}
```

---

## 3. Five Feature Architecture & UX Design

### Feature 1: Spatial Rooms (Immersive Virtual Workspaces)
- **Room Environments**:
  1. *Brainstorming Room* (Cyan cyber glow, free-form ideation canvas)
  2. *Project War Room* (Amber/Red high-alert telemetry, deadline clocks, active blocker radars)
  3. *Team Collaboration Room* (Emerald/Teal open studio, shared whiteboards and active member presence)
  4. *Focus Room* (Deep sapphire/indigo quiet zone, distraction-free timers, ambient audio)
  5. *Planning & Review Room* (Violet/Purple strategic layout, sprint roadmap projections)
- **UI & Interaction**:
  - Polished 2.5D layered perspective using CSS 3D transforms, SVG isometric grids, and smooth camera panning.
  - Room cards with live member counters, active tasks, project associations, and one-click "Enter Spatial Room".
  - Inside the room: 2.5D interactive stage with movable task and idea pods, ambient audio synth toggle, and room control hud.

### Feature 2: Idea-to-Action Canvas
- **Visual Ideation Board**:
  - Flexible categories: Ideas, Questions, Challenges, Decisions, Action Items.
  - Card priority flags, tags, custom color markers, and drag-and-drop placement with zoom/pan canvas controls.
  - Visual dependency links (connecting arrows between parent ideas and downstream subtasks).
- **Convert-to-Task Modal**:
  - Single-click action on any card to convert to a TaskFlow task, preserving title, description, category, and priority.
  - Destination selector (assign project, spatial room, and team member).
- **AI Smart Planning**:
  - Server-side Gemini API route (`/api/taskflow/ai/plan-idea`) using `gemini-3.8-flash` to suggest subtask breakdowns, dependency trees, and deadline risk evaluations.
  - Deterministic client/server rule-based fallback when Gemini API key is absent, clearly marked with a *"Rule-Based Planner"* indicator.

### Feature 3: Meeting Pulse (Live Insights & Action Items)
- **Meeting Workspace**:
  - Integrated meeting session panel with agenda checklists, real-time timer, and meeting controls.
  - Live reaction stream (👍, 💡, ❤️, 👏, ❓) broadcasting via Socket.IO.
  - Dedicated Note Taker and Decision Logger.
  - Direct *"Convert Action Item to Task"* button that immediately synchronizes the new task into the Task Universe.
- **Participation Insights**:
  - Connected participant list with actual speech activity indicators (using WebRTC audio analyzer stream data when in room, or manual entry/session tracking).
  - Accessible participation distribution chart (speaking time and reaction counts).
  - Meeting summary report exportable as Markdown or JSON.

### Feature 4: Interactive Task Universe
- **Five Interactive Views**:
  1. *Kanban Board*: 5 drag-and-drop columns (Backlog, To Do, In Progress, Review, Completed).
  2. *Timeline / Gantt View*: Horizontal schedule with deadline dates, overdue markers, and progress bars.
  3. *Project Explorer*: Filtered breakdown by project health, task volume, and completion velocity.
  4. *Spatial Task Map*: Node graph displaying tasks as interactive orbital nodes clustered by project and connected by blocker links.
  5. *Compact List View*: High-density tabular layout with keyboard navigation and instant status toggles.
- **Task Detail Drawer**: Context-preserving side sheet with description, subtask checklist, priority selector, blockers, and history.

### Feature 5: AI Mission Control
- **Executive Productivity Dashboard**:
  - Real metrics: Tasks completed, in-progress velocity, upcoming deadlines, overdue warnings, and project completion rates.
  - Daily productivity briefing generated from actual task state.
- **Intelligent Assistant Panel**:
  - Proactive suggestions: detects conflicting deadlines on the same date, highlights blocker chains, and recommends optimal task prioritization.
  - Interactive approval workflow: users inspect the reasoning and click *Approve* or *Dismiss* before any changes apply.
  - Safe server-side Gemini integration (`gemini-3.8-flash`) with offline rule-based heuristic engine fallback.

---

## 4. Unified Navigation & Integration Plan

### Navigation Architecture
In `src/components/Navbar.tsx` and a new collapsible `SidebarNav`:
- **Dashboard** (Executive overview & quick actions)
- **Task Universe** (Kanban, Timeline, Spatial Node Map, List)
- **Spatial Rooms** (Virtual 2.5D thematic workspaces)
- **Idea Canvas** (Visual brainstorming & conversion)
- **Meeting Pulse** (Sessions, insights & action items)
- **AI Mission Control** (Intelligent workload & schedule optimizer)
- **Projects** (Project health & milestones)
- **Meeting Rooms (Video/WebRTC)** (Preserved existing NEXMEET audio/video/whiteboard platform)

### Persistence & Storage Strategy
- Server file store: `/data/taskflow.json` containing projects, tasks, spatial rooms, and meeting records.
- REST API layer in `server.ts`:
  - `GET /api/taskflow/state` — Loads entire project/task/room/meeting state.
  - `POST /api/taskflow/tasks` — Create, update, or delete tasks.
  - `POST /api/taskflow/rooms` — Create or update spatial rooms.
  - `POST /api/taskflow/meetings` — Create or log meeting pulse sessions.
  - `POST /api/taskflow/ai/analyze` — Mission Control AI insights (Gemini `gemini-3.8-flash` with deterministic fallback).
- Browser LocalStorage fallback: Ensures offline continuity if running without the Express backend.

---

## 5. File Inventory (Proposed Additions & Modifications)

### Files to Create
1. `src/types/taskflow.ts` — Comprehensive TypeScript interfaces for Tasks, Projects, Spatial Rooms, Meeting Pulse, and AI Recommendations.
2. `src/services/taskflowApi.ts` — Client API service for TaskFlow REST endpoints with LocalStorage fallback.
3. `src/context/TaskFlowContext.tsx` — Global React state manager providing reactive CRUD operations for tasks, projects, rooms, and meetings.
4. `src/components/taskflow/SidebarNav.tsx` — Futuristic collapsible navigation sidebar supporting all 8 core views.
5. `src/components/taskflow/TaskUniverse.tsx` — Full interactive Task Universe (Kanban, Timeline, Spatial Map, Project Explorer, List).
6. `src/components/taskflow/TaskDetailModal.tsx` — Modal/Drawer for editing tasks, subtasks, deadlines, and dependencies.
7. `src/components/taskflow/SpatialRoomsView.tsx` — Enhanced 2.5D virtual rooms workspace with depth, themes, and interactive member pods.
8. `src/components/taskflow/IdeaActionCanvasView.tsx` — Full-page interactive brainstorming canvas with AI subtask breakdown and direct task conversion.
9. `src/components/taskflow/MeetingPulseView.tsx` — Meeting workspace with live agenda, reaction streaming, participation charts, and action item converter.
10. `src/components/taskflow/AIMissionControlView.tsx` — Productivity command center with workload metrics, daily briefings, and approval-based AI planner.

### Files to Modify (Preserving Existing Logic)
1. `server.ts` — Add `/api/taskflow/*` endpoints for persistent task/project/room state and server-side Gemini AI analysis; preserve all WebRTC, Socket.IO, and auth routes.
2. `src/App.tsx` — Add TaskFlow navigation router and embed the `TaskFlowProvider` while preserving existing video room and landing flows.
3. `src/components/Navbar.tsx` — Update header navigation to support switching between Task Universe, Spatial Rooms, Idea Canvas, Meeting Pulse, and AI Mission Control.
4. `metadata.json` — Update name/description to reflect **CodeAlpha_TaskFlow — Collaborative Productivity & Spatial Collaboration Platform**.

---

## 6. Phased Implementation Roadmap

- **Phase 1**: Inspection and Approval of Implementation Plan *(Current Phase)*.
- **Phase 2**: Define Shared Data Models (`src/types/taskflow.ts`), API Service (`src/services/taskflowApi.ts`), and State Context (`TaskFlowContext.tsx`).
- **Phase 3**: Implement Interactive Task Universe (Kanban, Timeline, Spatial Node Map, List view, and Task Detail Drawer).
- **Phase 4**: Implement Spatial Rooms (5 virtual 2.5D themed rooms) and Idea-to-Action Canvas (with AI subtask breakdown & task conversion).
- **Phase 5**: Implement Meeting Pulse (Session runner, reactions, speaking time distribution, and action item converter).
- **Phase 6**: Implement AI Mission Control (Productivity metrics, deadline risk prober, and AI suggestions with deterministic fallback).
- **Phase 7**: UI Integration, responsive layout polish, sidebar navigation, and end-to-end testing across desktop and mobile.
- **Phase 8**: Verification of production build (`npm run build`), TypeScript typecheck (`tsc --noEmit`), and Vercel deployment configuration check.

---

## 7. Approval Request
No existing files have been modified. Once you approve this implementation plan, we will immediately begin **Phase 2** (Shared Data Models & State Architecture) followed by **Phase 3** (Interactive Task Universe).
