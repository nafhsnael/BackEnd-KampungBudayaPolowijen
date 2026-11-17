import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { uploadAvatar } from '../middlewares/upload.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { UpdateProfileSchema } from '../dtos/user.dto';

const router = Router();

// Semua route di bawah ini wajib terautentikasi (authMiddleware)
router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', validateBody(UpdateProfileSchema), userController.updateProfile);
router.post('/profile/avatar', uploadAvatar, userController.uploadAvatar);

export default router;

