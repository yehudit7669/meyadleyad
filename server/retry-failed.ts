import { notificationsService } from './src/modules/notifications/notifications.service';

async function retryFailed() {
  console.log('\n🔄 Retrying failed notifications...\n');
  
  const count = await notificationsService.retryFailedNotifications(3);
  
  console.log(`\n✅ Retried ${count} notifications\n`);
}

retryFailed().catch(console.error);
