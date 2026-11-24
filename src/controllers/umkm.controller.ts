import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { cloudinaryStorageService, deleteStoredImage } from '../services/cloudinary-storage.service';
import { ApiResponse } from '../utils/response.util';
import { BadRequestError, NotFoundError } from '../errors/app.error';
import { CreateUmkmSchema, UmkmListQuerySchema, UpdateUmkmSchema } from '../dtos/umkm.dto';
import { parseValidatedInput } from '../utils/validation.util';

interface UmkmRow extends RowDataPacket {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export class UmkmController {
  /**
   * List UMKM dengan filter opsional (category, search)
   * GET /api/umkm
   */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, search } = parseValidatedInput(UmkmListQuerySchema, req.query);
      const clauses: string[] = [];
      const values: any[] = [];

      if (category && category !== 'Semua') {
        clauses.push('category = ?');
        values.push(category);
      }

      if (search) {
        clauses.push('(name LIKE ? OR description LIKE ?)');
        values.push(`%${search}%`, `%${search}%`);
      }

      const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
      const [rows] = await pool.query<UmkmRow[]>(
        `SELECT id, name, category, description, price, image_url AS imageUrl, created_at, updated_at
         FROM umkm ${whereSql} ORDER BY created_at DESC`,
        values
      );

      ApiResponse.success({
        res,
        message: 'Daftar UMKM berhasil diambil',
        data: rows,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Detail UMKM berdasarkan ID
   * GET /api/umkm/:id
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [rows] = await pool.query<UmkmRow[]>(
        `SELECT id, name, category, description, price, image_url AS imageUrl, created_at, updated_at
         FROM umkm WHERE id = ?`,
        [req.params.id]
      );

      if (rows.length === 0) {
        throw new NotFoundError('Data UMKM tidak ditemukan.');
      }

      ApiResponse.success({
        res,
        message: 'Detail UMKM berhasil diambil',
        data: rows[0],
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Tambah UMKM baru + Upload Gambar ke Cloudinary
   * POST /api/umkm
   * Form-Data: name, category, description, price, image=<binary>
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, category, description, price } = parseValidatedInput(CreateUmkmSchema, req.body);

      let imageUrl: string | null = null;

      // Upload gambar produk ke Cloudinary jika ada file
      if (req.file) {
        const uploadResult = await cloudinaryStorageService.uploadFile(req.file, {
          folder: 'umkm',
          filenamePrefix: 'umkm-prod',
        });
        imageUrl = uploadResult.url;
      } else if (req.body.imageUrl) {
        imageUrl = req.body.imageUrl;
      }

      const id = uuidv4();
      const parsedPrice = price;

      // Simpan URL Cloudinary langsung ke kolom image_url tabel MySQL
      await pool.query<ResultSetHeader>(
        `INSERT INTO umkm (id, name, category, description, price, image_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, category, description || null, parsedPrice, imageUrl]
      );

      ApiResponse.success({
        res,
        statusCode: 201,
        message: 'UMKM berhasil dibuat dengan media tersimpan di Cloudinary',
        data: {
          id,
          name,
          category,
          description,
          price: parsedPrice,
          imageUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update UMKM + Ganti Gambar di Cloudinary
   * PUT /api/umkm/:id
   * Form-Data: name, category, description, price, image=<binary>
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = parseValidatedInput(UpdateUmkmSchema, req.body);
      if (Object.keys(parsed).length === 0 && !req.file) {
        throw new BadRequestError('Setidaknya satu data atau file gambar harus diperbarui.');
      }

      const [existingRows] = await pool.query<UmkmRow[]>(
        `SELECT id, name, category, description, price, image_url FROM umkm WHERE id = ?`,
        [req.params.id]
      );

      if (existingRows.length === 0) {
        throw new NotFoundError('Data UMKM tidak ditemukan.');
      }

      const existing = existingRows[0];
      let imageUrl: string | null = existing.image_url;

      // 1. Jika ada upload gambar baru: upload ke Vercel Blob & hapus gambar lama
      if (req.file) {
        const uploadResult = await cloudinaryStorageService.uploadFile(req.file, {
          folder: 'umkm',
          filenamePrefix: 'umkm-prod',
        });
        imageUrl = uploadResult.url;
      } else if (parsed.imageUrl !== undefined) {
        imageUrl = parsed.imageUrl;
      }

      const name = parsed.name ?? existing.name;
      const category = parsed.category ?? existing.category;
      const description = parsed.description ?? existing.description;
      const price = parsed.price ?? existing.price;

      // 2. Update database
      await pool.query<ResultSetHeader>(
        `UPDATE umkm SET name = ?, category = ?, description = ?, price = ?, image_url = ?
         WHERE id = ?`,
        [name, category, description, price, imageUrl, req.params.id]
      );

      if (imageUrl !== existing.image_url) {
        await deleteStoredImage(existing.image_url);
      }

      ApiResponse.success({
        res,
        message: 'Data UMKM berhasil diperbarui',
        data: {
          id: req.params.id,
          name,
          category,
          description,
          price,
          imageUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Hapus UMKM + Hapus File Gambar dari Cloudinary atau Vercel Blob Storage
   * DELETE /api/umkm/:id
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [rows] = await pool.query<UmkmRow[]>(
        `SELECT id, image_url FROM umkm WHERE id = ?`,
        [req.params.id]
      );

      if (rows.length === 0) {
        throw new NotFoundError('Data UMKM tidak ditemukan.');
      }

      const existing = rows[0];

      // 1. Hapus dari database MySQL
      await pool.query<ResultSetHeader>(`DELETE FROM umkm WHERE id = ?`, [req.params.id]);

      // 2. Hapus file dari Vercel Blob Storage jika ada
      await deleteStoredImage(existing.image_url);

      ApiResponse.success({
        res,
        message: 'UMKM dan berkas media di Vercel Blob berhasil dihapus',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const umkmController = new UmkmController();

