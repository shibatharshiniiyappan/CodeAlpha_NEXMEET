import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ListTodo,
  FileText,
  Copy,
  Check,
  Download,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import { AISummary, Meeting } from '../types';
import { generateMeetingAISummary, getMeetingAISummary } from '../services/api';

interface AISummaryPanelProps {
  meeting: Meeting | null;
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AISummaryPanel: React.FC<AISummaryPanelProps> = ({
  meeting,
  roomId,
  isOpen,
  onClose,
}) => {
  const [hasConsent, setHasConsent] = useState<boolean>(false);
  const [summary, setSummary] = useState<AISummary | null>(meeting?.aiSummary || null);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Load existing summary if available
  useEffect(() => {
    if (isOpen && roomId) {
      getMeetingAISummary(roomId)
        .then((res) => {
          if (res.summary) setSummary(res.summary);
        })
        .catch(() => {});
    }
  }, [isOpen, roomId]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!hasConsent) {
      setError('Please review and accept the participant disclosure and consent before generating the AI summary.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const res = await generateMeetingAISummary(roomId, customNotes);
      setSummary(res.summary);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI meeting summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    const text = `# ${meeting?.title || 'Meeting'} Summary
Date: ${new Date(summary.generatedAt).toLocaleString()}
Room: ${meeting?.code || roomId}

## Executive Summary
${summary.summary}

## Key Topics
${summary.topics.map((t) => `- ${t}`).join('\n')}

## Decisions Made
${summary.decisions.map((d) => `- ${d}`).join('\n')}

## Action Items
${summary.actionItems.map((a) => `- [ ] ${a.task} (${a.assignee || 'Unassigned'}) [${a.status}]`).join('\n')}
`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!summary) return;
    const text = `# ${meeting?.title || 'Meeting'} Summary\nDate: ${new Date(summary.generatedAt).toLocaleString()}\nRoom: ${meeting?.code || roomId}\n\n## Executive Summary\n${summary.summary}\n\n## Key Topics\n${summary.topics.map((t) => `- ${t}`).join('\n')}\n\n## Decisions Made\n${summary.decisions.map((d) => `- ${d}`).join('\n')}\n\n## Action Items\n${summary.actionItems.map((a) => `- [ ] ${a.task} (${a.assignee || 'Unassigned'})`).join('\n')}`;

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-summary-${meeting?.code || roomId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#111827] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600/30 to-cyan-500/30 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Meeting Summary & Action Items</span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Gemini Flash Powered
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {meeting?.title || 'Current Meeting Room'} ({meeting?.code || roomId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Participant Disclosure & Consent Banner */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-white">Participant Disclosure & Consent:</span> Meeting summarization processes session chat logs, agendas, and participant discussion points to extract key decisions and action items. No audio or video is recorded or stored without clear disclosure.
              </div>
            </div>

            <label className="flex items-center gap-2.5 pt-2 border-t border-slate-800/80 cursor-pointer">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(e) => {
                  setHasConsent(e.target.checked);
                  if (error) setError(null);
                }}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-200 select-none">
                I acknowledge the participant disclosure and consent to AI summarization for this session.
              </span>
            </label>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Generator Input Section */}
          <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Session Context / Discussion Notes (Optional)</span>
              </label>
              <span className="text-[11px] text-slate-500">Enriches AI extraction</span>
            </div>

            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Reviewed sprint velocity, decided to adopt PostgreSQL scale-to-zero, Alex assigned to schema migrations."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Analyzes live chat messages, shared notes & participant actions
              </span>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !hasConsent}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Session...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{summary ? 'Regenerate Summary' : 'Generate Summary'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Results View */}
          {summary && (
            <div className="space-y-4">
              {/* Executive Overview */}
              <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Executive Overview</span>
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed">{summary.summary}</p>
                <p className="text-[10px] text-slate-500 mt-2">
                  Generated {new Date(summary.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Discussion Topics */}
              {summary.topics && summary.topics.length > 0 && (
                <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-2">
                    Key Discussion Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {summary.topics.map((topic, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-950/40 text-violet-300 border border-violet-500/30"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Decisions Made */}
              {summary.decisions && summary.decisions.length > 0 && (
                <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Decisions Made</span>
                  </h3>
                  <ul className="space-y-1.5">
                    {summary.decisions.map((decision, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{decision}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {summary.actionItems && summary.actionItems.length > 0 && (
                <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5 flex items-center gap-1.5">
                    <ListTodo className="w-3.5 h-3.5" />
                    <span>Action Items & Assignees</span>
                  </h3>
                  <div className="space-y-2">
                    {summary.actionItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            defaultChecked={item.status === 'completed'}
                            className="rounded border-slate-700 bg-slate-800 text-cyan-400"
                          />
                          <span className="text-slate-200">{item.task}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {item.assignee || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {summary && (
          <div className="flex items-center justify-between px-6 py-3.5 bg-[#111827] border-t border-slate-800 shrink-0">
            <span className="text-xs text-slate-400 font-mono">
              Meeting ID: {meeting?.code || roomId}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Markdown</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
