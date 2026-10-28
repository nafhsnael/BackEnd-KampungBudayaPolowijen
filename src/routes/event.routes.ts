import { Router } from 'express';
import { eventController } from '../controllers/event.controller';
import { uploadPoster } from '../middlewares/upload.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

// Public routes
router.get('/', eventController.list);
router.get('/:id', eventController.getById);

// Admin / protected routes (wajib login & role admin)
router.post('/', authMiddleware, requireAdmin, uploadPoster, eventController.create);
router.put('/:id', authMiddleware, requireAdmin, uploadPoster, eventController.update);
router.delete('/:id', authMiddleware, requireAdmin, eventController.delete);

export default router;

