import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Tag,
  CheckSquare,
  Square,
  AlertCircle,
  Folder,
  Trash2,
  Plus,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { TaskItem, TaskPriority, TaskStatus } from '../../types/taskflow';
import { useTaskFlow } from '../../context/TaskFlowContext';

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, onClose }) => {
  const { state, updateTask, deleteTask } = useTaskFlow();
  const task = state.tasks.find((t) => t.id === taskId);

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newTag, setNewTag] = useState('');

  if (!task) return null;

  const handleToggleSubtask = (subId: string) => {
    const updated = task.subtasks.map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s));
    updateTask(task.id, { subtasks: updated });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSub = {
      id: `sub-${Date.now().toString(36)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    updateTask(task.id, { subtasks: [...task.subtasks, newSub] });
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (subId: string) => {
    updateTask(task.id, { subtasks: task.subtasks.filter((s) => s.id !== subId) });
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || task.tags.includes(newTag.trim())) return;
    updateTask(task.id, { tags: [...task.tags, newTag.trim()] });
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    updateTask(task.id, { tags: task.tags.filter((t) => t !== tag) });
  };

  const priorityColors: Record<TaskPriority, string> = {
    low: 'text-slate-400 bg-slate-800/60 border-slate-700',
    medium: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
    high: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
    urgent: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
  };

  const statusLabels: Record<TaskStatus, string> = {
    backlog: 'Backlog',
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'Review',
    completed: 'Completed',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0B132B] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">{task.id}</span>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Folder className="w-3.5 h-3.5 text-slate-500" />
              <span>{task.projectName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Delete this task?')) {
                  deleteTask(task.id);
                  onClose();
                }
              }}
              title="Delete task"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              value={task.title}
              onChange={(e) => updateTask(task.id, { title: e.target.value })}
              className="w-full text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-slate-800 focus:border-cyan-500 focus:outline-none transition-colors py-1"
            />
          </div>

          {/* Quick Properties Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Status</label>
              <select
                value={task.status}
                onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                {Object.entries(statusLabels).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Priority</label>
              <select
                value={task.priority}
                onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                className={`w-full border rounded-lg px-2.5 py-1.5 focus:outline-none capitalize font-semibold ${priorityColors[task.priority]}`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={task.dueDate || ''}
                  onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Estimated Time</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={task.estimatedHours || 0}
                  onChange={(e) => updateTask(task.id, { estimatedHours: Number(e.target.value) })}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-slate-400 text-xs">hrs</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={task.description}
              onChange={(e) => updateTask(task.id, { description: e.target.value })}
              placeholder="Provide context, acceptance criteria, or technical design specifications..."
              className="w-full p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          {/* Assignee Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Assigned Collaborator
            </label>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <img
                src={task.assignee?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Unassigned'}
                alt={task.assignee?.name || 'Unassigned'}
                className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700"
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{task.assignee?.name || 'Unassigned Task'}</div>
                <div className="text-xs text-slate-400">
                  {task.assignee ? 'Responsible for execution & PR delivery' : 'Assign to a team member'}
                </div>
              </div>
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Subtasks & Deliverables (
                {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
              </label>
            </div>

            <div className="space-y-2 mb-3">
              {task.subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/70 hover:border-slate-700 transition-colors group"
                >
                  <button
                    onClick={() => handleToggleSubtask(sub.id)}
                    className="flex items-center gap-2.5 text-left flex-1"
                  >
                    {sub.completed ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        sub.completed ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {sub.title}
                    </span>
                  </button>
                  <button
                    onClick={() => handleRemoveSubtask(sub.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add new subtask item..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Tags & Labels
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 text-cyan-300 border border-slate-700/60 text-xs font-medium"
                >
                  <Tag className="w-3 h-3 text-cyan-400/80" />
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-400 transition-colors ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag (e.g. Frontend, WebRTC, Q4)..."
                className="w-48 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
              >
                + Tag
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800/80 bg-slate-900/60 text-xs text-slate-400">
          <div>
            Created: <span className="font-mono text-slate-300">{new Date(task.createdAt).toLocaleDateString()}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
