import { Request, Response, NextFunction } from 'express';
import { storageService } from '../services/storage.service';
import { ApiResponse } from '../utils/response.util';
import { BadRequestError } from '../errors/app.error';

export class UploadController {
  /**
   * Upload single media (gambar / avatar / poster) ke Vercel Blob Storage
   * Route: POST /api/upload?folder=umkm|events|avatars
   */
  uploadSingleMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError('Tidak ada file yang diunggah. Kirim file pada field multipart/form-data.');
      }

      // Tentukan sub-folder Vercel Blob dari query param (misal: folder=umkm, folder=events)
      const folder = (req.query.folder as string) || 'uploads';

      const result = await storageService.uploadFile(req.file, {
        folder,
        filenamePrefix: req.query.prefix as string | undefined,
      });

      ApiResponse.success({
        res,
        statusCode: 201,
        message: 'File berhasil diunggah ke Vercel Blob Storage',
        data: {
          url: result.url,
          pathname: result.pathname,
          contentType: result.contentType,
          size: result.size,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload multiple media sekaligus (misal galeri UMKM) ke Vercel Blob Storage
   * Route: POST /api/upload/multiple?folder=umkm-gallery
   */
  uploadMultipleMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        throw new BadRequestError('Tidak ada file yang diunggah.');
      }

      const folder = (req.query.folder as string) || 'gallery';

      const uploadPromises = files.map((file) =>
        storageService.uploadFile(file, { folder })
      );

      const results = await Promise.all(uploadPromises);

      ApiResponse.success({
        res,
        statusCode: 201,
        message: `${results.length} file berhasil diunggah ke Vercel Blob Storage`,
        data: results.map((item) => ({
          url: item.url,
          pathname: item.pathname,
          contentType: item.contentType,
          size: item.size,
        })),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Hapus media dari Vercel Blob Storage berdasarkan URL
   * Route: DELETE /api/upload
   * Body: { "url": "https://...public.blob.vercel-storage.com/..." }
   */
  deleteMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        throw new BadRequestError('URL file yang akan dihapus wajib disertakan.');
      }

      const deleted = await storageService.deleteFile(url);

      ApiResponse.success({
        res,
        message: deleted
          ? 'File berhasil dihapus dari Vercel Blob Storage'
          : 'File tidak ditemukan di Vercel Blob atau bukan URL yang valid (dilewati)',
        data: { url, deleted },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const uploadController = new UploadController();

