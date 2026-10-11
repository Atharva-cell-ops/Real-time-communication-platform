import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  PenTool,
  MessageSquare,
  Users,
  Settings,
  PhoneOff,
  UserPlus,
} from 'lucide-react';
import { clsx } from 'clsx';

export interface MeetingControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isWhiteboardOpen: boolean;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  unreadMessagesCount: number;
  participantsCount: number;
  isHost: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleWhiteboard: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onOpenSettings: () => void;
  onOpenInvite: () => void;
  onLeaveMeeting: () => void;
  onEndMeeting?: () => void;
}

export const MeetingControls: React.FC<MeetingControlsProps> = ({
  isMuted,
  isCameraOff,
  isScreenSharing,
  isWhiteboardOpen,
  isChatOpen,
  isParticipantsOpen,
  unreadMessagesCount,
  participantsCount,
  isHost,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleWhiteboard,
  onToggleChat,
  onToggleParticipants,
  onOpenSettings,
  onOpenInvite,
  onLeaveMeeting,
  onEndMeeting,
}) => {
  return (
    <div className="w-full flex items-center justify-between px-4 py-3 bg-dark-950/90 backdrop-blur-xl border-t border-dark-800/80 z-30 select-none">
      {/* Left Group: Info & Invite */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenInvite}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-900 border border-dark-700 hover:bg-dark-800 text-slate-200 text-xs font-semibold transition-all active:scale-95"
          title="Invite Participants"
        >
          <UserPlus className="w-4 h-4 text-brand-400" />
          <span className="hidden sm:inline">Invite</span>
        </button>
      </div>

      {/* Center Group: Primary Audio, Video, Screen, Whiteboard, End */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Microphone Toggle */}
        <button
          onClick={onToggleAudio}
          className={clsx(
            'p-3 rounded-2xl border transition-all duration-200 flex items-center justify-center active:scale-95 shadow-lg',
            isMuted
              ? 'bg-rose-600/90 hover:bg-rose-600 text-white border-rose-500/50 shadow-rose-600/20'
              : 'bg-dark-850 hover:bg-dark-700 text-slate-100 border-dark-700 shadow-dark-950/50'
          )}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={onToggleVideo}
          className={clsx(
            'p-3 rounded-2xl border transition-all duration-200 flex items-center justify-center active:scale-95 shadow-lg',
            isCameraOff
              ? 'bg-rose-600/90 hover:bg-rose-600 text-white border-rose-500/50 shadow-rose-600/20'
              : 'bg-dark-850 hover:bg-dark-700 text-slate-100 border-dark-700 shadow-dark-950/50'
          )}
          title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5 text-brand-400" />}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={onToggleScreenShare}
          className={clsx(
            'p-3 rounded-2xl border transition-all duration-200 flex items-center justify-center active:scale-95 shadow-lg',
            isScreenSharing
              ? 'bg-brand-600 hover:bg-brand-500 text-white border-brand-500 shadow-brand-500/30'
              : 'bg-dark-850 hover:bg-dark-700 text-slate-100 border-dark-700 shadow-dark-950/50'
          )}
          title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5 text-slate-300" />}
        </button>

        {/* Whiteboard Toggle */}
        <button
          onClick={onToggleWhiteboard}
          className={clsx(
            'p-3 rounded-2xl border transition-all duration-200 flex items-center justify-center active:scale-95 shadow-lg',
            isWhiteboardOpen
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-500/30'
              : 'bg-dark-850 hover:bg-dark-700 text-slate-100 border-dark-700 shadow-dark-950/50'
          )}
          title={isWhiteboardOpen ? 'Close whiteboard' : 'Open collaborative whiteboard'}
        >
          <PenTool className="w-5 h-5" />
        </button>

        {/* Leave / End Call */}
        <button
          onClick={onLeaveMeeting}
          className="px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-2 border border-rose-500/40 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
          title="Leave meeting"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden md:inline">Leave</span>
        </button>

        {isHost && onEndMeeting && (
          <button
            onClick={onEndMeeting}
            className="px-3 py-3 rounded-2xl bg-dark-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 font-semibold text-xs flex items-center gap-1.5 border border-dark-700 transition-all active:scale-95"
            title="End meeting for everyone"
          >
            <span className="hidden sm:inline">End All</span>
          </button>
        )}
      </div>

      {/* Right Group: Participants, Chat, Settings */}
      <div className="flex items-center gap-2">
        {/* Participants Drawer Button */}
        <button
          onClick={onToggleParticipants}
          className={clsx(
            'relative p-2.5 rounded-xl border transition-all active:scale-95',
            isParticipantsOpen
              ? 'bg-brand-600 text-white border-brand-500 shadow-brand-500/20'
              : 'bg-dark-900 hover:bg-dark-800 text-slate-300 border-dark-700'
          )}
          title="View participants"
        >
          <Users className="w-4 h-4" />
          <span className="absolute -top-1.5 -right-1.5 bg-brand-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-dark-900">
            {participantsCount}
          </span>
        </button>

        {/* Chat Drawer Button */}
        <button
          onClick={onToggleChat}
          className={clsx(
            'relative p-2.5 rounded-xl border transition-all active:scale-95',
            isChatOpen
              ? 'bg-brand-600 text-white border-brand-500 shadow-brand-500/20'
              : 'bg-dark-900 hover:bg-dark-800 text-slate-300 border-dark-700'
          )}
          title="In-meeting chat"
        >
          <MessageSquare className="w-4 h-4" />
          {unreadMessagesCount > 0 && !isChatOpen && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-dark-900 animate-bounce">
              {unreadMessagesCount}
            </span>
          )}
        </button>

        {/* Settings Modal Button */}
        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl bg-dark-900 hover:bg-dark-800 text-slate-300 border border-dark-700 transition-all active:scale-95"
          title="Audio & Video Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
