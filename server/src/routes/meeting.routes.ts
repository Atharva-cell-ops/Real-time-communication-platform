import { Router } from 'express';
import { MeetingController } from '../controllers/meeting.controller.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { createMeetingSchema, joinMeetingSchema, updateMeetingSchema } from '../validations/meeting.validation.js';

const router = Router();

router.use(requireAuth);

router.post('/', validateRequest({ body: createMeetingSchema }), MeetingController.createMeeting);
router.get('/my-meetings', MeetingController.getUserMeetings);
router.get('/:identifier', MeetingController.getMeeting);
router.post('/:identifier/join', validateRequest({ body: joinMeetingSchema }), MeetingController.joinMeeting);
router.post('/:identifier/leave', MeetingController.leaveMeeting);
router.post('/:identifier/end', MeetingController.endMeeting);
router.patch('/:identifier', validateRequest({ body: updateMeetingSchema }), MeetingController.updateMeeting);

export default router;
