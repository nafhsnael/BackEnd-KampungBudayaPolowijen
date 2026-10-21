import mysql from 'mysql2/promise';
import { envConfig } from './env.config';

/**
 * MySQL Connection Pool menggunakan mysql2/promise
 * Connection pool otomatis mengelola koneksi agar efisien dan thread-safe.
 */
const pool = mysql.createPool({
  host:               envConfig.DB_HOST,
  port:               envConfig.DB_PORT,
  user:               envConfig.DB_USER,
  password:           envConfig.DB_PASSWORD,
  database:           envConfig.DB_NAME,
  charset:            'utf8mb4',
  waitForConnections: true,
  connectionLimit:    10,       // maksimal 10 koneksi paralel
  queueLimit:         0,        // antrian tidak terbatas
  timezone:           '+07:00', // WIB
});

/**
 * Uji koneksi saat startup aplikasi.
 * Dipanggil dari server.ts sebelum server mulai listen.
 */
export async function testDatabaseConnection(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL database connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error);
    throw error; // Hentikan startup jika DB tidak bisa terhubung
  }
}

export default pool;
