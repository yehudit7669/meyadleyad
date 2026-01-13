import app from './app';
import { config } from './config';
import prisma from './config/database';
import { validateEnvironment, displayValidationResults, getEnvironmentSummary } from './config/validateEnv';
import { logger } from './utils/logger';

// Validate environment variables before starting the server
console.log('\n🔍 Validating environment configuration...\n');
const validation = validateEnvironment();
displayValidationResults(validation);

if (!validation.isValid) {
  console.error('\n❌ Server startup aborted due to critical configuration errors.\n');
  process.exit(1);
}

// Display environment summary
const envSummary = getEnvironmentSummary();
console.log('\n📊 Environment Summary:');
console.log(`   Database: ${envSummary.database ? '✅' : '❌'}`);
console.log(`   JWT: ${envSummary.jwt ? '✅' : '❌'}`);
console.log(`   Email: ${envSummary.email ? '✅' : '⚠️  (Optional)'}`);
console.log(`   WhatsApp: ${envSummary.whatsapp ? '✅' : '⚠️  (Optional)'}`);
console.log(`   Google OAuth: ${envSummary.googleAuth ? '✅' : '⚠️  (Optional)'}`);
console.log('');

const server = app.listen(config.port, () => {
  logger.info('🚀 Server started successfully', {
    port: config.port,
    environment: config.nodeEnv,
    clientUrl: config.clientUrl,
  });
  
  console.log(`🚀 Server is running on port ${config.port}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Client URL: ${config.clientUrl}`);
  console.log(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);
  console.log(`🛡️  Logging: Request sanitization active`);
  console.log(`📊 Monitoring: Performance tracking enabled\n`);
});

const gracefulShutdown = async () => {
  logger.info('Initiating graceful shutdown...');
  console.log('\n⏳ Shutting down gracefully...');
  
  server.close(async () => {
    logger.info('HTTP server closed');
    console.log('🔌 HTTP server closed');
    
    await prisma.$disconnect();
    logger.info('Database connection closed');
    console.log('📊 Database connection closed');
    
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Promise Rejection', { reason: String(reason) });
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', error);
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown();
});
