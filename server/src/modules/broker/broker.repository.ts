import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type {
  UpdatePersonalDetailsInput,
  UpdateOfficeDetailsInput,
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
  CreateFeaturedRequestInput,
  CreateAvailabilitySlotInput,
  CreateAccountDeletionRequestInput,
} from './broker.validation';

const prisma = new PrismaClient();

export class BrokerRepository {
  // Get public broker profile (no sensitive data)
  async getPublicBrokerProfile(brokerId: string) {
    const user = await prisma.user.findUnique({
      where: { id: brokerId, role: 'BROKER' },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        businessPhone: true,
      },
    });

    if (!user) {
      throw new Error('Broker not found');
    }

    const office = await prisma.brokerOffice.findUnique({
      where: { brokerOwnerUserId: brokerId },
      select: {
        logoUrlApproved: true,
        aboutBusinessApproved: true,
        businessAddressApproved: true,
        publishOfficeAddress: true,
      },
    });

    const ads = await prisma.ad.findMany({
      where: { 
        userId: brokerId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        views: true,
        createdAt: true,
        adNumber: true,
        isWanted: true,
        requestedLocationText: true,
        Category: {
          select: { nameHe: true },
        },
        City: {
          select: { nameHe: true },
        },
        AdImage: {
          take: 1,
          select: { url: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      broker: {
        id: user.id,
        name: user.name || '',
        email: user.email,
        businessName: user.businessName,
        businessPhone: user.businessPhone,
        about: office?.aboutBusinessApproved,
        logoUrl: office?.logoUrlApproved,
        businessAddress: office?.publishOfficeAddress ? office?.businessAddressApproved : null,
      },
      ads,
    };
  }

  // Get complete broker profile
  async getBrokerProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phonePersonal: true,
        businessPhone: true,
        weeklyDigestOptIn: true, // Keep for backwards compatibility
        pendingEmail: true,
        role: true,
        userType: true,
        serviceProviderType: true,
        UserPreference: {
          select: {
            weeklyDigest: true,
            weeklyDigestBlocked: true,
          },
        },
      },
    });

    // Ensure weeklyDigestOptIn reflects UserPreference value if it exists
    if (user && user.UserPreference) {
      (user as any).weeklyDigestOptIn = user.UserPreference.weeklyDigest && !user.UserPreference.weeklyDigestBlocked;
    }

    let office = await prisma.brokerOffice.findUnique({
      where: { brokerOwnerUserId: userId },
    });

    // If office doesn't exist, create it with minimal required data
    if (!office && user) {
      office = await prisma.brokerOffice.create({
        data: {
          brokerOwnerUserId: userId,
          businessName: user.name || 'משרד חדש',
          businessAddressApproved: 'לא הוגדר',
        },
      });
    }

    const teamMembers = await prisma.brokerTeamMember.findMany({
      where: { officeId: office?.id },
      orderBy: { createdAt: 'asc' },
    });

    const adsCount = await prisma.ad.count({
      where: { userId },
    });

    const activeAdsCount = await prisma.ad.count({
      where: { userId, status: 'ACTIVE' },
    });

