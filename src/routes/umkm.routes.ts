import { Router } from 'express';
import { umkmController } from '../controllers/umkm.controller';
import { uploadImage } from '../middlewares/upload.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

// Public routes
router.get('/', umkmController.list);
router.get('/:id', umkmController.getById);

// Admin / protected routes (wajib login & role admin)
router.post('/', authMiddleware, requireAdmin, uploadImage, umkmController.create);
router.put('/:id', authMiddleware, requireAdmin, uploadImage, umkmController.update);
router.delete('/:id', authMiddleware, requireAdmin, umkmController.delete);

export default router;

