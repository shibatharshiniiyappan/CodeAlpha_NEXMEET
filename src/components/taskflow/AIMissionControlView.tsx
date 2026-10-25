import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Check,
  X,
  RefreshCw,
  Layers,
  Calendar,
  Zap,
  BarChart3,
  Sliders,
} from 'lucide-react';
import { useTaskFlow } from '../../context/TaskFlowContext';

export const AIMissionControlView: React.FC = () => {
  const {
    state,
    acceptRecommendation,
    dismissRecommendation,
    runAIAnalysis,
    isAnalyzing,
    setSelectedTaskId,
  } = useTaskFlow();

  const now = new Date();
  const completedTasks = state.tasks.filter((t) => t.status === 'completed');
  const inProgressTasks = state.tasks.filter((t) => t.status === 'in_progress');
  const overdueTasks = state.tasks.filter(
    (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now
  );
  const urgentTasks = state.tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed');
  const highTasks = state.tasks.filter((t) => t.priority === 'high' && t.status !== 'completed');

  const pendingRecs = state.recommendations.filter((r) => r.status === 'pending');
  const acceptedRecs = state.recommendations.filter((r) => r.status === 'accepted');

  const completionRate =
    state.tasks.length > 0 ? Math.round((completedTasks.length / state.tasks.length) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#080D19] overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-[#0B132B]/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400 animate-pulse"></span>
              AI Mission Control & Productivity Telemetry
            </h1>
            <span className="text-xs font-mono text-violet-300 bg-violet-950/60 border border-violet-800/40 px-2.5 py-0.5 rounded-full">
              Workload Intelligence Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated deadline risk detection, schedule optimization, and proactive task triage
          </p>
        </div>

        <button
          onClick={runAIAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-500/20 transition-all shrink-0 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Analyzing Workload...' : 'Run Intelligence Audit'}</span>
        </button>
      </div>

      {/* Main Mission Control Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Executive Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Completed Velocity</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">{completedTasks.length}</div>
              <div className="text-[11px] text-emerald-400/90 font-mono mt-1">
                {completionRate}% of total workload
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>In Progress (WIP)</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-300">{inProgressTasks.length}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                Optimal team concurrency
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Urgent & High Priority</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-300">
                {urgentTasks.length + highTasks.length}
              </div>
              <div className="text-[11px] text-amber-400/90 font-mono mt-1">Requires focus today</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>Deadline Bottlenecks</span>
                <Zap className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-400">{overdueTasks.length}</div>
              <div className="text-[11px] text-rose-400/90 font-mono mt-1">
                {overdueTasks.length > 0 ? 'Overdue / At Risk' : 'Zero overdue items'}
              </div>
            </div>
          </div>

          {/* Daily Productivity Executive Briefing */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-slate-900 to-[#0B132B] border border-violet-800/40 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-300 mb-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Executive Productivity Briefing</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              TaskFlow is coordinating <strong className="text-white">{state.tasks.length} total tasks</strong> across{' '}
              <strong className="text-white">{state.projects.length} strategic tracks</strong>. Current velocity stands at{' '}
              <strong className="text-cyan-400">{completionRate}% completion</strong> with{' '}
              <strong className="text-amber-400">{pendingRecs.length} actionable optimization recommendations</strong>{' '}
              awaiting your review.
            </p>
          </div>

          {/* 2-Column Section: AI Recommendations vs Projects Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Pending Recommendations */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Proactive AI Suggestions & Actions ({pendingRecs.length})</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Inspect reasoning before approving
                </span>
              </div>

              {pendingRecs.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-xs text-slate-300 font-semibold mb-1">
                    All optimization recommendations addressed
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click "Run Intelligence Audit" anytime to probe deadlines and workload balance.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {pendingRecs.map((rec) => {
                    const targetTask = state.tasks.find((t) => t.id === rec.targetTaskId);

                    return (
                      <div
                        key={rec.id}
                        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 shadow-lg space-y-3 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                                rec.impact === 'high'
                                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                                  : 'bg-amber-950 text-amber-300 border-amber-800'
                              }`}
                            >
                              {rec.impact} impact
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Type: {rec.type.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => dismissRecommendation(rec.id)}
                              className="px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs transition-colors"
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => acceptRecommendation(rec.id)}
                              className="flex items-center gap-1.5 px-3 py-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept & Apply</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white mb-1.5">{rec.title}</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{rec.reasoning}</p>
                        </div>

                        {targetTask && (
                          <div
                            onClick={() => setSelectedTaskId(targetTask.id)}
                            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <span className="text-slate-300 truncate">
                              Target: <strong className="text-white">{targetTask.title}</strong>
                            </span>
                            <span className="text-[10px] text-cyan-400 font-mono shrink-0">
                              View Task →
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 4 Cols: Project Completion Velocity */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Project Health</span>
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xl space-y-4">
                {state.projects.map((proj) => {
                  const tasks = state.tasks.filter((t) => t.projectId === proj.id);
                  const done = tasks.filter((t) => t.status === 'completed').length;
                  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

                  return (
                    <div key={proj.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{proj.name}</span>
                        <span className="font-mono text-slate-300">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: proj.color }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{done}/{tasks.length} tasks</span>
                        <span>Lead: {proj.leadName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Safety & Integrity Guarantee Box */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>AI Safety & Integrity Guard</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  No task dates, assignments, or priorities are modified silently. Every recommendation provides transparent reasoning and requires explicit human approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
