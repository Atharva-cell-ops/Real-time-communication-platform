import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { config } from '../config/index.js';
import { MessageService } from '../services/message.service.js';
import { MeetingService } from '../services/meeting.service.js';
import { prisma } from '../config/prisma.js';

interface RoomParticipant {
  socketId: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isSpeaking?: boolean;
}

export interface RTCSessionDescriptionPayload {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp?: string;
}

export interface RTCIceCandidatePayload {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}

// In-memory room state for high-performance real-time synchronization
const roomParticipants = new Map<string, Map<string, RoomParticipant>>();
const roomWhiteboards = new Map<string, any[]>();

export const initSocketServer = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication error: Token not provided.'));
      }

      const decoded: TokenPayload = verifyToken(token);
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Authentication error: Invalid or expired token.'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as TokenPayload;
    console.log(`[Socket Connected]: ${socket.id} (User: ${user.name}, ID: ${user.userId})`);

    // 1. Join Meeting Room
    socket.on('meeting:join', async (data: {
      meetingId: string;
      meetingCode?: string;
      isMuted?: boolean;
      isCameraOff?: boolean;
    }) => {
      const { meetingId } = data;
      const roomName = `meeting:${meetingId}`;

      socket.join(roomName);
      socket.data.meetingId = meetingId;

      if (!roomParticipants.has(meetingId)) {
        roomParticipants.set(meetingId, new Map());
      }

      const participant: RoomParticipant = {
        socketId: socket.id,
        userId: user.userId,
        name: user.name,
        isMuted: data.isMuted ?? false,
        isCameraOff: data.isCameraOff ?? false,
        isScreenSharing: false,
        isSpeaking: false,
      };

      const currentRoom = roomParticipants.get(meetingId)!;
      
      // Existing participants in the room before this joiner
      const existingParticipants = Array.from(currentRoom.values());
      currentRoom.set(socket.id, participant);

      // Send existing participants to the new joiner
      socket.emit('meeting:existing-participants', {
        participants: existingParticipants,
      });

      // Broadcast new participant to everyone else in the room
      socket.to(roomName).emit('meeting:user-joined', {
        participant,
      });

      console.log(`[Meeting Join] User ${user.name} joined room ${meetingId}. Active count: ${currentRoom.size}`);
    });

    // 2. WebRTC Mesh Signaling: Forward SDP Offer
    socket.on('webrtc:offer', (data: {
      targetSocketId: string;
      offer: RTCSessionDescriptionPayload;
    }) => {
      io.to(data.targetSocketId).emit('webrtc:offer', {
        fromSocketId: socket.id,
        fromUserId: user.userId,
        fromName: user.name,
        offer: data.offer,
      });
    });

    // 3. WebRTC Mesh Signaling: Forward SDP Answer
    socket.on('webrtc:answer', (data: {
      targetSocketId: string;
      answer: RTCSessionDescriptionPayload;
    }) => {
      io.to(data.targetSocketId).emit('webrtc:answer', {
        fromSocketId: socket.id,
        answer: data.answer,
      });
    });

    // 4. WebRTC Mesh Signaling: Forward ICE Candidate
    socket.on('webrtc:ice-candidate', (data: {
      targetSocketId: string;
      candidate: RTCIceCandidatePayload;
    }) => {
      io.to(data.targetSocketId).emit('webrtc:ice-candidate', {
        fromSocketId: socket.id,
        candidate: data.candidate,
      });
    });

    // 5. Media State Toggle (Mic, Camera, ScreenShare)
    socket.on('media:toggle', (data: {
      isMuted?: boolean;
      isCameraOff?: boolean;
      isScreenSharing?: boolean;
    }) => {
      const meetingId = socket.data.meetingId;
      if (!meetingId || !roomParticipants.has(meetingId)) return;

      const room = roomParticipants.get(meetingId)!;
      const participant = room.get(socket.id);
      if (participant) {
        if (data.isMuted !== undefined) participant.isMuted = data.isMuted;
        if (data.isCameraOff !== undefined) participant.isCameraOff = data.isCameraOff;
        if (data.isScreenSharing !== undefined) participant.isScreenSharing = data.isScreenSharing;

        io.to(`meeting:${meetingId}`).emit('media:user-toggled', {
          socketId: socket.id,
          userId: user.userId,
          isMuted: participant.isMuted,
          isCameraOff: participant.isCameraOff,
          isScreenSharing: participant.isScreenSharing,
        });
      }
    });

    // 6. Real-Time Chat Message
    socket.on('chat:send', async (data: {
      meetingId: string;
      content: string;
      fileId?: string;
    }) => {
      try {
        const message = await MessageService.sendMessage(
          data.meetingId,
          user.userId,
          data.content,
          data.fileId
        );

        io.to(`meeting:${data.meetingId}`).emit('chat:received', {
          message,
        });
      } catch (err) {
        console.error('[Socket Chat Error]:', err);
        socket.emit('chat:error', { message: 'Failed to send message.' });
      }
    });

    // 7. Collaborative Whiteboard: Draw Stroke
    socket.on('whiteboard:draw-stroke', (data: {
      meetingId: string;
      stroke: any;
    }) => {
      const { meetingId, stroke } = data;
      if (!roomWhiteboards.has(meetingId)) {
        roomWhiteboards.set(meetingId, []);
      }
      const strokes = roomWhiteboards.get(meetingId)!;
      strokes.push(stroke);

      // Keep maximum 3000 strokes in memory buffer
      if (strokes.length > 3000) {
        strokes.shift();
      }

      // Broadcast stroke to everyone else in the room
      socket.to(`meeting:${meetingId}`).emit('whiteboard:stroke-added', { stroke });
    });

    // 8. Collaborative Whiteboard: Clear Board
    socket.on('whiteboard:clear', (data: { meetingId: string }) => {
      const { meetingId } = data;
      roomWhiteboards.set(meetingId, []);
      io.to(`meeting:${meetingId}`).emit('whiteboard:cleared');
    });

    // 9. Collaborative Whiteboard: Request Initial State
    socket.on('whiteboard:request-state', async (data: { meetingId: string }) => {
      const { meetingId } = data;
      let strokes = roomWhiteboards.get(meetingId);
      if (!strokes) {
        // Fallback to database session if exists
        try {
          const session = await prisma.whiteboardSession.findUnique({
            where: { meetingId },
          });
          strokes = session ? JSON.parse(session.drawData || '[]') : [];
          roomWhiteboards.set(meetingId, strokes || []);
        } catch {
          strokes = [];
        }
      }
      socket.emit('whiteboard:sync-state', { strokes: strokes || [] });
    });

    // 10. Presence & Audio Level Activity
    socket.on('presence:speaking', (data: { isSpeaking: boolean }) => {
      const meetingId = socket.data.meetingId;
      if (!meetingId) return;

      socket.to(`meeting:${meetingId}`).emit('presence:user-speaking', {
        socketId: socket.id,
        userId: user.userId,
        isSpeaking: data.isSpeaking,
      });
    });

    // 11. Handle Leave & Disconnection
    const handleDisconnect = async () => {
      const meetingId = socket.data.meetingId;
      if (!meetingId) return;

      const room = roomParticipants.get(meetingId);
      if (room && room.has(socket.id)) {
        room.delete(socket.id);
        const remainingCount = room.size;

        // Broadcast to other peers to clean up their WebRTC peer connection
        io.to(`meeting:${meetingId}`).emit('meeting:user-left', {
          socketId: socket.id,
          userId: user.userId,
        });

        // Update database participant status
        try {
          await MeetingService.leaveMeeting(meetingId, user.userId);
        } catch (err) {
          console.error('[DB Participant Leave Error]:', err);
        }

        // If room is empty, persist whiteboard to DB and clean memory
        if (remainingCount === 0) {
          const strokes = roomWhiteboards.get(meetingId);
          if (strokes && strokes.length > 0) {
            try {
              await prisma.whiteboardSession.upsert({
                where: { meetingId },
                update: { drawData: JSON.stringify(strokes) },
                create: { meetingId, drawData: JSON.stringify(strokes) },
              });
            } catch (err) {
              console.error('[DB Whiteboard Persist Error]:', err);
            }
          }
          roomParticipants.delete(meetingId);
          roomWhiteboards.delete(meetingId);
        }

        console.log(`[Meeting Leave] User ${user.name} left ${meetingId}. Remaining: ${remainingCount}`);
      }
    };

    socket.on('meeting:leave', handleDisconnect);
    socket.on('disconnect', handleDisconnect);
  });

  return io;
};
