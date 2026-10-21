import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();
const controller = new AdminController();

router.use(authMiddleware, requireAdmin);

router.get('/dashboard/stats', controller.dashboardStats);
router.get('/users', controller.listUsers);
router.post('/users', controller.createUser);
router.get('/users/:id', controller.getUser);
router.put('/users/:id', controller.updateUser);
router.delete('/users/:id', controller.deleteUser);

export default router;
