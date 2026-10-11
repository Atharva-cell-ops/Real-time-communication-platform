export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface Meeting {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  isLocked: boolean;
  passcode?: string | null;
  status: 'ACTIVE' | 'ENDED';
  hostId: string;
  host: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  endedAt?: string | null;
  _count?: {
    participants: number;
    messages: number;
    files: number;
  };
}

export interface Participant {
  socketId: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isSpeaking?: boolean;
  role?: 'HOST' | 'CO_HOST' | 'PARTICIPANT';
}

export interface Message {
  id: string;
  meetingId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  fileId?: string | null;
  file?: FileAttachment | null;
}

export interface FileAttachment {
  id: string;
  meetingId: string;
  uploaderId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  filePath: string;
  createdAt: string;
  uploader?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export interface WhiteboardStroke {
  id: string;
  tool: 'pen' | 'brush' | 'eraser' | 'line' | 'rectangle' | 'circle';
  color: string;
  size: number;
  points: { x: number; y: number }[];
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
}

export interface PeerConnectionState {
  peerId: string; // socketId
  userId: string;
  name: string;
  avatarUrl?: string | null;
  stream?: MediaStream;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  connectionState: RTCPeerConnectionState;
}

export interface MediaDeviceSettings {
  audioInputId: string;
  videoInputId: string;
  audioOutputId: string;
}
