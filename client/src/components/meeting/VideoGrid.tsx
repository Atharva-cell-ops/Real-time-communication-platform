import React, { useState } from 'react';
import { VideoTile } from './VideoTile';
import { PeerConnectionState } from '../../types';
import { useAuth } from '../../context/AuthContext';

export interface VideoGridProps {
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isLocalSpeaking: boolean;
  peers: PeerConnectionState[];
  isWhiteboardOpen?: boolean;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  localStream,
  screenStream,
  isMuted,
  isCameraOff,
  isScreenSharing,
  isLocalSpeaking,
  peers,
  isWhiteboardOpen = false,
}) => {
  const { user } = useAuth();
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);

  // If someone is screen sharing or whiteboard is open, prioritize layout
  const screenSharingPeer = peers.find((p) => p.isScreenSharing);
  const isAnyScreenSharing = isScreenSharing || !!screenSharingPeer;

  const totalParticipants = peers.length + 1; // peers + local user

  // Grid column calculation for regular grid mode
  const getGridColsClass = () => {
    if (isWhiteboardOpen) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-h-48 overflow-y-auto';
    if (isAnyScreenSharing || pinnedPeerId) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

    if (totalParticipants === 1) return 'grid-cols-1 max-w-3xl mx-auto';
    if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto';
    if (totalParticipants <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-5xl mx-auto';
    if (totalParticipants <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  // Pinned or Screen Shared Main View
  const pinnedPeer = pinnedPeerId ? peers.find((p) => p.peerId === pinnedPeerId) : null;

  return (
    <div className="w-full h-full flex flex-col justify-center p-3 sm:p-4 gap-4 overflow-hidden">
      {/* Pinned / Spotlight / Screen Share Hero View */}
      {(pinnedPeer || screenSharingPeer || (isScreenSharing && screenStream)) && !isWhiteboardOpen && (
        <div className="w-full flex-1 max-h-[70vh] rounded-2xl overflow-hidden bg-dark-900 border border-dark-700 shadow-2xl flex items-center justify-center relative">
          {isScreenSharing && screenStream ? (
            <VideoTile
              stream={screenStream}
              name={`${user?.name || 'You'} (Screen)`}
              avatarUrl={user?.avatarUrl}
              isMuted={isMuted}
              isCameraOff={false}
              isScreenSharing={true}
              isLocal={true}
              isPinned={true}
              onTogglePin={() => setPinnedPeerId(null)}
            />
          ) : screenSharingPeer ? (
            <VideoTile
              stream={screenSharingPeer.stream}
              name={`${screenSharingPeer.name} (Screen)`}
              avatarUrl={screenSharingPeer.avatarUrl}
              isMuted={screenSharingPeer.isMuted}
              isCameraOff={screenSharingPeer.isCameraOff}
              isScreenSharing={true}
              isSpeaking={screenSharingPeer.isSpeaking}
              isPinned={true}
              onTogglePin={() => setPinnedPeerId(null)}
            />
          ) : pinnedPeer ? (
            <VideoTile
              stream={pinnedPeer.stream}
              name={pinnedPeer.name}
              avatarUrl={pinnedPeer.avatarUrl}
              isMuted={pinnedPeer.isMuted}
              isCameraOff={pinnedPeer.isCameraOff}
              isScreenSharing={pinnedPeer.isScreenSharing}
              isSpeaking={pinnedPeer.isSpeaking}
              isPinned={true}
              onTogglePin={() => setPinnedPeerId(null)}
            />
          ) : null}
        </div>
      )}

      {/* Dynamic Tiles Grid */}
      <div
        className={`w-full grid gap-3 sm:gap-4 items-center justify-center transition-all duration-300 ${getGridColsClass()}`}
      >
        {/* Local User Tile */}
        {(!pinnedPeerId || pinnedPeerId !== 'local') && (
          <div className="w-full">
            <VideoTile
              stream={localStream}
              name={user?.name || 'You'}
              avatarUrl={user?.avatarUrl}
              isMuted={isMuted}
              isCameraOff={isCameraOff}
              isScreenSharing={false}
              isSpeaking={isLocalSpeaking}
              isLocal={true}
              isPinned={pinnedPeerId === 'local'}
              onTogglePin={() => setPinnedPeerId(pinnedPeerId === 'local' ? null : 'local')}
            />
          </div>
        )}

        {/* Remote Peer Tiles */}
        {peers.map((peer) => {
          if (pinnedPeerId === peer.peerId && !isWhiteboardOpen && !isAnyScreenSharing) {
            return null; // Already rendered in hero view above
          }

          return (
            <div key={peer.peerId} className="w-full">
              <VideoTile
                stream={peer.stream}
                name={peer.name}
                avatarUrl={peer.avatarUrl}
                isMuted={peer.isMuted}
                isCameraOff={peer.isCameraOff}
                isScreenSharing={peer.isScreenSharing}
                isSpeaking={peer.isSpeaking}
                isLocal={false}
                isPinned={pinnedPeerId === peer.peerId}
                onTogglePin={() => setPinnedPeerId(pinnedPeerId === peer.peerId ? null : peer.peerId)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
