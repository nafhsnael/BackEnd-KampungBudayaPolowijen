import { Router } from 'express';
import { eventController } from '../controllers/event.controller';
import { uploadPoster } from '../middlewares/upload.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { CreateEventSchema, UpdateEventSchema } from '../dtos/event.dto';

const router = Router();

// Public routes
router.get('/', eventController.list);
router.get('/:id', eventController.getById);

// Admin / protected routes (wajib login & role admin)
router.post('/', authMiddleware, requireAdmin, uploadPoster, validateBody(CreateEventSchema), eventController.create);
router.put('/:id', authMiddleware, requireAdmin, uploadPoster, validateBody(UpdateEventSchema), eventController.update);
router.delete('/:id', authMiddleware, requireAdmin, eventController.delete);

export default router;

