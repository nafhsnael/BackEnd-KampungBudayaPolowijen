import app from './app';
import { envConfig } from './config/env.config';

const PORT = envConfig.PORT;

const server = app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${envConfig.NODE_ENV}`);
  console.log(`=================================`);
});

// Graceful Shutdown Handling
const handleShutdown = (signal: string) => {
  console.log(`\n⚠️ Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('🛑 HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
