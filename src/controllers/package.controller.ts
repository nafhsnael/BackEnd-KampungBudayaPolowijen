import { NextFunction, Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { BadRequestError, NotFoundError } from '../errors/app.error';
import {
  CreatePackageSchema,
  PackageListQuerySchema,
  UpdatePackageSchema,
} from '../dtos/package.dto';
import { parseValidatedInput } from '../utils/validation.util';
import { ApiResponse } from '../utils/response.util';

interface PackageRow extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  capacity: string | null;
  price: number | string;
  image_url: string | null;
  is_active: number | boolean;
}

function mapPackage(row: PackageRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    duration: row.duration ?? '',
    capacity: row.capacity ?? '',
    price: Number(row.price),
    imageUrl: row.image_url,
    isActive: Boolean(row.is_active),
  };
}

export class PackageController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search } = parseValidatedInput(PackageListQuerySchema, req.query);
      const [rows] = await pool.query<PackageRow[]>(
        `SELECT id, name, description, duration, capacity, price, image_url, is_active
         FROM packages
         ${search ? 'WHERE name LIKE ? OR description LIKE ?' : ''}
         ORDER BY created_at DESC`,
        search ? [`%${search}%`, `%${search}%`] : []
      );

      ApiResponse.success({
        res,
        message: 'Daftar paket berhasil diambil',
        data: rows.map(mapPackage),
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = parseValidatedInput(CreatePackageSchema, req.body);
      const id = uuidv4();

      await pool.query<ResultSetHeader>(
        `INSERT INTO packages (id, name, description, duration, capacity, price, image_url, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.description ?? null,
          data.duration ?? null,
          data.capacity ?? null,
          data.price,
          data.imageUrl ?? null,
          data.isActive,
        ]
      );

      ApiResponse.success({
        res,
        statusCode: 201,
        message: 'Paket berhasil dibuat',
        data: {
          id,
          ...data,
          description: data.description ?? '',
          duration: data.duration ?? '',
          capacity: data.capacity ?? '',
          imageUrl: data.imageUrl ?? null,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = parseValidatedInput(UpdatePackageSchema, req.body);
      if (Object.keys(data).length === 0) {
        throw new BadRequestError('Setidaknya satu data harus diperbarui.');
      }

      const existing = await this.findById(req.params.id);
      const updated = {
        name: data.name ?? existing.name,
        description: data.description === undefined ? existing.description : data.description ?? '',
        duration: data.duration === undefined ? existing.duration : data.duration ?? '',
        capacity: data.capacity === undefined ? existing.capacity : data.capacity ?? '',
        price: data.price ?? existing.price,
        imageUrl: data.imageUrl === undefined ? existing.imageUrl : data.imageUrl,
        isActive: data.isActive ?? existing.isActive,
      };

      await pool.query<ResultSetHeader>(
        `UPDATE packages
         SET name = ?, description = ?, duration = ?, capacity = ?, price = ?, image_url = ?, is_active = ?
         WHERE id = ?`,
        [
          updated.name,
          updated.description || null,
          updated.duration || null,
          updated.capacity || null,
          updated.price,
          updated.imageUrl,
          updated.isActive,
          req.params.id,
        ]
      );

      ApiResponse.success({
        res,
        message: 'Paket berhasil diperbarui',
        data: { id: req.params.id, ...updated },
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        'DELETE FROM packages WHERE id = ?',
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        throw new NotFoundError('Paket tidak ditemukan.');
      }

      ApiResponse.success({
        res,
        message: 'Paket berhasil dihapus',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };

  private async findById(id: string) {
    const [rows] = await pool.query<PackageRow[]>(
      `SELECT id, name, description, duration, capacity, price, image_url, is_active
       FROM packages WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!rows[0]) {
      throw new NotFoundError('Paket tidak ditemukan.');
    }

    return mapPackage(rows[0]);
  }
}

export const packageController = new PackageController();
