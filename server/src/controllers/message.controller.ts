import { Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export class MessageController {
  static async getMeetingMessages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const meetingId = req.params.meetingId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const messages = await MessageService.getMeetingMessages(meetingId, limit);
      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const meetingId = req.params.meetingId as string;
      const { content, fileId } = req.body;
      const message = await MessageService.sendMessage(meetingId, req.user!.id, content, fileId);
      res.status(201).json({
        success: true,
        message: 'Message sent successfully.',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }
}
