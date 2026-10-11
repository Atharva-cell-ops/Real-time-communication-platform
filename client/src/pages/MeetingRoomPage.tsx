import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../context/WebRTCContext';
import { useToast } from '../context/ToastContext';
import { useAudioAnalyser } from '../hooks/useAudioAnalyser';
import { meetingApi } from '../api/meeting';
import { Meeting } from '../types';
import { VideoGrid } from '../components/meeting/VideoGrid';
import { MeetingControls } from '../components/meeting/MeetingControls';
import { ChatDrawer } from '../components/chat/ChatDrawer';
import { ParticipantsDrawer } from '../components/meeting/ParticipantsDrawer';
import { WhiteboardCanvas } from '../components/whiteboard/WhiteboardCanvas';
import { DeviceSettingsModal } from '../components/meeting/DeviceSettingsModal';
import { InviteModal } from '../components/meeting/InviteModal';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import {
  ShieldCheck,
  Radio,
  Lock,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Video,
} from 'lucide-react';

export const MeetingRoomPage: React.FC = () => {
  const { meetingCode } = useParams<{ meetingCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const {
    localStream,
    screenStream,
    peers,
    isMuted,
    isCameraOff,
    isScreenSharing,
    initMedia,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    joinMeetingRoom,
    leaveRoom,
  } = useWebRTC();

  // Audio Analyser to monitor local speech
  const { isSpeaking: isLocalSpeaking } = useAudioAnalyser(localStream, isMuted);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Passcode modal state if room requires key
  const [isPasscodeRequired, setIsPasscodeRequired] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);

  // UI Panels state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // Callback refs to decouple effects from function reference churn
  const initMediaRef = useRef(initMedia);
  const joinMeetingRoomRef = useRef(joinMeetingRoom);
  const leaveRoomRef = useRef(leaveRoom);

  useEffect(() => {
    initMediaRef.current = initMedia;
    joinMeetingRoomRef.current = joinMeetingRoom;
    leaveRoomRef.current = leaveRoom;
  });

  // Load meeting data
  const loadMeeting = useCallback(async (code: string, passcode?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await meetingApi.joinMeeting(code, passcode);
      setMeeting(res.data);
      setIsPasscodeRequired(false);

      // Initialize media and join signaling room
      await initMediaRef.current();
      joinMeetingRoomRef.current(res.data.id, res.data.code);
    } catch (err: any) {
      if (err.message?.includes('passcode') || err.message?.includes('Forbidden')) {
        setIsPasscodeRequired(true);
      } else {
        setError(err.message || 'Could not join meeting.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (meetingCode) {
      loadMeeting(meetingCode);
    }

    return () => {
      leaveRoomRef.current();
    };
  }, [meetingCode, loadMeeting]);

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPasscode.trim() || !meetingCode) return;

    setIsVerifyingPasscode(true);
    try {
      await loadMeeting(meetingCode, enteredPasscode.trim());
    } catch (err: any) {
      showToast(err.message || 'Invalid passcode.', 'error');
    } finally {
      setIsVerifyingPasscode(false);
    }
  };

  const handleLeaveMeeting = () => {
    leaveRoom();
    showToast('You have left the meeting.', 'info');
    navigate('/dashboard');
  };

  const handleEndMeeting = async () => {
    if (!meeting) return;
    if (window.confirm('Are you sure you want to end this meeting for all participants?')) {
      try {
        await meetingApi.endMeeting(meeting.id);
        leaveRoom();
        showToast('Meeting ended for all attendees.', 'info');
        navigate('/dashboard');
      } catch (err: any) {
        showToast(err.message || 'Failed to end meeting.', 'error');
      }
    }
  };

  const handleCopyCode = () => {
    if (meeting) {
      navigator.clipboard.writeText(meeting.code);
      setCopiedCode(true);
      showToast('Meeting code copied!', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-dark-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
        <p className="text-sm font-semibold text-slate-300">Connecting to CONNECTX room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-dark-950 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-dark-900 border border-dark-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-100">Unable to Join Meeting</h2>
            <p className="text-xs text-slate-400">{error}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button variant="primary" className="flex-1" onClick={() => meetingCode && loadMeeting(meetingCode)}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-dark-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Top Meeting Header */}
      <header className="h-14 px-4 sm:px-6 bg-dark-950/90 border-b border-dark-800/80 flex items-center justify-between z-20">
        {/* Left: Meeting Name & Code */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-100 max-w-[160px] sm:max-w-xs truncate">
              {meeting?.title}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="font-mono font-bold text-brand-300">{meeting?.code}</span>
              <button
                onClick={handleCopyCode}
                className="hover:text-slate-200 transition-colors p-0.5 rounded"
                title="Copy code"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Security Badge & Live Indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted WebRTC P2P</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dark-900 border border-dark-700 text-[11px] font-bold text-rose-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>
      </header>

      {/* Center Layout: VideoGrid / Whiteboard & Drawers */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Main Collaboration Canvas / Video Grid */}
        <div className="flex-1 flex overflow-hidden p-2 sm:p-4">
          {isWhiteboardOpen ? (
            <div className="w-full h-full flex flex-col gap-4">
              <div className="h-40 sm:h-48 w-full shrink-0">
                <VideoGrid
                  localStream={localStream}
                  screenStream={screenStream}
                  isMuted={isMuted}
                  isCameraOff={isCameraOff}
                  isScreenSharing={isScreenSharing}
                  isLocalSpeaking={isLocalSpeaking}
                  peers={peers}
                  isWhiteboardOpen={true}
                />
              </div>
              <div className="flex-1 w-full min-h-0">
                <WhiteboardCanvas
                  meetingId={meeting?.id || ''}
                  isOpen={isWhiteboardOpen}
                  onClose={() => setIsWhiteboardOpen(false)}
                />
              </div>
            </div>
          ) : (
            <VideoGrid
              localStream={localStream}
              screenStream={screenStream}
              isMuted={isMuted}
              isCameraOff={isCameraOff}
              isScreenSharing={isScreenSharing}
              isLocalSpeaking={isLocalSpeaking}
              peers={peers}
              isWhiteboardOpen={false}
            />
          )}
        </div>

        {/* Drawers */}
        <ParticipantsDrawer
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          peers={peers}
          isLocalMuted={isMuted}
          isLocalCameraOff={isCameraOff}
          isLocalScreenSharing={isScreenSharing}
          isLocalSpeaking={isLocalSpeaking}
          hostId={meeting?.hostId}
        />

        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setUnreadCount(0);
          }}
          meetingId={meeting?.id || ''}
          onNewMessage={() => setUnreadCount((c) => c + 1)}
        />
      </main>

      {/* Floating Bottom Meeting Controls */}
      <MeetingControls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        isWhiteboardOpen={isWhiteboardOpen}
        isChatOpen={isChatOpen}
        isParticipantsOpen={isParticipantsOpen}
        unreadMessagesCount={unreadCount}
        participantsCount={peers.length + 1}
        isHost={meeting?.hostId === user?.id}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
        onToggleWhiteboard={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          if (!isChatOpen) setUnreadCount(0);
        }}
        onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInvite={() => setIsInviteOpen(true)}
        onLeaveMeeting={handleLeaveMeeting}
        onEndMeeting={handleEndMeeting}
      />

      {/* Device Settings Modal */}
      <DeviceSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Invite Modal */}
      {meeting && (
        <InviteModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          meetingCode={meeting.code}
          passcode={meeting.passcode}
          title={meeting.title}
        />
      )}

      {/* Passcode Protection Modal */}
      <Modal
        isOpen={isPasscodeRequired}
        onClose={() => navigate('/dashboard')}
        title="Passcode Required"
        description="This meeting is password protected. Enter the passcode to join."
      >
        <form onSubmit={handlePasscodeSubmit} className="space-y-4">
          <Input
            label="Meeting Passcode"
            type="password"
            placeholder="Enter passcode"
            value={enteredPasscode}
            onChange={(e) => setEnteredPasscode(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            autoFocus
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isVerifyingPasscode}>
              Verify & Join
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
