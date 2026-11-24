import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { envConfig } from '../config/env.config';
import { storageService } from './storage.service';
import { AppError, BadRequestError } from '../errors/app.error';

export interface CloudinaryUploadOptions {
  folder: string;
  filenamePrefix: string;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

class CloudinaryStorageService {
  private configure(): void {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = envConfig;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new AppError(
        'Cloudinary belum dikonfigurasi. Isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET di backend .env.',
        500
      );
    }

    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    options: CloudinaryUploadOptions
  ): Promise<CloudinaryUploadResult> {
    if (!file?.buffer?.length) {
      throw new BadRequestError('File gambar tidak ditemukan atau kosong.');
    }

    this.configure();
    const folder = options.folder.replace(/^\/+|\/+$/g, '');
    const publicId = `${options.filenamePrefix}-${randomUUID()}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          overwrite: false,
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(new AppError(
              `Gagal mengunggah gambar ke Cloudinary${error?.message ? `: ${error.message}` : '.'}`,
              502
            ));
            return;
          }

          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );

      Readable.from([file.buffer]).pipe(uploadStream).on('error', (error: Error) => {
        reject(new AppError(`Gagal mengunggah gambar ke Cloudinary: ${error.message}`, 502));
      });
    });
  }

  isCloudinaryUrl(url?: string | null): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' &&
        parsed.hostname === 'res.cloudinary.com' &&
        parsed.pathname.includes('/image/upload/');
    } catch {
      return false;
    }
  }

  private getPublicId(url: string): string | null {
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/image\/upload\/v\d+\/(.+)$/);
      if (!match) return null;
      return match[1].replace(/\.[^/.]+$/, '');
    } catch {
      return null;
    }
  }

  async deleteFile(url?: string | null): Promise<boolean> {
    if (!url || !this.isCloudinaryUrl(url)) return false;

    const publicId = this.getPublicId(url);
    if (!publicId) return false;

    try {
      this.configure();
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true,
      });
      return result.result === 'ok';
    } catch (error) {
      console.warn(
        'Gagal menghapus gambar lama dari Cloudinary:',
        error instanceof Error ? error.message : 'Kesalahan tidak diketahui.'
      );
      return false;
    }
  }
}

export const cloudinaryStorageService = new CloudinaryStorageService();

export async function deleteStoredImage(url?: string | null): Promise<boolean> {
  if (!url) return false;
  if (cloudinaryStorageService.isCloudinaryUrl(url)) {
    return cloudinaryStorageService.deleteFile(url);
  }
  return storageService.deleteFile(url);
}
