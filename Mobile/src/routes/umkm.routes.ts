import { Router } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { umkmQuerySchema } from '../dtos';
import { HttpError } from '../errors';
import { optionalAuth, requireAuth } from '../middleware/auth';

interface UmkmRow extends RowDataPacket {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  cover_url: string | null;
  craftsman_name: string | null;
  whatsapp_number: string | null;
  is_wishlisted: number;
}

const router = Router();
export const wishlistRouter = Router();

router.get('/categories', async (_req, res, next) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT DISTINCT category AS name FROM umkm WHERE category <> ? ORDER BY category',
      [''],
    );
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { category, q, page, per_page: perPage } = umkmQuerySchema.parse(req.query);
    const clauses: string[] = [];
    const params: Array<string | number> = [];
    if (category) {
      clauses.push('u.category = ?');
      params.push(category);
    }
    if (q) {
      clauses.push('(u.name LIKE ? OR u.description LIKE ? OR u.craftsman_name LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM umkm u ${where}`,
      params,
    );
    const total = Number(countRows[0].total);
    const offset = (page - 1) * perPage;
    const userId = req.mobileUser?.userId ?? null;
    const [rows] = await pool.query<UmkmRow[]>(
      `SELECT u.id, u.name, u.category, u.description, CAST(u.price AS UNSIGNED) AS price,
              u.image_url AS cover_url, u.craftsman_name, u.whatsapp_number,
              IF(? IS NULL, 0, EXISTS(
                SELECT 1 FROM wishlists w WHERE w.user_id = ? AND w.umkm_id = u.id
              )) AS is_wishlisted
       FROM umkm u ${where}
       ORDER BY u.created_at DESC, u.name ASC
       LIMIT ? OFFSET ?`,
      [userId, userId, ...params, perPage, offset],
    );
    res.json({
      data: await addGalleryImages(rows),
      meta: { page, per_page: perPage, total },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query<UmkmRow[]>(
      `SELECT u.id, u.name, u.category, u.description, CAST(u.price AS UNSIGNED) AS price,
              u.image_url AS cover_url, u.craftsman_name, u.whatsapp_number,
              IF(? IS NULL, 0, EXISTS(
                SELECT 1 FROM wishlists w WHERE w.user_id = ? AND w.umkm_id = u.id
              )) AS is_wishlisted
       FROM umkm u WHERE u.id = ? LIMIT 1`,
      [req.mobileUser?.userId ?? null, req.mobileUser?.userId ?? null, req.params.id],
    );
    const product = rows[0];
    if (!product) throw new HttpError(404, 'Data UMKM tidak ditemukan');
    res.json({ data: (await addGalleryImages([product]))[0] });
  } catch (error) {
    next(error);
  }
});

wishlistRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const { page, per_page: perPage } = umkmQuerySchema.parse(req.query);
    const userId = req.mobileUser!.userId;
    const [countRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM wishlists WHERE user_id = ?',
      [userId],
    );
    const total = Number(countRows[0].total);
    const [rows] = await pool.query<UmkmRow[]>(
      `SELECT u.id, u.name, u.category, u.description, CAST(u.price AS UNSIGNED) AS price,
              u.image_url AS cover_url, u.craftsman_name, u.whatsapp_number, 1 AS is_wishlisted
       FROM wishlists w JOIN umkm u ON u.id = w.umkm_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, perPage, (page - 1) * perPage],
    );
    res.json({
      data: await addGalleryImages(rows),
      meta: { page, per_page: perPage, total },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/wishlist', requireAuth, async (req, res, next) => {
  try {
    await ensureProductExists(req.params.id);
    await pool.execute<ResultSetHeader>(
      `INSERT IGNORE INTO wishlists (user_id, umkm_id) VALUES (?, ?)`,
      [req.mobileUser!.userId, req.params.id],
    );
    res.json({ data: null });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/wishlist', requireAuth, async (req, res, next) => {
  try {
    await ensureProductExists(req.params.id);
    await pool.execute<ResultSetHeader>(
      'DELETE FROM wishlists WHERE user_id = ? AND umkm_id = ?',
      [req.mobileUser!.userId, req.params.id],
    );
    res.json({ data: null });
  } catch (error) {
    next(error);
  }
});

async function ensureProductExists(id: string): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT 1 FROM umkm WHERE id = ? LIMIT 1', [id]);
  if (rows.length === 0) throw new HttpError(404, 'Data UMKM tidak ditemukan');
}

async function addGalleryImages(products: UmkmRow[]) {
  if (products.length === 0) return [];
  const ids = products.map((product) => product.id);
  const placeholders = ids.map(() => '?').join(', ');
  const [imageRows] = await pool.query<RowDataPacket[]>(
    `SELECT umkm_id, image_url FROM umkm_images
     WHERE umkm_id IN (${placeholders}) ORDER BY sort_order, id`,
    ids,
  );
  const gallery = new Map<string, string[]>();
  for (const image of imageRows) {
    const current = gallery.get(image.umkm_id) ?? [];
    current.push(image.image_url);
    gallery.set(image.umkm_id, current);
  }
  return products.map((product) => ({
    ...product,
    is_wishlisted: Boolean(product.is_wishlisted),
    images: gallery.get(product.id) ?? (product.cover_url ? [product.cover_url] : []),
  }));
}

export default router;
