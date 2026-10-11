import { Response, NextFunction } from 'express';
import { MeetingService } from '../services/meeting.service.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export class MeetingController {
  static async createMeeting(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const meeting = await MeetingService.createMeeting(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Meeting created successfully.',
        data: meeting,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMeeting(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const identifier = req.params.identifier as string;
      const meeting = await MeetingService.getMeeting(identifier);
      res.status(200).json({
        success: true,
        data: meeting,
      });
    } catch (error) {
      next(error);
    }
  }

  static async joinMeeting(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const identifier = req.params.identifier as string;
      const { passcode } = req.body;
      const meeting = await MeetingService.joinMeeting(identifier, req.user!.id, passcode);
      res.status(200).json({
        success: true,
        message: 'Joined meeting successfully.',
        data: meeting,
      });
    } catch (error) {
      next(error);
    }
  }

  static async leaveMeeting(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const identifier = req.params.identifier as string;
      await MeetingService.leaveMeeting(identifier, req.user!.id);
      res.status(200).json({
        success: true,
        message: 'Left meeting successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserMeetings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const meetings = await MeetingService.getUserMeetings(req.user!.id);
      res.status(200).json({
        success: true,
        data: meetings,
      });
    } catch (error) {
      next(error);
    }
  }

  static async endMeeting(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const identifier = req.params.identifier as string;
      const meeting = await MeetingService.endMeeting(identifier, req.user!.id);
      res.status(200).json({
        success: true,
        message: 'Meeting ended successfully.',
        data: meeting,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMeeting(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const identifier = req.params.identifier as string;
      const updated = await MeetingService.updateMeeting(identifier, req.user!.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Meeting settings updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
