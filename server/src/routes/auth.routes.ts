import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../validations/auth.validation.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', validateRequest({ body: registerSchema }), AuthController.register);
router.post('/login', validateRequest({ body: loginSchema }), AuthController.login);
router.get('/me', requireAuth, AuthController.getMe);
router.patch('/profile', requireAuth, validateRequest({ body: updateProfileSchema }), AuthController.updateProfile);

export default router;
