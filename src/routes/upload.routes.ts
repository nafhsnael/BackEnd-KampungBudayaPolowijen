import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller';
import { uploadFile, uploadMultiple } from '../middlewares/upload.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Upload single media
 * Endpoint: POST /api/upload?folder=avatars
 * Form-Data: file=<binary>
 */
router.post('/', uploadFile, uploadController.uploadSingleMedia);

/**
 * Upload multiple media (misal galeri UMKM)
 * Endpoint: POST /api/upload/multiple?folder=umkm-gallery
 * Form-Data: files=<binary>[]
 */
router.post('/multiple', uploadMultiple('files', 10), uploadController.uploadMultipleMedia);

/**
 * Hapus media dari Vercel Blob
 * Endpoint: DELETE /api/upload
 * Body: { "url": "https://..." }
 * Wajib login
 */
router.delete('/', authMiddleware, uploadController.deleteMedia);

export default router;

