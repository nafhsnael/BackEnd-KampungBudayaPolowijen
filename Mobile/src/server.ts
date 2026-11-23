import app from './app';
import { pool } from './config/database';
import { env } from './config/env';

async function start(): Promise<void> {
  await pool.query('SELECT 1');
  const server = app.listen(env.PORT, () => {
    console.log(`Polowijen Mobile API listening on port ${env.PORT}`);
  });

  const shutdown = (): void => {
    server.close(() => {
      void pool.end().then(() => process.exit(0)).catch((error: unknown) => {
        console.error('Failed to close database pool:', error);
        process.exit(1);
      });
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error: unknown) => {
  console.error('Failed to start Polowijen Mobile API:', error);
  process.exitCode = 1;
});
