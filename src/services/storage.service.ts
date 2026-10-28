import { put, del } from '@vercel/blob';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { envConfig } from '../config/env.config';
import { AppError, BadRequestError } from '../errors/app.error';

export interface BlobUploadResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

export interface UploadOptions {
  folder?: string;
  filenamePrefix?: string;
}

export class StorageService {
  private getToken(): string {
    const token = envConfig.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
    if (!token || token.includes('xxxxxxxx')) {
      throw new AppError(
        'Vercel Blob Storage token (BLOB_READ_WRITE_TOKEN) belum dikonfigurasi di file .env. ' +
        'Silakan buat database Blob di dashboard Vercel dan salin token ke .env.',
        500
      );
    }
    return token;
  }

  /**
   * Cek apakah URL yang diberikan berasal dari Vercel Blob Storage
   */
  isBlobUrl(url?: string | null): boolean {
    if (!url) return false;
    return url.includes('blob.vercel-storage.com') || url.includes('vercel-storage.com');
  }

  /**
   * Upload file dari Multer Memory Storage ke Vercel Blob Storage
   * @param file Express.Multer.File dari memoryStorage (req.file)
   * @param options Opsi folder dan prefix nama file
   */
  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions = {}
  ): Promise<BlobUploadResult> {
    if (!file || !file.buffer) {
      throw new BadRequestError('File tidak ditemukan atau format buffer kosong.');
    }

    const token = this.getToken();
    const folder = (options.folder || 'uploads').replace(/^\/+|\/+$/g, '');
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const prefix = options.filenamePrefix ? `${options.filenamePrefix}-` : '';
    const safeUniqueName = `${prefix}${Date.now()}-${uuidv4()}${ext}`;
    const pathname = `${folder}/${safeUniqueName}`;

    try {
      const blob = await put(pathname, file.buffer, {
        access: 'public',
        token,
        contentType: file.mimetype,
      });

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        size: file.size,
      };
    } catch (error: any) {
      console.error('❌ Error uploading to Vercel Blob:', error);
      throw new AppError(`Gagal mengunggah file ke Vercel Blob Storage: ${error.message || error}`, 500);
    }
  }

  /**
   * Upload Buffer langsung ke Vercel Blob Storage
   */
  async uploadBuffer(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'uploads'
  ): Promise<BlobUploadResult> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestError('Buffer kosong.');
    }

    const token = this.getToken();
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    const ext = path.extname(originalName).toLowerCase() || '.bin';
    const safeUniqueName = `${Date.now()}-${uuidv4()}${ext}`;
    const pathname = `${cleanFolder}/${safeUniqueName}`;

    try {
      const blob = await put(pathname, buffer, {
        access: 'public',
        token,
        contentType: mimeType,
      });

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        size: buffer.length,
      };
    } catch (error: any) {
      console.error('❌ Error uploading buffer to Vercel Blob:', error);
      throw new AppError(`Gagal mengunggah buffer ke Vercel Blob Storage: ${error.message || error}`, 500);
    }
  }

  /**
   * Hapus file dari Vercel Blob Storage berdasarkan URL lengkap
   * Aman dipanggil meskipun URL null / undefined / bukan dari Vercel Blob
   */
  async deleteFile(fileUrl?: string | null): Promise<boolean> {
    if (!fileUrl) return false;

    // Jika bukan URL Vercel Blob (misal placeholder lokal atau URL eksternal lainnya), abaikan
    if (!this.isBlobUrl(fileUrl)) {
      return false;
    }

    try {
      const token = this.getToken();
      await del(fileUrl, { token });
      return true;
    } catch (error: any) {
      // Log peringatan tanpa menghentikan flow utama controller (safe deletion)
      console.warn(`⚠️ Peringatan: Gagal menghapus file dari Vercel Blob (${fileUrl}):`, error.message || error);
      return false;
    }
  }
}

export const storageService = new StorageService();

