import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Copy, Check, Link2, KeyRound } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingCode: string;
  passcode?: string | null;
  title: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  meetingCode,
  passcode,
  title,
}) => {
  const { showToast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const meetingUrl = `${window.location.origin}/room/${meetingCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopiedLink(true);
    showToast('Meeting link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(meetingCode);
    setCopiedCode(true);
    showToast('Meeting code copied!', 'success');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Participants" maxWidth="md">
      <div className="space-y-5">
        <p className="text-xs text-slate-400">
          Share this link or code with team members so they can join <strong className="text-slate-200">"{title}"</strong>.
        </p>

        {/* Meeting Link Card */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-brand-400" />
            Meeting Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-dark-950 border border-dark-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono truncate select-all">
              {meetingUrl}
            </div>
            <Button
              variant={copiedLink ? 'success' : 'primary'}
              size="sm"
              onClick={handleCopyLink}
              leftIcon={copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copiedLink ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Meeting Code Card */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-brand-400" />
            Meeting Code
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-dark-950 border border-dark-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-brand-300 font-mono tracking-wider select-all">
              {meetingCode}
            </div>
            <Button
              variant={copiedCode ? 'success' : 'secondary'}
              size="sm"
              onClick={handleCopyCode}
              leftIcon={copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copiedCode ? 'Copied' : 'Copy Code'}
            </Button>
          </div>
        </div>

        {/* Passcode (if any) */}
        {passcode && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
            <span className="text-xs font-medium text-amber-200">Meeting Passcode Required:</span>
            <span className="font-mono text-sm font-bold text-amber-300 bg-dark-950 px-2.5 py-1 rounded-lg border border-amber-500/30">
              {passcode}
            </span>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
