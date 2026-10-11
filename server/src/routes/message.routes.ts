import { Router } from 'express';
import { MessageController } from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);

router.get('/:meetingId', MessageController.getMeetingMessages);
router.post('/:meetingId', MessageController.sendMessage);

export default router;
