import React, { useEffect, useRef } from 'react';
import { MicOff, Pin, PinOff, Monitor, Maximize2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface VideoTileProps {
  stream?: MediaStream | null;
  name: string;
  avatarUrl?: string | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing?: boolean;
  isSpeaking?: boolean;
  isLocal?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  name,
  avatarUrl,
  isMuted,
  isCameraOff,
  isScreenSharing = false,
  isSpeaking = false,
  isLocal = false,
  isPinned = false,
  onTogglePin,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideoTrack = stream && stream.getVideoTracks().length > 0 && !isCameraOff;

  return (
    <div
      className={clsx(
        'relative group rounded-2xl overflow-hidden bg-dark-900 border transition-all duration-300 flex items-center justify-center aspect-video w-full h-full shadow-lg',
        isSpeaking && !isMuted
          ? 'border-brand-500 shadow-brand-500/20 shadow-xl ring-2 ring-brand-500/60'
          : 'border-dark-800 hover:border-dark-700'
      )}
    >
      {/* Video Element */}
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Always mute local video playback to avoid acoustic feedback
          className={clsx(
            'w-full h-full object-cover transition-opacity duration-300',
            isLocal && !isScreenSharing && 'scale-x-[-1]', // Mirror local camera preview
            hasVideoTrack ? 'opacity-100' : 'opacity-0 absolute'
          )}
        />
      )}

      {/* Avatar Fallback when Camera is Off */}
      {!hasVideoTrack && (
        <div className="flex flex-col items-center justify-center gap-3 p-4 select-none">
          <div className="relative">
            <img
              src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`}
              alt={name}
              className={clsx(
                'w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 shadow-xl transition-all duration-300',
                isSpeaking && !isMuted
                  ? 'border-brand-400 scale-105 ring-4 ring-brand-500/30'
                  : 'border-dark-700 bg-dark-800'
              )}
            />
            {isMuted && (
              <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-rose-600 text-white shadow-md border-2 border-dark-900">
                <MicOff className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-300 max-w-[150px] truncate text-center">
            {name} {isLocal && '(You)'}
          </p>
        </div>
      )}

      {/* Name and State Pill Overlay */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-dark-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-xs text-white max-w-[80%]">
        <span className="truncate font-medium">
          {name} {isLocal && '(You)'}
        </span>
        {isScreenSharing && <Monitor className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
        {isMuted && <MicOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
      </div>

      {/* Action Overlay (Pin / Fullscreen) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {onTogglePin && (
          <button
            onClick={onTogglePin}
            className="p-1.5 rounded-lg bg-dark-950/80 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-dark-800 transition-colors"
            title={isPinned ? 'Unpin participant' : 'Pin participant'}
          >
            {isPinned ? <PinOff className="w-4 h-4 text-brand-400" /> : <Pin className="w-4 h-4" />}
          </button>
        )}
        {videoRef.current && (
          <button
            onClick={() => videoRef.current?.requestFullscreen()}
            className="p-1.5 rounded-lg bg-dark-950/80 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-dark-800 transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
