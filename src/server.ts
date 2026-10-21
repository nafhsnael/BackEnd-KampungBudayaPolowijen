import app from './app';
import { envConfig } from './config/env.config';
import { testDatabaseConnection } from './config/database';
import pool from './config/database';

const PORT = envConfig.PORT;

async function bootstrap(): Promise<void> {
  // Validasi koneksi database sebelum server mulai menerima request
  await testDatabaseConnection();

  const server = app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${envConfig.NODE_ENV}`);
    console.log(`=================================`);
  });

  // Graceful Shutdown Handling
  const handleShutdown = async (signal: string) => {
    console.log(`\n⚠️ Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('🛑 HTTP server closed.');
      await pool.end();
      console.log('🔌 MySQL connection pool closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT',  () => handleShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('💥 Failed to start server:', err);
  process.exit(1);
});

