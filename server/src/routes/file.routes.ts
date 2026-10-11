import { Router } from 'express';
import { FileController } from '../controllers/file.controller.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(requireAuth);

router.post('/upload', upload.single('file'), FileController.uploadFile);
router.get('/meeting/:meetingId', FileController.getMeetingFiles);
router.get('/download/:fileId', FileController.downloadFile);

export default router;
