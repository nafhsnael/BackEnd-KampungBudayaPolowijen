import { Router } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';

interface EventRow extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
  eventDate: string;
  capacity: string | null;
  price: string | null;
  posterUrl: string | null;
  status: string;
}

interface PackageRow extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  capacity: string | null;
  price: number | string;
  imageUrl: string | null;
  isActive: number | boolean;
}

interface RoutineScheduleRow extends RowDataPacket {
  id: string;
  name: string;
  day: string;
  startTime: string | null;
  endTime: string | null;
  description: string | null;
  capacity: string | null;
  price: string | null;
  imageUrl: string | null;
}

const router = Router();

router.get('/events', async (_req, res, next) => {
  try {
    const [rows] = await pool.query<EventRow[]>(
      `SELECT id, name, description,
              DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate,
              capacity, price, poster_url AS posterUrl, status
       FROM events
       ORDER BY event_date ASC, created_at DESC`,
    );
    res.json({
      data: rows.map((row) => ({
        ...row,
        description: row.description ?? '',
        capacity: row.capacity ?? '',
        price: row.price ?? '',
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/packages', async (_req, res, next) => {
  try {
    const [rows] = await pool.query<PackageRow[]>(
      `SELECT id, name, description, duration, capacity, price,
              image_url AS imageUrl, is_active AS isActive
       FROM packages
       ORDER BY created_at DESC`,
    );
    res.json({
      data: rows.map((row) => ({
        ...row,
        description: row.description ?? '',
        duration: row.duration ?? '',
        capacity: row.capacity ?? '',
        price: Number(row.price),
        isActive: Boolean(row.isActive),
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/routine-schedules', async (_req, res, next) => {
  try {
    const [rows] = await pool.query<RoutineScheduleRow[]>(
      `SELECT id, name, day, TIME_FORMAT(start_time, '%H:%i') AS startTime,
              TIME_FORMAT(end_time, '%H:%i') AS endTime, description, capacity,
              price, image_url AS imageUrl
       FROM routine_schedules
       ORDER BY FIELD(day, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'),
                name ASC`,
    );
    res.json({
      data: rows.map((row) => ({
        ...row,
        startTime: row.startTime ?? '',
        endTime: row.endTime ?? '',
        description: row.description ?? '',
        capacity: row.capacity ?? '',
        price: row.price ?? '',
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
