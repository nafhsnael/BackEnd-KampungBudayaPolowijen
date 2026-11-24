import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { uploadAvatar, uploadImage } from '../middlewares/upload.middleware';
import { packageController } from '../controllers/package.controller';
import { routineScheduleController } from '../controllers/routine-schedule.controller';

const router = Router();
const controller = new AdminController();

// Semua route di bawah ini wajib login + role admin
router.use(authMiddleware, requireAdmin);

router.get('/dashboard/stats', controller.dashboardStats);
router.get('/packages', packageController.list);
router.post('/packages', uploadImage, packageController.create);
router.put('/packages/:id', uploadImage, packageController.update);
router.delete('/packages/:id', packageController.delete);
router.get('/routine-schedules', routineScheduleController.list);
router.post('/routine-schedules', uploadImage, routineScheduleController.create);
router.put('/routine-schedules/:id', uploadImage, routineScheduleController.update);
router.delete('/routine-schedules/:id', routineScheduleController.delete);
router.get('/users', controller.listUsers);
router.post('/users', uploadAvatar, controller.createUser);
router.get('/users/:id', controller.getUser);
router.put('/users/:id', uploadAvatar, controller.updateUser);
router.delete('/users/:id', controller.deleteUser);

// Endpoint khusus upload avatar user
router.post('/users/:id/avatar', uploadAvatar, controller.uploadAvatar);

export default router;
