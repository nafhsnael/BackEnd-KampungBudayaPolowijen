import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '../config/database';

interface RevokedTokenRow extends RowDataPacket {
  revoked: number;
}

export class TokenRepository {
  async revoke(tokenId: string, expiresAt: Date): Promise<void> {
    await pool.query<ResultSetHeader>(
      'INSERT INTO revoked_tokens (token_id, expires_at) VALUES (?, ?) ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)',
      [tokenId, expiresAt]
    );
    await pool.query<ResultSetHeader>(
      'DELETE FROM revoked_tokens WHERE expires_at <= CURRENT_TIMESTAMP'
    );
  }

  async isRevoked(tokenId: string): Promise<boolean> {
    const [rows] = await pool.query<RevokedTokenRow[]>(
      'SELECT 1 AS revoked FROM revoked_tokens WHERE token_id = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1',
      [tokenId]
    );
    return rows.length > 0;
  }
}
