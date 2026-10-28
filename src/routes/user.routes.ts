import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { uploadAvatar } from '../middlewares/upload.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Semua route di bawah ini wajib terautentikasi (authMiddleware)
router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/profile/avatar', uploadAvatar, userController.uploadAvatar);

export default router;

