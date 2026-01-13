import { AdminService } from './src/modules/admin/admin.service';
import prisma from './src/config/database';

async function approveAd() {
  try {
    const adId = '94820abd-9322-463b-8691-d534be1569bf';
    
    // Find an admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!admin) {
      console.error('No admin user found');
      return;
    }
    
    console.log('Approving ad with ID:', adId);
    console.log('Admin:', admin.email);
    
    const adminService = new AdminService();
    const approved = await adminService.approveAd(adId, admin.id);
    
    console.log('✅ Ad approved successfully!');
    console.log('Status:', approved.status);
    console.log('Published at:', approved.publishedAt);
    
  } catch (error) {
    console.error('❌ Error approving ad:', error);
  } finally {
    await prisma.$disconnect();
  }
}

approveAd();