    return {
      user,
      office,
      teamMembers,
      stats: {
        totalAds: adsCount,
        activeAds: activeAdsCount,
      },
    };
  }

  // Update personal details
  async updatePersonalDetails(userId: string, data: UpdatePersonalDetailsInput) {
    const updateData: any = {};
    
    if (data.fullName !== undefined) {
      updateData.name = data.fullName;
    }
    if (data.phonePersonal !== undefined) {
      updateData.phonePersonal = data.phonePersonal;
    }
    if (data.businessPhone !== undefined) {
      updateData.businessPhone = data.businessPhone;
    }

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  // Update office details
  async updateOfficeDetails(userId: string, data: UpdateOfficeDetailsInput) {
    const office = await prisma.brokerOffice.findUnique({
      where: { brokerOwnerUserId: userId },
    });

    if (!office) {
      throw new Error('Office not found');
    }

    return prisma.brokerOffice.update({
      where: { id: office.id },
      data: {
        businessName: data.businessName,
        businessAddressPending: data.businessAddressPending,
        publishOfficeAddress: data.publishOfficeAddress,
        aboutBusinessPending: data.aboutBusinessPending,
      },
    });
  }

  // Update office logo (pending)
  async updateOfficeLogo(userId: string, logoUrl: string) {
    const office = await prisma.brokerOffice.findUnique({
      where: { brokerOwnerUserId: userId },
    });

    if (!office) {
      throw new Error('Office not found');
    }

    return prisma.brokerOffice.update({
      where: { id: office.id },
      data: { logoUrlPending: logoUrl },
    });
  }

  // Get team members
  async getTeamMembers(userId: string) {
    const office = await prisma.brokerOffice.findUnique({
      where: { brokerOwnerUserId: userId },
    });

    if (!office) {
      return [];
    }

    return prisma.brokerTeamMember.findMany({
      where: { officeId: office.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Create team member
  async createTeamMember(userId: string, data: CreateTeamMemberInput) {
    const office = await prisma.brokerOffice.findUnique({
      where: { brokerOwnerUserId: userId },
    });

    if (!office) {
      throw new Error('Office not found');
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('משתמש עם כתובת מייל זו כבר קיים במערכת');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create the new user account for the team member
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.fullName,
        phone: data.phone,
        role: 'USER', // Team members are regular users
        isVerified: true, // Auto-verify team members
        isEmailVerified: true,
      },
    });

    // Create the team member record
    const teamMember = await prisma.brokerTeamMember.create({
      data: {
        officeId: office.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      },
    });

    return teamMember;
  }

  // Update team member
  async updateTeamMember(userId: string, memberId: string, data: UpdateTeamMemberInput) {
    const office = await prisma.brokerOffice.findUnique({
      where: { brokerOwnerUserId: userId },
    });

    if (!office) {
      throw new Error('Office not found');
    }

    // Verify team member belongs to this office
    const member = await prisma.brokerTeamMember.findFirst({
      where: { id: memberId, officeId: office.id },
    });

    if (!member) {
      throw new Error('Team member not found');
    }

    return prisma.brokerTeamMember.update({
      where: { id: memberId },
      data,
    });
  }

  // Delete/deactivate team member
  async deleteTeamMember(userId: string, memberId: string) {
    const office = await prisma.brokerOffice.findUnique({
      where: { brokerOwnerUserId: userId },
    });

    if (!office) {
      throw new Error('Office not found');
    }

    const member = await prisma.brokerTeamMember.findFirst({
      where: { id: memberId, officeId: office.id },
    });

    if (!member) {
      throw new Error('Team member not found');
    }

    // Soft delete by setting isActive to false
    return prisma.brokerTeamMember.update({
      where: { id: memberId },
      data: { isActive: false },
    });
  }

  // Get broker ads
  async getBrokerAds(userId: string) {
    return prisma.ad.findMany({
      where: { userId },
      include: {
        Category: true,
        City: true,
        AdImage: {
          take: 1,
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get broker appointments
  async getBrokerAppointments(userId: string) {
    return prisma.appointment.findMany({
      where: {
        ad: {
          userId,
        },
      },
      include: {
        ad: {
          select: {
            id: true,
            title: true,
            adNumber: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  // Update appointment status
  async updateAppointmentStatus(appointmentId: string, status: string, note?: string) {
    return prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: status as any,
        note,
      },
    });
  }

  // Get availability slots for an ad
  async getAvailabilitySlots(adId: string) {
    return prisma.availabilitySlot.findMany({
      where: { adId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  // Create availability slot
  async createAvailabilitySlot(data: CreateAvailabilitySlotInput) {
    return prisma.availabilitySlot.create({
      data: {
        adId: data.adId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });
  }

  // Delete availability slot
  async deleteAvailabilitySlot(slotId: string) {
    return prisma.availabilitySlot.delete({
      where: { id: slotId },
    });
  }

  // Update communication preferences
  async updateCommunication(userId: string, weeklyDigestOptIn: boolean) {
    // Update or create UserPreference instead of User.weeklyDigestOptIn
    await prisma.userPreference.upsert({
      where: { userId },
      update: { weeklyDigest: weeklyDigestOptIn },
      create: {
        userId,
        weeklyDigest: weeklyDigestOptIn,
        notifyNewMatches: false,
      },
    });

    return prisma.user.findUnique({
      where: { id: userId },
      include: { UserPreference: true },
    });
  }

  // Request email change
  async requestEmailChange(userId: string, newEmail: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { pendingEmail: newEmail },
    });
  }

  // Create featured request
  async createFeaturedRequest(userId: string, data: CreateFeaturedRequestInput) {
    return prisma.featuredRequest.create({
      data: {
        userId,
        adId: data.adId,
        notes: data.notes,
      },
    });
  }

  // Create data export request
  async createDataExportRequest(userId: string) {
    return prisma.dataExportRequest.create({
      data: { userId },
    });
  }

  // Create account deletion request
  async createAccountDeletionRequest(userId: string, data: CreateAccountDeletionRequestInput) {
    return prisma.accountDeletionRequest.create({
      data: {
        userId,
        reason: data.reason,
      },
    });
  }

  // Create audit log
  async createAuditLog(params: {
    actorUserId?: string;
    actionType: string;
    entityType?: string;
    entityId?: string;
    metadata?: any;
    ip?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        actionType: params.actionType,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata || {},
        ip: params.ip,
      },
    });
  }
}

export const brokerRepository = new BrokerRepository();
