import { prisma } from '../config/prisma.js';

export class MessageService {
  static async sendMessage(meetingId: string, senderId: string, content: string, fileId?: string) {
    const message = await prisma.message.create({
      data: {
        meetingId,
        senderId,
        content,
        fileId,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
        file: true,
      },
    });

    return message;
  }

  static async getMeetingMessages(meetingId: string, limit = 100) {
    const messages = await prisma.message.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
        file: true,
      },
    });

    return messages;
  }
}
