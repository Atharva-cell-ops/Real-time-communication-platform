import { prisma } from '../config/prisma.js';
import { generateMeetingCode } from '../utils/meetingCode.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { z } from 'zod';
import { createMeetingSchema, updateMeetingSchema } from '../validations/meeting.validation.js';

export class MeetingService {
  static async createMeeting(hostId: string, data: z.infer<typeof createMeetingSchema>) {
    let code = generateMeetingCode();
    // Ensure code uniqueness
    let exists = await prisma.meeting.findUnique({ where: { code } });
    while (exists) {
      code = generateMeetingCode();
      exists = await prisma.meeting.findUnique({ where: { code } });
    }

    const meeting = await prisma.meeting.create({
      data: {
        code,
        title: data.title,
        description: data.description,
        passcode: data.passcode,
        isLocked: data.isLocked || false,
        hostId,
        whiteboard: {
          create: {
            drawData: '[]',
          },
        },
        participants: {
          create: {
            userId: hostId,
            role: 'HOST',
          },
        },
      },
      include: {
        host: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        whiteboard: true,
      },
    });

    return meeting;
  }

  static async getMeeting(codeOrId: string) {
    const meeting = await prisma.meeting.findFirst({
      where: {
        OR: [{ id: codeOrId }, { code: codeOrId }],
      },
      include: {
        host: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        participants: {
          where: { leftAt: null },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        whiteboard: true,
        _count: {
          select: { participants: true, messages: true, files: true },
        },
      },
    });

    if (!meeting) {
      throw new NotFoundError(`Meeting with identifier "${codeOrId}" not found.`);
    }

    return meeting;
  }

  static async joinMeeting(codeOrId: string, userId: string, passcode?: string) {
    const meeting = await this.getMeeting(codeOrId);

    if (meeting.status === 'ENDED') {
      throw new BadRequestError('This meeting has already ended.');
    }

    if (meeting.isLocked && meeting.hostId !== userId) {
      throw new ForbiddenError('This meeting is currently locked by the host.');
    }

    if (meeting.passcode && meeting.passcode !== passcode && meeting.hostId !== userId) {
      throw new ForbiddenError('Incorrect meeting passcode.');
    }

    // Record or update participation
    const activeParticipation = await prisma.meetingParticipant.findFirst({
      where: {
        meetingId: meeting.id,
        userId,
        leftAt: null,
      },
    });

    if (!activeParticipation) {
      await prisma.meetingParticipant.create({
        data: {
          meetingId: meeting.id,
          userId,
          role: meeting.hostId === userId ? 'HOST' : 'PARTICIPANT',
        },
      });
    }

    return meeting;
  }

  static async leaveMeeting(meetingId: string, userId: string) {
    await prisma.meetingParticipant.updateMany({
      where: {
        meetingId,
        userId,
        leftAt: null,
      },
      data: {
        leftAt: new Date(),
      },
    });
  }

  static async getUserMeetings(userId: string) {
    const hosted = await prisma.meeting.findMany({
      where: { hostId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        host: {
          select: { id: true, name: true, avatarUrl: true },
        },
        _count: {
          select: { participants: true, messages: true },
        },
      },
      take: 20,
    });

    const attended = await prisma.meetingParticipant.findMany({
      where: {
        userId,
        meeting: {
          hostId: { not: userId },
        },
      },
      orderBy: { joinedAt: 'desc' },
      include: {
        meeting: {
          include: {
            host: {
              select: { id: true, name: true, avatarUrl: true },
            },
            _count: {
              select: { participants: true, messages: true },
            },
          },
        },
      },
      take: 20,
    });

    return {
      hosted,
      attended: attended.map((p) => p.meeting),
    };
  }

  static async endMeeting(meetingId: string, hostId: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundError('Meeting not found.');
    }

    if (meeting.hostId !== hostId) {
      throw new ForbiddenError('Only the host can end the meeting.');
    }

    const updated = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });

    // Close all open participant sessions
    await prisma.meetingParticipant.updateMany({
      where: {
        meetingId,
        leftAt: null,
      },
      data: {
        leftAt: new Date(),
      },
    });

    return updated;
  }

  static async updateMeeting(meetingId: string, hostId: string, data: z.infer<typeof updateMeetingSchema>) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundError('Meeting not found.');
    }

    if (meeting.hostId !== hostId) {
      throw new ForbiddenError('Only the host can modify meeting settings.');
    }

    return await prisma.meeting.update({
      where: { id: meetingId },
      data,
    });
  }
}
