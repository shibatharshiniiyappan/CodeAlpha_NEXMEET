import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Link as LinkIcon,
  FileText,
  UserPlus,
  Share2,
} from 'lucide-react';
import { Meeting } from '../types';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting | null;
  roomId: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  meeting,
  roomId,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);

  if (!isOpen) return null;

  const meetingCode = meeting?.code || roomId;
  const meetingTitle = meeting?.title || 'NEXMEET Collaborative Workspace';
  const meetingUrl = `${window.location.origin}/?room=${encodeURIComponent(meetingCode)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(meetingCode);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyFullInvitation = () => {
    const host = meeting?.hostName || 'Meeting Organizer';
    const text = `${host} is inviting you to a NEXMEET meeting.

Topic: ${meetingTitle}
Meeting ID: ${meetingCode}

Join Meeting:
${meetingUrl}

Click the link above or open NEXMEET and enter Meeting ID: ${meetingCode}`;

    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#111827] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Invite Participants</h2>
              <p className="text-xs text-slate-400">{meetingTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Meeting ID */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Meeting ID
            </label>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="font-mono text-xl font-bold text-cyan-300 tracking-wider">
                {meetingCode}
              </span>
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
              </button>
            </div>
          </div>

          {/* Invitation Link */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Invitation Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 min-w-0">
                <LinkIcon className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={meetingUrl}
                  className="bg-transparent text-xs text-slate-200 font-mono w-full focus:outline-none truncate select-all"
                />
              </div>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors shadow-sm shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Invitation Link'}</span>
              </button>
            </div>
          </div>

          {/* Copy Full Invitation */}
          <div className="pt-2">
            <button
              onClick={handleCopyFullInvitation}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-violet-400" />
              <span>{copiedInvite ? 'Full Invitation Copied!' : 'Copy Full Zoom-Style Invitation'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#111827] border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
