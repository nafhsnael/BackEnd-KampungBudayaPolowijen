import { storageService, BlobUploadResult, UploadOptions } from '../services/storage.service';

/**
 * Helper function untuk mengunggah file Multer ke Vercel Blob Storage
 * @param file Objek Express.Multer.File yang disimpan di memory storage
 * @param options Opsi folder (default: 'uploads') dan prefix
 */
export async function uploadToBlob(
  file: Express.Multer.File,
  options?: UploadOptions
): Promise<BlobUploadResult> {
  return storageService.uploadFile(file, options);
}

/**
 * Helper function untuk menghapus file dari Vercel Blob Storage berdasarkan URL
 * @param url URL publik file Vercel Blob
 */
export async function deleteFromBlob(url?: string | null): Promise<boolean> {
  return storageService.deleteFile(url);
}

/**
 * Helper function untuk mengecek apakah URL merupakan URL Vercel Blob
 */
export function isBlobStorageUrl(url?: string | null): boolean {
  return storageService.isBlobUrl(url);
}

export { storageService, BlobUploadResult, UploadOptions };

