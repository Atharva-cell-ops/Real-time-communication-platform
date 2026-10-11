import { Response, NextFunction } from 'express';
import { FileService } from '../services/file.service.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { BadRequestError } from '../utils/errors.js';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';

export class FileController {
  static async uploadFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { meetingId } = req.body;
      if (!meetingId) {
        throw new BadRequestError('Meeting ID is required for file upload.');
      }
      if (!req.file) {
        throw new BadRequestError('No file uploaded or file rejected by validator.');
      }

      const fileAttachment = await FileService.createFileAttachment(
        meetingId,
        req.user!.id,
        req.file
      );

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully.',
        data: fileAttachment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMeetingFiles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const meetingId = req.params.meetingId as string;
      const files = await FileService.getMeetingFiles(meetingId);
      res.status(200).json({
        success: true,
        data: files,
      });
    } catch (error) {
      next(error);
    }
  }

  static async downloadFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const fileId = req.params.fileId as string;
      const fileRecord = await FileService.getFileById(fileId);
      const filePath = path.resolve(config.upload.dir, fileRecord.storedName);

      if (!fs.existsSync(filePath)) {
        throw new BadRequestError('File physically no longer exists on server.');
      }

      res.download(filePath, fileRecord.originalName);
    } catch (error) {
      next(error);
    }
  }
}
