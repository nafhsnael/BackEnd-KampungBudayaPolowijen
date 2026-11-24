import { NextFunction, Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { BadRequestError, NotFoundError } from '../errors/app.error';
import {
  CreateRoutineScheduleSchema,
  UpdateRoutineScheduleSchema,
} from '../dtos/routine-schedule.dto';
import { parseValidatedInput } from '../utils/validation.util';
import { ApiResponse } from '../utils/response.util';
import { cloudinaryStorageService, deleteStoredImage } from '../services/cloudinary-storage.service';

interface RoutineScheduleRow extends RowDataPacket {
  id: string;
  name: string;
  day: string;
  start_time: string | null;
  end_time: string | null;
  description: string | null;
  capacity: string | null;
  price: string | null;
  image_url: string | null;
}

function mapSchedule(row: RoutineScheduleRow) {
  return {
    id: row.id,
    name: row.name,
    day: row.day,
    startTime: row.start_time?.slice(0, 5) ?? '',
    endTime: row.end_time?.slice(0, 5) ?? '',
    description: row.description ?? '',
    capacity: row.capacity ?? '',
    price: row.price ?? '',
    imageUrl: row.image_url,
  };
}

const dayOrder = `FIELD(day, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')`;

export class RoutineScheduleController {
  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [rows] = await pool.query<RoutineScheduleRow[]>(
        `SELECT id, name, day, start_time, end_time, description, capacity, price, image_url
         FROM routine_schedules
         ORDER BY ${dayOrder}, name ASC`
      );

      ApiResponse.success({
        res,
        message: 'Daftar jadwal rutin berhasil diambil',
        data: rows.map(mapSchedule),
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = parseValidatedInput(CreateRoutineScheduleSchema, req.body);
      const id = uuidv4();
      const imageUrl = req.file
        ? (await cloudinaryStorageService.uploadFile(req.file, {
            folder: 'routine-schedules',
            filenamePrefix: 'routine-schedule',
          })).url
        : data.imageUrl ?? null;

      await pool.query<ResultSetHeader>(
        `INSERT INTO routine_schedules
          (id, name, day, start_time, end_time, description, capacity, price, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.day,
          data.startTime ?? null,
          data.endTime ?? null,
          data.description ?? null,
          data.capacity ?? null,
          data.price ?? null,
          imageUrl,
        ]
      );

      ApiResponse.success({
        res,
        statusCode: 201,
        message: 'Jadwal rutin berhasil dibuat',
        data: {
          id,
          ...data,
          startTime: data.startTime ?? '',
          endTime: data.endTime ?? '',
          description: data.description ?? '',
          capacity: data.capacity ?? '',
          price: data.price ?? '',
          imageUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = parseValidatedInput(UpdateRoutineScheduleSchema, req.body);
      if (Object.keys(data).length === 0 && !req.file) {
        throw new BadRequestError('Setidaknya satu data harus diperbarui.');
      }

      const existing = await this.findById(req.params.id);
      const imageUrl = req.file
        ? (await cloudinaryStorageService.uploadFile(req.file, {
            folder: 'routine-schedules',
            filenamePrefix: 'routine-schedule',
          })).url
        : data.imageUrl === undefined
          ? existing.imageUrl
          : data.imageUrl;
      const updated = {
        name: data.name ?? existing.name,
        day: data.day ?? existing.day,
        startTime: data.startTime ?? existing.startTime,
        endTime: data.endTime ?? existing.endTime,
        description:
          data.description === undefined
            ? existing.description
            : data.description ?? '',
        capacity:
          data.capacity === undefined ? existing.capacity : data.capacity ?? '',
        price: data.price === undefined ? existing.price : data.price ?? '',
        imageUrl,
      };

      await pool.query<ResultSetHeader>(
        `UPDATE routine_schedules
         SET name = ?, day = ?, start_time = ?, end_time = ?, description = ?, capacity = ?, price = ?, image_url = ?
         WHERE id = ?`,
        [
          updated.name,
          updated.day,
          updated.startTime || null,
          updated.endTime || null,
          updated.description || null,
          updated.capacity || null,
          updated.price || null,
          updated.imageUrl,
          req.params.id,
        ]
      );

      if (imageUrl !== existing.imageUrl) {
        await deleteStoredImage(existing.imageUrl);
      }

      ApiResponse.success({
        res,
        message: 'Jadwal rutin berhasil diperbarui',
        data: { id: req.params.id, ...updated },
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const existing = await this.findById(req.params.id);
      const [result] = await pool.query<ResultSetHeader>(
        'DELETE FROM routine_schedules WHERE id = ?',
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        throw new NotFoundError('Jadwal rutin tidak ditemukan.');
      }

      await deleteStoredImage(existing.imageUrl);

      ApiResponse.success({
        res,
        message: 'Jadwal rutin berhasil dihapus',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };

  private async findById(id: string) {
    const [rows] = await pool.query<RoutineScheduleRow[]>(
      `SELECT id, name, day, start_time, end_time, description, capacity, price, image_url
       FROM routine_schedules WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!rows[0]) {
      throw new NotFoundError('Jadwal rutin tidak ditemukan.');
    }

    return mapSchedule(rows[0]);
  }
}

export const routineScheduleController = new RoutineScheduleController();
