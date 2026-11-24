import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { BadRequestError } from '../errors/app.error';

/**
 * Konfigurasi Multer dengan Memory Storage.
 * File TIDAK disimpan ke disk lokal (folder public/), melainkan langsung disimpan
 * di RAM sebagai Buffer (req.file.buffer) sehingga backend bersifat 100% stateless
 * dan siap di-stream ke layanan penyimpanan media.
 */
const memoryStorage = multer.memoryStorage();

// Batasan ukuran file (5 MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Daftar tipe MIME gambar yang diperbolehkan
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

/**
 * Filter validasi tipe file
 */
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new BadRequestError(
        `Format file "${file.mimetype}" tidak didukung. Hanya gambar (JPEG, PNG, WEBP, GIF, SVG) yang diperbolehkan.`
      )
    );
  }
};

/**
 * Base multer instance untuk Memory Storage
 */
export const memoryUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: imageFileFilter,
});

/**
 * Middleware untuk upload single file dengan nama field kustom
 */
export const uploadSingle = (fieldName: string = 'file') => memoryUpload.single(fieldName);

/**
 * Middleware untuk upload multiple files
 */
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 5) =>
  memoryUpload.array(fieldName, maxCount);

// ── Preset Middlewares Sesuai Kebutuhan Modul ───────────────────
export const uploadAvatar = uploadSingle('avatar');
export const uploadPoster = uploadSingle('poster');
export const uploadImage  = uploadSingle('image');
export const uploadFile   = uploadSingle('file');
export const uploadGallery = uploadMultiple('gallery', 8);

