import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { meetingApi, CreateMeetingDTO } from '../api/meeting';
import { Meeting } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import {
  Video,
  PlusCircle,
  LogIn,
  Calendar,
  Users,
  Copy,
  Check,
  Clock,
  Lock,
  Sparkles,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [hostedMeetings, setHostedMeetings] = useState<Meeting[]>([]);
  const [attendedMeetings, setAttendedMeetings] = useState<Meeting[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true);

  // Quick Join Code state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Create Meeting Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(
    (location.state as any)?.openCreateModal || false
  );
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetingPasscode, setMeetingPasscode] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Copied code feedback tracking
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setIsLoadingMeetings(true);
    try {
      const res = await meetingApi.getUserMeetings();
      setHostedMeetings(res.data.hosted || []);
      setAttendedMeetings(res.data.attended || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load meetings history.', 'error');
    } finally {
      setIsLoadingMeetings(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Start instant new meeting
  const handleStartInstantMeeting = async () => {
    setIsCreating(true);
    try {
      const title = `${user?.name || 'My'}'s Instant Meeting`;
      const res = await meetingApi.createMeeting({ title });
      showToast('Instant meeting created!', 'success');
      navigate(`/room/${res.data.code}`);
    } catch (err: any) {
      showToast(err.message || 'Could not create meeting.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Create customized meeting
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) {
      showToast('Please enter a meeting title.', 'warning');
      return;
    }

    setIsCreating(true);
    try {
      const data: CreateMeetingDTO = {
        title: meetingTitle.trim(),
        description: meetingDescription.trim() || undefined,
        passcode: meetingPasscode.trim() || undefined,
        isLocked,
      };

      const res = await meetingApi.createMeeting(data);
      showToast('Meeting created successfully!', 'success');
      setIsCreateModalOpen(false);
      setMeetingTitle('');
      setMeetingDescription('');
      setMeetingPasscode('');
      setIsLocked(false);
      navigate(`/room/${res.data.code}`);
    } catch (err: any) {
      showToast(err.message || 'Could not create meeting.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Join meeting with code
  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCodeInput.trim().toLowerCase();
    if (!code) return;

    setIsJoining(true);
    try {
      // Validate meeting exists first
      const res = await meetingApi.getMeeting(code);
      navigate(`/room/${res.data.code}`);
    } catch (err: any) {
      showToast(err.message || `No active meeting found for code: "${code}"`, 'error');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyMeetingCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(code);
    showToast(`Meeting code "${code}" copied to clipboard!`, 'info');
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dark-950 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 selection:bg-brand-500/30 selection:text-brand-200">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-dark-900 via-dark-850 to-brand-950/40 border border-dark-800 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>CONNECTX Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Launch an instant real-time conference, schedule a collaborative session, or join a live room.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <Button
            variant="primary"
            size="md"
            onClick={handleStartInstantMeeting}
            isLoading={isCreating}
            leftIcon={<Video className="w-4 h-4" />}
          >
            Instant Meeting
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Create Session
          </Button>
        </div>
      </div>

      {/* Quick Join Bar & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Join Meeting by Code Card */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
            <LogIn className="w-4 h-4 text-brand-400" />
            <h3>Join a Live Meeting</h3>
          </div>
          <p className="text-xs text-slate-400">
            Enter an invite code or meeting room ID shared by a host to join immediately.
          </p>
          <form onSubmit={handleJoinMeeting} className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="e.g. abc-defg-hij or team-sync-now"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!joinCodeInput.trim() || isJoining}
              isLoading={isJoining}
            >
              Join Room
            </Button>
          </form>
        </div>

        {/* User Stats Card */}
        <div className="p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Meetings</span>
            <Calendar className="w-4 h-4 text-brand-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-dark-950 rounded-2xl border border-dark-800">
              <p className="text-2xl font-extrabold text-brand-400">{hostedMeetings.length}</p>
              <p className="text-[11px] font-semibold text-slate-400">Hosted</p>
            </div>
            <div className="p-3 bg-dark-950 rounded-2xl border border-dark-800">
              <p className="text-2xl font-extrabold text-indigo-400">{attendedMeetings.length}</p>
              <p className="text-[11px] font-semibold text-slate-400">Attended</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hosted Meetings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Video className="w-4 h-4 text-brand-400" />
            Hosted Meetings
          </h2>
          <Button variant="ghost" size="sm" onClick={fetchMeetings}>
            Refresh
          </Button>
        </div>

        {isLoadingMeetings ? (
          <div className="flex items-center justify-center p-12 bg-dark-900 border border-dark-800 rounded-3xl">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : hostedMeetings.length === 0 ? (
          <div className="p-8 text-center bg-dark-900/60 border border-dark-800 rounded-3xl text-slate-400 space-y-3">
            <p className="text-sm font-semibold">You haven't hosted any meetings yet.</p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartInstantMeeting}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Start Your First Meeting
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hostedMeetings.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-dark-900 border border-dark-800 hover:border-brand-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-100 line-clamp-1 group-hover:text-brand-300 transition-colors">
                      {m.title}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                        m.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  {m.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{m.description}</p>
                  )}
                </div>

                <div className="space-y-3 pt-2 border-t border-dark-800 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-mono text-brand-300 font-bold bg-dark-950 px-2 py-1 rounded-lg border border-dark-700">
                      {m.code}
                    </span>
                    <button
                      onClick={() => handleCopyMeetingCode(m.code)}
                      className="p-1.5 hover:bg-dark-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                      title="Copy meeting code"
                    >
                      {copiedCodeId === m.code ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {m._count?.participants || 1} participant(s)
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/room/${m.code}`)}
                    rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                  >
                    Enter Meeting
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Meeting"
        description="Configure your meeting title and security preferences"
      >
        <form onSubmit={handleCreateMeeting} className="space-y-4">
          <Input
            label="Meeting Title"
            type="text"
            placeholder="e.g. Design Sprint & Tech Architecture Review"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Description (Optional)
            </label>
            <textarea
              placeholder="Provide context or agenda for participants..."
              value={meetingDescription}
              onChange={(e) => setMeetingDescription(e.target.value)}
              rows={3}
              className="w-full bg-dark-950 border border-dark-700 text-slate-100 rounded-xl px-4 py-2.5 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <Input
            label="Passcode (Optional)"
            type="text"
            placeholder="Leave empty for open access"
            value={meetingPasscode}
            onChange={(e) => setMeetingPasscode(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <div className="flex items-center gap-3 p-3 bg-dark-950 rounded-xl border border-dark-800">
            <input
              type="checkbox"
              id="isLocked"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="w-4 h-4 accent-brand-500 rounded cursor-pointer"
            />
            <label htmlFor="isLocked" className="text-xs text-slate-300 font-medium cursor-pointer">
              Lock meeting room (Only host can admit or invite guests)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-800">
            <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isCreating}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Create & Launch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
