import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { uploadAvatar } from '../middlewares/upload.middleware';

const router = Router();
const controller = new AdminController();

// Semua route di bawah ini wajib login + role admin
router.use(authMiddleware, requireAdmin);

router.get('/dashboard/stats', controller.dashboardStats);
router.get('/users', controller.listUsers);
router.post('/users', uploadAvatar, controller.createUser);
router.get('/users/:id', controller.getUser);
router.put('/users/:id', uploadAvatar, controller.updateUser);
router.delete('/users/:id', controller.deleteUser);

// Endpoint khusus upload avatar user
router.post('/users/:id/avatar', uploadAvatar, controller.uploadAvatar);

export default router;
