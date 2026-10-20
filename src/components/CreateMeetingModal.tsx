import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Video,
  Link as LinkIcon,
  Share2,
  ArrowRight,
  FileText,
  Calendar,
  Lock,
} from 'lucide-react';
import { Meeting } from '../types';
import { createMeeting } from '../services/api';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMeeting: (meeting: Meeting) => void;
  currentUser?: { id?: string; name?: string };
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
  onStartMeeting,
  currentUser,
}) => {
  const defaultTitle = currentUser?.name
    ? `${currentUser.name}'s Meeting Room`
    : 'Instant Collaboration Session';

  const [title, setTitle] = useState<string>(defaultTitle);
  const [createdMeeting, setCreatedMeeting] = useState<Meeting | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerateMeeting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsGenerating(true);

    try {
      const res = await createMeeting(
        title.trim() || defaultTitle,
        currentUser?.name || 'Meeting Host',
        currentUser?.id || 'host-user'
      );
      setCreatedMeeting(res.meeting);
    } catch (err: any) {
      setError(err.message || 'Failed to create meeting room');
    } finally {
      setIsGenerating(false);
    }
  };

  const getMeetingUrl = (code: string) => {
    return `${window.location.origin}/?room=${encodeURIComponent(code)}`;
  };

  const handleCopyLink = () => {
    if (!createdMeeting) return;
    const url = getMeetingUrl(createdMeeting.code);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    if (!createdMeeting) return;
    navigator.clipboard.writeText(createdMeeting.code);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyFullInvitation = () => {
    if (!createdMeeting) return;
    const url = getMeetingUrl(createdMeeting.code);
    const host = currentUser?.name || 'The meeting organizer';
    const text = `${host} is inviting you to a NEXMEET meeting.

Topic: ${createdMeeting.title}
Meeting ID: ${createdMeeting.code}

Join Meeting:
${url}

Tap on the link or paste the Meeting ID into NEXMEET to join.`;

    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleJoinNow = () => {
    if (createdMeeting) {
      onStartMeeting(createdMeeting);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#111827] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create a Meeting</h2>
              <p className="text-xs text-slate-400">Generate a unique meeting room and invite link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
              {error}
            </div>
          )}

          {!createdMeeting ? (
            /* Step 1: Configure & Generate */
            <form onSubmit={handleGenerateMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Meeting Topic / Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design Critique & Roadmap Sync"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2 text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Generates an unguessable 10-digit meeting ID (`XXX-XXX-XXXX`)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Share2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span>Instant shareable invitation URL for multiple participants</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Video className="w-4 h-4" />
                <span>{isGenerating ? 'Generating Unique Room...' : 'Create Meeting Room'}</span>
              </button>
            </form>
          ) : (
            /* Step 2: Display Meeting ID & Shareable Invitation */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                    Meeting Ready
                  </span>
                  <p className="text-sm font-bold text-white">{createdMeeting.title}</p>
                </div>
                <span className="text-xs text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  Ready to Join
                </span>
              </div>

              {/* Monospace Meeting ID Box */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Meeting ID
                </label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-mono text-xl sm:text-2xl font-bold text-cyan-300 tracking-wider flex-1 select-all">
                    {createdMeeting.code}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
                    title="Copy Meeting ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
                  </button>
                </div>
              </div>

              {/* Shareable Invitation URL Box */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Shareable Invitation Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 min-w-0">
                    <LinkIcon className="w-4 h-4 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      readOnly
                      value={getMeetingUrl(createdMeeting.code)}
                      className="bg-transparent text-xs text-slate-200 font-mono w-full focus:outline-none truncate select-all"
                    />
                  </div>

                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors shadow-sm shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Invitation Link'}</span>
                  </button>
                </div>
              </div>

              {/* Copy Full Invitation Text */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleCopyFullInvitation}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-violet-400" />
                  <span>{copiedInvite ? 'Full Invitation Copied to Clipboard!' : 'Copy Full Zoom-Style Invitation'}</span>
                </button>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleJoinNow}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  <span>Start Meeting Now as Host</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
