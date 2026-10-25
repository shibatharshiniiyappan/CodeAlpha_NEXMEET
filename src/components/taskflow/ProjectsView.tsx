import React, { useState } from 'react';
import {
  Folder,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Compass,
  Tag,
  Calendar,
  Layers,
  X,
} from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';
import { ProjectItem } from '../../types/taskflow';

interface ProjectsViewProps {
  onOpenTaskUniverseProject?: (projectId: string) => void;
  onOpenSpatialRoom?: (roomId: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onOpenTaskUniverseProject,
  onOpenSpatialRoom,
}) => {
  const { state, setSelectedProjectId, createTask } = useTaskFlow();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#06b6d4');
  const [newProjectCategory, setNewProjectCategory] = useState('Product Engineering');
  const [newProjectDate, setNewProjectDate] = useState(
    new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
  );

  const colors = [
    { label: 'Cyan', hex: '#06b6d4' },
    { label: 'Violet', hex: '#8b5cf6' },
    { label: 'Amber', hex: '#f59e0b' },
    { label: 'Emerald', hex: '#10b981' },
    { label: 'Rose', hex: '#f43f5e' },
  ];

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Strategic initiative tracked in TaskFlow.',
      color: newProjectColor,
      icon: 'Folder',
      status: 'active',
      leadName: 'Lead Architect',
      targetDate: newProjectDate,
      category: newProjectCategory,
    };

    state.projects.push(newProj);
    setIsNewProjectModalOpen(false);
    setNewProjectName('');
    setNewProjectDesc('');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#080D19] overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-[#0B132B]/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
              Strategic Projects & Portfolios
            </h1>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-0.5 rounded-full">
              {state.projects.length} Active Tracks
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mission-critical initiatives, associated Spatial Rooms, and delivery velocity metrics
          </p>
        </div>

        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project Initiative</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {state.projects.map((project) => {
            const projectTasks = state.tasks.filter((t) => t.projectId === project.id);
            const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
            const progress =
              projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;
            const associatedRooms = state.rooms.filter((r) =>
              r.associatedProjectIds.includes(project.id)
            );

            return (
              <div
                key={project.id}
                className="rounded-2xl bg-[#0B132B]/80 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      style={{ backgroundColor: `${project.color}20`, color: project.color, borderColor: `${project.color}40` }}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold border"
                    >
                      {project.category || 'Strategic Initiative'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{project.targetDate || '2026-12-31'}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {project.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Completion</span>
                      <span className="font-bold text-white">{progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${progress}%`, backgroundColor: project.color }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>

                  {/* Associated Spatial Rooms */}
                  {associatedRooms.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                        Connected Spatial Rooms
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {associatedRooms.map((room) => (
                          <span
                            key={room.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-cyan-300"
                          >
                            <Compass className="w-2.5 h-2.5" />
                            <span>{room.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">
                    {completedCount} / {projectTasks.length} tasks completed
                  </span>

                  <button
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      if (onOpenTaskUniverseProject) {
                        onOpenTaskUniverseProject(project.id);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all group-hover:bg-cyan-500 group-hover:text-slate-950"
                  >
                    <span>Inspect Tasks</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0F172A] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Folder className="w-4 h-4 text-cyan-400" />
                <span>Create New Strategic Project</span>
              </h3>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Distributed Mesh Engine"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Goals, deliverables, and scope..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={newProjectCategory}
                    onChange={(e) => setNewProjectCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={newProjectDate}
                    onChange={(e) => setNewProjectDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Theme Accent Color</label>
                <div className="flex items-center gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewProjectColor(c.hex)}
                      style={{ backgroundColor: c.hex }}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newProjectColor === c.hex ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-md shadow-cyan-500/20"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
