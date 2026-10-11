import React from 'react';
import { X, Mic, MicOff, Video, VideoOff, Monitor, Shield, Volume2 } from 'lucide-react';
import { PeerConnectionState } from '../../types';
import { useAuth } from '../../context/AuthContext';

export interface ParticipantsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  peers: PeerConnectionState[];
  isLocalMuted: boolean;
  isLocalCameraOff: boolean;
  isLocalScreenSharing: boolean;
  isLocalSpeaking: boolean;
  hostId?: string;
}

export const ParticipantsDrawer: React.FC<ParticipantsDrawerProps> = ({
  isOpen,
  onClose,
  peers,
  isLocalMuted,
  isLocalCameraOff,
  isLocalScreenSharing,
  isLocalSpeaking,
  hostId,
}) => {
  const { user } = useAuth();

  if (!isOpen) return null;

  const totalCount = peers.length + 1;

  return (
    <div className="w-80 sm:w-96 h-full bg-dark-900 border-l border-dark-800 flex flex-col z-30 shadow-2xl transition-all animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-dark-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-100">Participants</h3>
          <span className="bg-brand-500/20 text-brand-300 text-xs px-2 py-0.5 rounded-full font-bold">
            {totalCount}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-dark-800 transition-colors"
          aria-label="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Local User Item */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-dark-950/60 border border-dark-800 hover:border-dark-700 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <img
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.name || 'You')}`}
                alt={user?.name}
                className={`w-9 h-9 rounded-full object-cover border ${
                  isLocalSpeaking && !isLocalMuted ? 'border-brand-400 ring-2 ring-brand-500/50' : 'border-dark-700'
                }`}
              />
              {isLocalSpeaking && !isLocalMuted && (
                <div className="absolute -bottom-1 -right-1 bg-brand-500 text-white rounded-full p-0.5">
                  <Volume2 className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.name} (You)</p>
                {hostId === user?.id && (
                  <span title="Meeting Host">
                    <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Local Status Icons */}
          <div className="flex items-center gap-1.5 text-slate-400">
            {isLocalScreenSharing && (
              <span title="Sharing screen">
                <Monitor className="w-3.5 h-3.5 text-brand-400" />
              </span>
            )}
            {isLocalMuted ? (
              <span title="Muted">
                <MicOff className="w-3.5 h-3.5 text-rose-400" />
              </span>
            ) : (
              <span title="Microphone on">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
              </span>
            )}
            {isLocalCameraOff ? (
              <span title="Camera off">
                <VideoOff className="w-3.5 h-3.5 text-rose-400" />
              </span>
            ) : (
              <span title="Camera on">
                <Video className="w-3.5 h-3.5 text-brand-400" />
              </span>
            )}
          </div>
        </div>

        {/* Remote Peers List */}
        {peers.map((peer) => (
          <div
            key={peer.peerId}
            className="flex items-center justify-between p-2.5 rounded-xl bg-dark-950/40 border border-dark-800 hover:border-dark-700 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <img
                  src={
                    peer.avatarUrl ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(peer.name)}`
                  }
                  alt={peer.name}
                  className={`w-9 h-9 rounded-full object-cover border ${
                    peer.isSpeaking && !peer.isMuted
                      ? 'border-brand-400 ring-2 ring-brand-500/50'
                      : 'border-dark-700'
                  }`}
                />
                {peer.isSpeaking && !peer.isMuted && (
                  <div className="absolute -bottom-1 -right-1 bg-brand-500 text-white rounded-full p-0.5">
                    <Volume2 className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-slate-200 truncate">{peer.name}</p>
                  {hostId === peer.userId && (
                    <span title="Meeting Host">
                      <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">Participant</span>
              </div>
            </div>

            {/* Remote Peer Status Icons */}
            <div className="flex items-center gap-1.5 text-slate-400">
              {peer.isScreenSharing && (
                <span title="Sharing screen">
                  <Monitor className="w-3.5 h-3.5 text-brand-400" />
                </span>
              )}
              {peer.isMuted ? (
                <span title="Muted">
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                </span>
              ) : (
                <span title="Microphone on">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                </span>
              )}
              {peer.isCameraOff ? (
                <span title="Camera off">
                  <VideoOff className="w-3.5 h-3.5 text-rose-400" />
                </span>
              ) : (
                <span title="Camera on">
                  <Video className="w-3.5 h-3.5 text-brand-400" />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
