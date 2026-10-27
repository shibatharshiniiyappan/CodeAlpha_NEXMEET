import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  Columns,
  Calendar,
  Layers,
  List,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Folder,
  Tag,
  CheckSquare,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { TaskItem, TaskPriority, TaskStatus } from '../../types/taskflow';
import { TaskDetailModal } from './TaskDetailModal';

type TaskUniverseViewMode = 'kanban' | 'timeline' | 'spatial_map' | 'project_explorer' | 'list';

export const TaskUniverse: React.FC = () => {
  const {
    state,
    selectedTaskId,
    setSelectedTaskId,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    selectedProjectId,
    setSelectedProjectId,
    moveTaskStatus,
    createTask,
  } = useTaskFlow();

  const [viewMode, setViewMode] = useState<TaskUniverseViewMode>('kanban');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProject, setNewTaskProject] = useState(state.projects[0]?.id || '');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState(
    new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]
  );

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return state.tasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description.toLowerCase().includes(q);
        const matchesTags = task.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      // Project filter
      if (selectedProjectId && task.projectId !== selectedProjectId) return false;

      return true;
    });
  }, [state.tasks, searchQuery, statusFilter, priorityFilter, selectedProjectId]);

  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const project = state.projects.find((p) => p.id === newTaskProject) || state.projects[0];
    createTask({
      title: newTaskTitle.trim(),
      description: 'Quick task created from Task Universe workspace.',
      status: 'todo',
      priority: newTaskPriority,
      projectId: project.id,
      projectName: project.name,
      dueDate: newTaskDueDate,
      tags: ['taskflow'],
      dependencies: [],
      subtasks: [],
    });
    setNewTaskTitle('');
    setIsNewTaskModalOpen(false);
  };

  const statusColumns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'backlog', label: 'Backlog', color: 'border-slate-700 bg-slate-900/30' },
    { id: 'todo', label: 'To Do', color: 'border-blue-900/40 bg-blue-950/10' },
    { id: 'in_progress', label: 'In Progress', color: 'border-cyan-800/40 bg-cyan-950/10' },
    { id: 'review', label: 'Review', color: 'border-violet-900/40 bg-violet-950/10' },
    { id: 'completed', label: 'Completed', color: 'border-emerald-900/40 bg-emerald-950/10' },
  ];

  const priorityBadges: Record<TaskPriority, { color: string; label: string }> = {
    low: { color: 'text-slate-400 bg-slate-800/80 border-slate-700', label: 'Low' },
    medium: { color: 'text-blue-400 bg-blue-950/60 border-blue-800/50', label: 'Medium' },
    high: { color: 'text-amber-400 bg-amber-950/60 border-amber-800/50', label: 'High' },
    urgent: { color: 'text-rose-400 bg-rose-950/60 border-rose-800/50', label: 'Urgent' },
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#080D19] overflow-hidden">
      {/* Top Controls Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-[#0B132B]/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
              Interactive Task Universe
            </h1>
            <span className="text-xs font-mono text-cyan-400/80 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full">
              {filteredTasks.length} tasks
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time orbital tracking, multi-dimensional views & dependency graphs
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'kanban'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>

          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'timeline'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => setViewMode('spatial_map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'spatial_map'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Spatial Map</span>
          </button>

          <button
            onClick={() => setViewMode('project_explorer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'project_explorer'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Projects</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsNewTaskModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 py-2.5 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, descriptions, or tags..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Project:</span>
          <select
            value={selectedProjectId || 'all'}
            onChange={(e) => setSelectedProjectId(e.target.value === 'all' ? null : e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Projects</option>
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-auto p-6">
        {/* VIEW 1: KANBAN BOARD */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-w-[1000px] h-full items-start">
            {statusColumns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);
              return (
                <div
                  key={col.id}
                  className={`flex flex-col rounded-2xl border p-3 min-h-[500px] ${col.color}`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      {col.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Task Cards Column */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {colTasks.length === 0 ? (
                      <div className="h-28 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-xs">
                        No tasks in {col.label}
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="p-3.5 rounded-xl bg-[#0F172A]/90 border border-slate-800/90 hover:border-cyan-500/50 shadow-md hover:shadow-cyan-500/10 cursor-pointer transition-all duration-200 group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono ${
                                priorityBadges[task.priority].color
                              }`}
                            >
                              {priorityBadges[task.priority].label}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                              {task.projectName}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 mb-1.5 leading-snug">
                            {task.title}
                          </h4>

                          <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                            {task.description}
                          </p>

                          {/* Card Footer */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
                            <div className="flex items-center gap-1.5">
                              {task.dueDate && (
                                <span className="flex items-center gap-1 font-mono text-slate-300">
                                  <Clock className="w-3 h-3 text-cyan-400" />
                                  {task.dueDate.slice(5)}
                                </span>
                              )}
                              {task.subtasks.length > 0 && (
                                <span className="flex items-center gap-0.5 text-slate-400 font-mono">
                                  <CheckSquare className="w-3 h-3 text-slate-400" />
                                  {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                                </span>
                              )}
                            </div>

                            {task.assignee && (
                              <img
                                src={task.assignee.avatar}
                                alt={task.assignee.name}
                                title={`Assigned to ${task.assignee.name}`}
                                className="w-5 h-5 rounded-full border border-slate-700 bg-slate-800"
                              />
                            )}
                          </div>

                          {/* Quick Status Shift Bar */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2.5 pt-2 border-t border-slate-800/40 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                          >
                            <span className="text-slate-400">Move:</span>
                            <div className="flex items-center gap-1">
                              {col.id !== 'todo' && col.id !== 'backlog' && (
                                <button
                                  onClick={() =>
                                    moveTaskStatus(
                                      task.id,
                                      col.id === 'completed'
                                        ? 'review'
                                        : col.id === 'review'
                                        ? 'in_progress'
                                        : 'todo'
                                    )
                                  }
                                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                >
                                  ←
                                </button>
                              )}
                              {col.id !== 'completed' && (
                                <button
                                  onClick={() =>
                                    moveTaskStatus(
                                      task.id,
                                      col.id === 'backlog'
                                        ? 'todo'
                                        : col.id === 'todo'
                                        ? 'in_progress'
                                        : col.id === 'in_progress'
                                        ? 'review'
                                        : 'completed'
                                    )
                                  }
                                  className="px-1.5 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded font-bold"
                                >
                                  →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: TIMELINE & GANTT VIEW */}
        {viewMode === 'timeline' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="p-4 rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Sprint Deadlines & Delivery Schedule</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">Current Quarter 2026</div>
              </div>

              <div className="space-y-3">
                {filteredTasks
                  .filter((t) => t.dueDate)
                  .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                  .map((task) => {
                    const isOverdue =
                      new Date(task.dueDate!).getTime() < Date.now() && task.status !== 'completed';
                    const progress =
                      task.subtasks.length > 0
                        ? Math.round(
                            (task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100
                          )
                        : task.status === 'completed'
                        ? 100
                        : task.status === 'in_progress'
                        ? 50
                        : 0;

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                priorityBadges[task.priority].color
                              }`}
                            >
                              {task.priority.toUpperCase()}
                            </span>
                            <span className="text-xs font-bold text-white truncate">{task.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-3 font-mono">
                            <span>Project: {task.projectName}</span>
                            <span>Status: {task.status.replace('_', ' ')}</span>
                          </div>
                        </div>

                        {/* Progress Bar & Due Date */}
                        <div className="flex items-center gap-4 w-full sm:w-auto shrink-0">
                          <div className="w-32">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  task.status === 'completed' ? 'bg-emerald-400' : 'bg-cyan-400'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <div
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border ${
                              isOverdue
                                ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                                : 'bg-slate-800 text-cyan-300 border-slate-700'
                            }`}
                          >
                            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                            <span>{task.dueDate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SPATIAL TASK MAP */}
        {viewMode === 'spatial_map' && (
          <div className="relative w-full h-[600px] rounded-2xl bg-gradient-to-b from-[#0B132B]/90 to-[#080D19] border border-slate-800 p-6 overflow-hidden flex flex-col justify-between">
            {/* Grid background effect */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Spatial Orbital Task Nodes & Blockers</span>
              </div>
              <div className="text-xs text-slate-400">Click any node to open task telemetry</div>
            </div>

            {/* Orbital Cluster Matrix */}
            <div className="relative z-10 flex-1 flex flex-wrap items-center justify-center gap-6 p-4 overflow-auto">
              {filteredTasks.map((task, idx) => {
                const angle = (idx / filteredTasks.length) * Math.PI * 2;
                const distance = 120 + (idx % 3) * 40;
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="relative p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 w-64 group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 animate-pulse" />
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                          priorityBadges[task.priority].color
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors mb-1.5">
                      {task.title}
                    </h4>
                    <div className="text-[10px] text-slate-400 font-mono mb-2">
                      {task.projectName}
                    </div>

                    {task.dependencies.length > 0 && (
                      <div className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 mb-2">
                        <span>Blockers: {task.dependencies.length} linked</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                      <span>Due: {task.dueDate || 'Flexible'}</span>
                      {task.assignee && (
                        <span className="font-semibold text-slate-300">{task.assignee.name}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
              <div>Visualizing node graph clustering by active project</div>
              <div className="font-mono text-cyan-400">Total Nodes: {filteredTasks.length}</div>
            </div>
          </div>
        )}

        {/* VIEW 4: PROJECT EXPLORER */}
        {viewMode === 'project_explorer' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {state.projects.map((project) => {
              const projTasks = state.tasks.filter((t) => t.projectId === project.id);
              const completedCount = projTasks.filter((t) => t.status === 'completed').length;
              const percent =
                projTasks.length > 0 ? Math.round((completedCount / projTasks.length) * 100) : 0;

              return (
                <div
                  key={project.id}
                  className="p-5 rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <h3 className="text-base font-bold text-white">{project.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {project.category || 'Active Track'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{project.description}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold text-white font-mono">
                          {completedCount}/{projTasks.length} Done ({percent}%)
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">Lead: {project.leadName}</div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setViewMode('kanban');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold transition-colors"
                      >
                        Open Kanban →
                      </button>
                    </div>
                  </div>

                  {/* Tasks in project */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {projTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer flex items-center justify-between gap-3 group transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded border border-slate-600 shrink-0" />
                          )}
                          <span className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                            {task.title}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                            priorityBadges[task.priority].color
                          }`}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 5: COMPACT LIST VIEW */}
        {viewMode === 'list' && (
          <div className="max-w-5xl mx-auto rounded-2xl bg-[#0B132B]/80 border border-slate-800 overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-slate-900/80 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-5">Task Details</div>
              <div className="col-span-2">Project</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Due</div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="grid grid-cols-12 gap-2 px-5 py-3 hover:bg-slate-800/40 cursor-pointer transition-colors items-center text-xs"
                >
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTaskStatus(task.id, task.status === 'completed' ? 'todo' : 'completed');
                      }}
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-600 hover:border-cyan-400 shrink-0" />
                      )}
                    </button>
                    <span
                      className={`font-semibold truncate ${
                        task.status === 'completed'
                          ? 'line-through text-slate-500'
                          : 'text-white hover:text-cyan-300'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="col-span-2 text-slate-400 truncate font-medium">
                    {task.projectName}
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded border ${
                        priorityBadges[task.priority].color
                      }`}
                    >
                      {task.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-slate-300 font-mono text-[11px] capitalize">
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="col-span-1 text-right font-mono text-slate-400 text-[11px]">
                    {task.dueDate ? task.dueDate.slice(5) : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      )}

      {/* Quick Add Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create New Task</h3>
            <form onSubmit={handleCreateQuickTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Implement WebSocket rate limiter"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project</label>
                <select
                  value={newTaskProject}
                  onChange={(e) => setNewTaskProject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
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
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-md"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
