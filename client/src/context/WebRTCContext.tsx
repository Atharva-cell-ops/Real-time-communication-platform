import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useToast } from './ToastContext';
import { Participant, PeerConnectionState } from '../types';

interface WebRTCContextType {
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  peers: PeerConnectionState[];
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isMediaReady: boolean;
  activeSpeakerSocketId: string | null;
  initMedia: (audioInputId?: string, videoInputId?: string) => Promise<MediaStream | null>;
  toggleAudio: () => void;
  toggleVideo: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  leaveRoom: () => void;
  joinMeetingRoom: (meetingId: string, meetingCode?: string) => void;
  activeMeetingId: string | null;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

// Free Google Public STUN servers
const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const { showToast } = useToast();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<PeerConnectionState[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isMediaReady, setIsMediaReady] = useState<boolean>(false);
  const [activeSpeakerSocketId, setActiveSpeakerSocketId] = useState<string | null>(null);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);

  // References for mutable peer connection tracking
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const activeMeetingIdRef = useRef<string | null>(null);
  const isMutedRef = useRef<boolean>(false);
  const isCameraOffRef = useRef<boolean>(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isCameraOffRef.current = isCameraOff;
  }, [isCameraOff]);

  // Initialize User's Camera and Microphone
  const initMedia = useCallback(async (audioInputId?: string, videoInputId?: string): Promise<MediaStream | null> => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: audioInputId ? { deviceId: { exact: audioInputId } } : true,
        video: videoInputId
          ? { deviceId: { exact: videoInputId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsMediaReady(true);
      return stream;
    } catch (err: any) {
      console.warn('[WebRTC Media Warning]:', err.name, err.message);
      // Fallback: try audio only if camera is unavailable or denied
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = audioOnlyStream;
        setLocalStream(audioOnlyStream);
        setIsCameraOff(true);
        setIsMediaReady(true);
        showToast('Camera unavailable. Connected with microphone only.', 'warning');
        return audioOnlyStream;
      } catch (audioErr: any) {
        console.error('[WebRTC Audio Fallback Error]:', audioErr);
        showToast('Microphone & camera access denied. You are in listen-only mode.', 'error');
        // Create an empty dummy stream
        const dummyStream = new MediaStream();
        localStreamRef.current = dummyStream;
        setLocalStream(dummyStream);
        setIsMuted(true);
        setIsCameraOff(true);
        setIsMediaReady(true);
        return dummyStream;
      }
    }
  }, [showToast]);

  // Create an RTCPeerConnection for a remote peer
  const createPeerConnection = useCallback(
    (targetSocketId: string, targetUserId: string, targetName: string, targetAvatar?: string | null): RTCPeerConnection => {
      // Close existing if duplicate
      if (peerConnectionsRef.current.has(targetSocketId)) {
        peerConnectionsRef.current.get(targetSocketId)?.close();
      }

      const pc = new RTCPeerConnection(ICE_CONFIG);
      peerConnectionsRef.current.set(targetSocketId, pc);

      // Add local media tracks to the peer connection
      const streamToUse = screenStreamRef.current || localStreamRef.current;
      if (streamToUse) {
        streamToUse.getTracks().forEach((track) => {
          pc.addTrack(track, streamToUse);
        });
      }

      // Handle ICE Candidates generated locally
      pc.onicecandidate = (event) => {
        if (event.candidate && socket?.connected) {
          socket.emit('webrtc:ice-candidate', {
            targetSocketId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Handle incoming remote media tracks
      pc.ontrack = (event) => {
        console.log(`[WebRTC ontrack] Track received from ${targetName} (${targetSocketId}):`, event.track.kind);
        const remoteStream = remoteStreamsRef.current.get(targetSocketId) || new MediaStream();
        remoteStream.addTrack(event.track);
        remoteStreamsRef.current.set(targetSocketId, remoteStream);

        setPeers((prev) => {
          const existing = prev.find((p) => p.peerId === targetSocketId);
          if (existing) {
            return prev.map((p) =>
              p.peerId === targetSocketId ? { ...p, stream: remoteStream } : p
            );
          }
          return [
            ...prev,
            {
              peerId: targetSocketId,
              userId: targetUserId,
              name: targetName,
              avatarUrl: targetAvatar,
              stream: remoteStream,
              isMuted: false,
              isCameraOff: false,
              isScreenSharing: false,
              isSpeaking: false,
              connectionState: pc.connectionState,
            },
          ];
        });
      };

      // Track connection state changes
      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC Connection State] ${targetName}: ${pc.connectionState}`);
        setPeers((prev) =>
          prev.map((p) =>
            p.peerId === targetSocketId ? { ...p, connectionState: pc.connectionState } : p
          )
        );
      };

      return pc;
    },
    [socket]
  );

  // Join meeting room and set up signaling listeners
  const joinMeetingRoom = useCallback(
    (meetingId: string, meetingCode?: string) => {
      setActiveMeetingId(meetingId);
      activeMeetingIdRef.current = meetingId;

      if (!socket || !isConnected) return;

      socket.emit('meeting:join', {
        meetingId,
        meetingCode,
        isMuted: isMutedRef.current,
        isCameraOff: isCameraOffRef.current,
      });
    },
    [socket, isConnected]
  );

  // Auto-emit join if socket connects while active meeting room is set
  useEffect(() => {
    if (socket?.connected && activeMeetingIdRef.current) {
      socket.emit('meeting:join', {
        meetingId: activeMeetingIdRef.current,
        isMuted: isMutedRef.current,
        isCameraOff: isCameraOffRef.current,
      });
    }
  }, [socket, isConnected]);

  // Toggle Microphone Mute
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !audioTracks[0].enabled;
        audioTracks.forEach((track) => {
          track.enabled = nextState;
        });
        setIsMuted(!nextState);
        socket?.emit('media:toggle', { isMuted: !nextState });
      }
    }
  }, [socket]);

  // Toggle Video Camera
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !videoTracks[0].enabled;
        videoTracks.forEach((track) => {
          track.enabled = nextState;
        });
        setIsCameraOff(!nextState);
        socket?.emit('media:toggle', { isCameraOff: !nextState });
      }
    }
  }, [socket]);

  // Start Screen Sharing
  const startScreenShare = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        showToast('Screen sharing is not supported in this browser.', 'error');
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);

      const screenVideoTrack = stream.getVideoTracks()[0];

      // Replace video tracks across all active peer connections
      peerConnectionsRef.current.forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenVideoTrack);
        }
      });

      // Handle user stopping screen share via browser floating UI
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };

      socket?.emit('media:toggle', { isScreenSharing: true });
      showToast('You are now sharing your screen.', 'info');
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        console.error('[Screen Share Error]:', err);
        showToast('Could not start screen sharing.', 'error');
      }
    }
  }, [socket, showToast]);

  // Stop Screen Sharing
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);

      // Revert back to local camera video track
      const cameraVideoTrack = localStreamRef.current?.getVideoTracks()[0] || null;
      peerConnectionsRef.current.forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender && cameraVideoTrack) {
          videoSender.replaceTrack(cameraVideoTrack);
        }
      });

      socket?.emit('media:toggle', { isScreenSharing: false });
    }
  }, [socket]);

  // Leave Room & Clean up all connections
  const leaveRoom = useCallback(() => {
    if (socket && activeMeetingIdRef.current) {
      socket.emit('meeting:leave');
    }

    // Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Stop screen stream
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
    }

    // Close and remove all peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    remoteStreamsRef.current.clear();
    pendingCandidatesRef.current.clear();

    setPeers([]);
    setIsScreenSharing(false);
    setIsMediaReady(false);
    setActiveMeetingId(null);
    activeMeetingIdRef.current = null;
  }, [socket]);

  // Setup Socket event listeners for WebRTC signaling
  useEffect(() => {
    if (!socket) return;

    // 1. Existing participants in the room: initiate SDP Offer to each
    const handleExistingParticipants = async (data: { participants: Participant[] }) => {
      console.log('[WebRTC Signaling] Existing participants:', data.participants);
      for (const p of data.participants) {
        if (p.socketId === socket.id) continue;

        const pc = createPeerConnection(p.socketId, p.userId, p.name, p.avatarUrl);

        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);

          socket.emit('webrtc:offer', {
            targetSocketId: p.socketId,
            offer,
          });
        } catch (err) {
          console.error('[WebRTC CreateOffer Error]:', err);
        }
      }
    };

    // 2. Incoming SDP Offer from existing peer
    const handleWebRTCOffer = async (data: {
      fromSocketId: string;
      fromUserId: string;
      fromName: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      console.log(`[WebRTC Signaling] Received Offer from ${data.fromName} (${data.fromSocketId})`);
      const pc = createPeerConnection(data.fromSocketId, data.fromUserId, data.fromName);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

        // Process any queued ICE candidates for this peer
        const queued = pendingCandidatesRef.current.get(data.fromSocketId) || [];
        for (const candidate of queued) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current.delete(data.fromSocketId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc:answer', {
          targetSocketId: data.fromSocketId,
          answer,
        });
      } catch (err) {
        console.error('[WebRTC HandleOffer Error]:', err);
      }
    };

    // 3. Incoming SDP Answer
    const handleWebRTCAnswer = async (data: {
      fromSocketId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      console.log(`[WebRTC Signaling] Received Answer from ${data.fromSocketId}`);
      const pc = peerConnectionsRef.current.get(data.fromSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

          // Process queued ICE candidates
          const queued = pendingCandidatesRef.current.get(data.fromSocketId) || [];
          for (const candidate of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidatesRef.current.delete(data.fromSocketId);
        } catch (err) {
          console.error('[WebRTC SetRemoteDescription (Answer) Error]:', err);
        }
      }
    };

    // 4. Incoming ICE Candidate
    const handleWebRTCIceCandidate = async (data: {
      fromSocketId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peerConnectionsRef.current.get(data.fromSocketId);
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('[WebRTC AddIceCandidate Error]:', err);
        }
      } else {
        // Queue candidate until remote description is set
        if (!pendingCandidatesRef.current.has(data.fromSocketId)) {
          pendingCandidatesRef.current.set(data.fromSocketId, []);
        }
        pendingCandidatesRef.current.get(data.fromSocketId)!.push(data.candidate);
      }
    };

    // 5. Participant joined
    const handleUserJoined = (data: { participant: Participant }) => {
      showToast(`${data.participant.name} joined the meeting.`, 'info');
      setPeers((prev) => {
        if (prev.some((p) => p.peerId === data.participant.socketId)) return prev;
        return [
          ...prev,
          {
            peerId: data.participant.socketId,
            userId: data.participant.userId,
            name: data.participant.name,
            avatarUrl: data.participant.avatarUrl,
            isMuted: data.participant.isMuted,
            isCameraOff: data.participant.isCameraOff,
            isScreenSharing: data.participant.isScreenSharing,
            isSpeaking: false,
            connectionState: 'new',
          },
        ];
      });
    };

    // 6. Participant left
    const handleUserLeft = (data: { socketId: string; userId: string }) => {
      const pc = peerConnectionsRef.current.get(data.socketId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(data.socketId);
      }
      remoteStreamsRef.current.delete(data.socketId);
      pendingCandidatesRef.current.delete(data.socketId);

      setPeers((prev) => prev.filter((p) => p.peerId !== data.socketId));
    };

    // 7. Media toggled by remote peer
    const handleMediaToggled = (data: {
      socketId: string;
      userId: string;
      isMuted: boolean;
      isCameraOff: boolean;
      isScreenSharing: boolean;
    }) => {
      setPeers((prev) =>
        prev.map((p) =>
          p.peerId === data.socketId
            ? {
                ...p,
                isMuted: data.isMuted,
                isCameraOff: data.isCameraOff,
                isScreenSharing: data.isScreenSharing,
              }
            : p
        )
      );
    };

    // 8. Speaking activity
    const handleUserSpeaking = (data: { socketId: string; userId: string; isSpeaking: boolean }) => {
      if (data.isSpeaking) {
        setActiveSpeakerSocketId(data.socketId);
      } else {
        setActiveSpeakerSocketId((prev) => (prev === data.socketId ? null : prev));
      }
      setPeers((prev) =>
        prev.map((p) => (p.peerId === data.socketId ? { ...p, isSpeaking: data.isSpeaking } : p))
      );
    };

    socket.on('meeting:existing-participants', handleExistingParticipants);
    socket.on('webrtc:offer', handleWebRTCOffer);
    socket.on('webrtc:answer', handleWebRTCAnswer);
    socket.on('webrtc:ice-candidate', handleWebRTCIceCandidate);
    socket.on('meeting:user-joined', handleUserJoined);
    socket.on('meeting:user-left', handleUserLeft);
    socket.on('media:user-toggled', handleMediaToggled);
    socket.on('presence:user-speaking', handleUserSpeaking);

    return () => {
      socket.off('meeting:existing-participants', handleExistingParticipants);
      socket.off('webrtc:offer', handleWebRTCOffer);
      socket.off('webrtc:answer', handleWebRTCAnswer);
      socket.off('webrtc:ice-candidate', handleWebRTCIceCandidate);
      socket.off('meeting:user-joined', handleUserJoined);
      socket.off('meeting:user-left', handleUserLeft);
      socket.off('media:user-toggled', handleMediaToggled);
      socket.off('presence:user-speaking', handleUserSpeaking);
    };
  }, [socket, createPeerConnection, showToast]);

  return (
    <WebRTCContext.Provider
      value={{
        localStream,
        screenStream,
        peers,
        isMuted,
        isCameraOff,
        isScreenSharing,
        isMediaReady,
        activeSpeakerSocketId,
        initMedia,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        leaveRoom,
        joinMeetingRoom,
        activeMeetingId,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTC = (): WebRTCContextType => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};
