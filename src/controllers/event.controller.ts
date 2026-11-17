import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { storageService } from '../services/storage.service';
import { ApiResponse } from '../utils/response.util';
import { BadRequestError, NotFoundError } from '../errors/app.error';
import { CreateEventSchema, EventListQuerySchema, UpdateEventSchema } from '../dtos/event.dto';
import { parseValidatedInput } from '../utils/validation.util';

interface EventRow extends RowDataPacket {
  id: string;
  name: string;
  description: string;
  event_date: string;
  capacity: string;
  price: string;
  poster_url: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class EventController {
  /**
   * List Events
   * GET /api/events
   */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, search } = parseValidatedInput(EventListQuerySchema, req.query);
      const clauses: string[] = [];
      const values: any[] = [];

      if (status && status !== 'Semua') {
        clauses.push('status = ?');
        values.push(status);
      }

      if (search) {
        clauses.push('(name LIKE ? OR description LIKE ?)');
        values.push(`%${search}%`, `%${search}%`);
      }

      const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
      const [rows] = await pool.query<EventRow[]>(
        `SELECT id, name, description, event_date AS eventDate, capacity, price, 
                poster_url AS posterUrl, status, created_at, updated_at
         FROM events ${whereSql} ORDER BY event_date ASC`,
        values
      );

      ApiResponse.success({
        res,
        message: 'Daftar Event berhasil diambil',
        data: rows,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Detail Event berdasarkan ID
   * GET /api/events/:id
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [rows] = await pool.query<EventRow[]>(
        `SELECT id, name, description, event_date AS eventDate, capacity, price, 
                poster_url AS posterUrl, status, created_at, updated_at
         FROM events WHERE id = ?`,
        [req.params.id]
      );

      if (rows.length === 0) {
        throw new NotFoundError('Event tidak ditemukan.');
      }

      ApiResponse.success({
        res,
        message: 'Detail Event berhasil diambil',
        data: rows[0],
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Tambah Event baru + Upload Poster ke Vercel Blob Storage
   * POST /api/events
   * Form-Data: name, description, eventDate, capacity, price, poster=<binary>
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description, eventDate, capacity, price, status } = parseValidatedInput(CreateEventSchema, req.body);

      let posterUrl: string | null = null;

      // 1. Upload poster event ke Vercel Blob jika file dikirim
      if (req.file) {
        const uploadResult = await storageService.uploadFile(req.file, {
          folder: 'events',
          filenamePrefix: 'event-poster',
        });
        posterUrl = uploadResult.url;
      } else if (req.body.posterUrl) {
        posterUrl = req.body.posterUrl;
      }

      const id = uuidv4();
      const eventStatus = status || 'Upcoming';

      // 2. Simpan URL Vercel Blob langsung ke database MySQL
      await pool.query<ResultSetHeader>(
        `INSERT INTO events (id, name, description, event_date, capacity, price, poster_url, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, description || null, eventDate, capacity || '50 Orang', price || 'Gratis', posterUrl, eventStatus]
      );

      ApiResponse.success({
        res,
        statusCode: 201,
        message: 'Event berhasil dibuat dengan poster tersimpan di Vercel Blob',
        data: {
          id,
          name,
          description,
          eventDate,
          capacity,
          price,
          posterUrl,
          status: eventStatus,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update Event + Ganti Poster di Vercel Blob (Otomatis hapus poster lama)
   * PUT /api/events/:id
   * Form-Data: name, description, eventDate, capacity, price, poster=<binary>
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = parseValidatedInput(UpdateEventSchema, req.body);
      if (Object.keys(parsed).length === 0 && !req.file) {
        throw new BadRequestError('Setidaknya satu data atau file poster harus diperbarui.');
      }

      const [existingRows] = await pool.query<EventRow[]>(
        `SELECT id, name, description, event_date, capacity, price, poster_url, status 
         FROM events WHERE id = ?`,
        [req.params.id]
      );

      if (existingRows.length === 0) {
        throw new NotFoundError('Event tidak ditemukan.');
      }

      const existing = existingRows[0];
      let posterUrl: string | null = existing.poster_url;

      // 1. Jika ada upload file poster baru
      if (req.file) {
        const uploadResult = await storageService.uploadFile(req.file, {
          folder: 'events',
          filenamePrefix: 'event-poster',
        });
        posterUrl = uploadResult.url;

        // Hapus poster lama dari Vercel Blob
        if (existing.poster_url && storageService.isBlobUrl(existing.poster_url)) {
          await storageService.deleteFile(existing.poster_url);
        }
      } else if (parsed.posterUrl !== undefined) {
        if (parsed.posterUrl !== existing.poster_url && existing.poster_url && storageService.isBlobUrl(existing.poster_url)) {
          await storageService.deleteFile(existing.poster_url);
        }
        posterUrl = parsed.posterUrl;
      }

      const name = parsed.name ?? existing.name;
      const description = parsed.description ?? existing.description;
      const eventDate = parsed.eventDate ?? existing.event_date;
      const capacity = parsed.capacity ?? existing.capacity;
      const price = parsed.price ?? existing.price;
      const status = parsed.status ?? existing.status;

      // 2. Update record di database
      await pool.query<ResultSetHeader>(
        `UPDATE events SET name = ?, description = ?, event_date = ?, capacity = ?, 
                           price = ?, poster_url = ?, status = ?
         WHERE id = ?`,
        [name, description, eventDate, capacity, price, posterUrl, status, req.params.id]
      );

      ApiResponse.success({
        res,
        message: 'Data Event berhasil diperbarui',
        data: {
          id: req.params.id,
          name,
          description,
          eventDate,
          capacity,
          price,
          posterUrl,
          status,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Hapus Event + Hapus Poster dari Vercel Blob Storage
   * DELETE /api/events/:id
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [rows] = await pool.query<EventRow[]>(
        `SELECT id, poster_url FROM events WHERE id = ?`,
        [req.params.id]
      );

      if (rows.length === 0) {
        throw new NotFoundError('Event tidak ditemukan.');
      }

      const existing = rows[0];

      // 1. Hapus record dari MySQL
      await pool.query<ResultSetHeader>(`DELETE FROM events WHERE id = ?`, [req.params.id]);

      // 2. Hapus file poster dari Vercel Blob Storage jika ada
      if (existing.poster_url && storageService.isBlobUrl(existing.poster_url)) {
        await storageService.deleteFile(existing.poster_url);
      }

      ApiResponse.success({
        res,
        message: 'Event dan poster di Vercel Blob berhasil dihapus',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const eventController = new EventController();

