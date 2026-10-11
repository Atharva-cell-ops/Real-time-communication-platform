import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export class FileService {
  static async createFileAttachment(
    meetingId: string,
    uploaderId: string,
    file: Express.Multer.File
  ) {
    const attachment = await prisma.fileAttachment.create({
      data: {
        meetingId,
        uploaderId,
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        filePath: `/uploads/${file.filename}`,
      },
      include: {
        uploader: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return attachment;
  }

  static async getFileById(fileId: string) {
    const file = await prisma.fileAttachment.findUnique({
      where: { id: fileId },
      include: {
        uploader: {
          select: { id: true, name: true },
        },
      },
    });

    if (!file) {
      throw new NotFoundError('File attachment not found.');
    }

    return file;
  }

  static async getMeetingFiles(meetingId: string) {
    return await prisma.fileAttachment.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }
}
