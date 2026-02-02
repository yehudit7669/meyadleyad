import { brokerRepository } from './broker.repository';
import { AuditService } from '../profile/audit.service';
import { pendingApprovalsService } from '../admin/pending-approvals.service';
import { PendingApprovalType } from '@prisma/client';
import prisma from '../../config/database';
import type {
  UpdatePersonalDetailsInput,
  UpdateOfficeDetailsInput,
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
  UpdateCommunicationInput,
  RequestEmailChangeInput,
  CreateFeaturedRequestInput,
  RespondToAppointmentInput,
  CreateAvailabilitySlotInput,
  CreateAccountDeletionRequestInput,
} from './broker.validation';

export class BrokerService {
  // Get public broker profile (no auth required)
  async getPublicProfile(brokerId: string) {
    return brokerRepository.getPublicBrokerProfile(brokerId);
  }

  // Get complete broker profile
  async getProfile(userId: string, ip?: string) {
    // No audit log for viewing profile - only for actions
    return brokerRepository.getBrokerProfile(userId);
  }

  // Update personal details
  async updatePersonalDetails(userId: string, data: UpdatePersonalDetailsInput, ip?: string) {
    const result = await brokerRepository.updatePersonalDetails(userId, data);
    await AuditService.log(userId, 'UPDATE_PROFILE', { fields: Object.keys(data) }, ip);
    return result;
  }

  // Update office details
  async updateOfficeDetails(userId: string, data: UpdateOfficeDetailsInput, ip?: string) {
    // Check which fields need approval
    const needsApproval: { aboutBusiness?: boolean; address?: boolean } = {};
    
    // Get current office data for comparison
    const currentOffice = await prisma.brokerOffice.findUnique({
      where: { brokerOwnerUserId: userId },
    });

    // Create pending approvals for fields that require admin approval
    // Only create approval if the value actually changed from both approved AND pending versions
    if (
      data.aboutBusinessPending !== undefined && 
      data.aboutBusinessPending !== currentOffice?.aboutBusinessApproved &&
      data.aboutBusinessPending !== currentOffice?.aboutBusinessPending
    ) {
      await pendingApprovalsService.createApproval({
        userId,
        type: PendingApprovalType.ABOUT_UPDATE,
        requestData: { aboutBusiness: data.aboutBusinessPending },
        oldData: { aboutBusiness: currentOffice?.aboutBusinessApproved },
        reason: 'עדכון אודות העסק',
      });
      needsApproval.aboutBusiness = true;
    }

    if (
      data.businessAddressPending !== undefined && 
      data.businessAddressPending !== currentOffice?.businessAddressApproved &&
      data.businessAddressPending !== currentOffice?.businessAddressPending
    ) {
      await pendingApprovalsService.createApproval({
        userId,
        type: PendingApprovalType.OFFICE_ADDRESS_UPDATE,
        requestData: { address: data.businessAddressPending },
        oldData: { address: currentOffice?.businessAddressApproved },
        reason: 'עדכון כתובת משרד',
      });
      needsApproval.address = true;
    }

    // Update office with pending fields
    const result = await brokerRepository.updateOfficeDetails(userId, data);
    await AuditService.log(userId, 'UPDATE_OFFICE', { officeId: result.id, fields: Object.keys(data), needsApproval }, ip);
    return result;
  }

  // Upload office logo
  async uploadOfficeLogo(userId: string, logoUrl: string, ip?: string) {
    // Get current logo for comparison
    const currentOffice = await prisma.brokerOffice.findUnique({
      where: { brokerOwnerUserId: userId },
    });

    // Only create pending approval if logo actually changed from both approved AND pending versions
    if (logoUrl !== currentOffice?.logoUrlApproved && logoUrl !== currentOffice?.logoUrlPending) {
      await pendingApprovalsService.createApproval({
        userId,
        type: PendingApprovalType.LOGO_UPLOAD,
        requestData: { logoUrl },
        oldData: { logoUrl: currentOffice?.logoUrlApproved },
        reason: 'העלאת לוגו חדש',
      });
    }

    const result = await brokerRepository.updateOfficeLogo(userId, logoUrl);
    await AuditService.log(userId, 'UPDATE_BRANDING', { officeId: result.id, logoUrl }, ip);
    return result;
  }

  // Get team members
  async getTeamMembers(userId: string) {
    return brokerRepository.getTeamMembers(userId);
  }

  // Create team member
  async createTeamMember(userId: string, data: CreateTeamMemberInput, ip?: string) {
    const result = await brokerRepository.createTeamMember(userId, data);
    await AuditService.log(userId, 'ADD_TEAM_MEMBER', { memberId: result.id, memberName: data.fullName }, ip);
    return result;
  }

  // Update team member
  async updateTeamMember(userId: string, memberId: string, data: UpdateTeamMemberInput, ip?: string) {
    const result = await brokerRepository.updateTeamMember(userId, memberId, data);
    await AuditService.log(userId, 'UPDATE_TEAM_MEMBER', { memberId, fields: Object.keys(data) }, ip);
    return result;
  }

  // Delete team member
  async deleteTeamMember(userId: string, memberId: string, ip?: string) {
    const result = await brokerRepository.deleteTeamMember(userId, memberId);
    await AuditService.log(userId, 'REMOVE_TEAM_MEMBER', { memberId }, ip);
  }

  // Get broker ads
  async getBrokerAds(userId: string) {
    return brokerRepository.getBrokerAds(userId);
  }

  // Get broker appointments
  async getAppointments(userId: string) {
    return brokerRepository.getBrokerAppointments(userId);
  }

  // Respond to appointment
  async respondToAppointment(
    userId: string,
    appointmentId: string,
    data: RespondToAppointmentInput,
    ip?: string
  ) {
    const result = await brokerRepository.updateAppointmentStatus(
      appointmentId,
      data.status,
      data.note
    );
    await AuditService.log(userId, data.status === 'APPROVED' ? 'SCHEDULE_APPOINTMENT' : 'CANCEL_APPOINTMENT', { appointmentId, status: data.status }, ip);
    return result;
  }

  // Get availability slots
  async getAvailabilitySlots(adId: string) {
    return brokerRepository.getAvailabilitySlots(adId);
  }

  // Create availability slot
  async createAvailabilitySlot(userId: string, data: CreateAvailabilitySlotInput, ip?: string) {
    // Check if user is blocked from meetings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { meetingsBlocked: true },
    });

    if (user?.meetingsBlocked) {
      throw new Error('הפונקציה הזו אינה זמינה עבורך כעת. לפרטים, פנה לתמיכה.');
    }

    const result = await brokerRepository.createAvailabilitySlot(data);
    await AuditService.log(userId, 'UPDATE_SETTINGS', { slotId: result.id, adId: data.adId, dayOfWeek: data.dayOfWeek }, ip);
    return result;
  }

  // Delete availability slot
  async deleteAvailabilitySlot(userId: string, slotId: string, ip?: string) {
    await brokerRepository.deleteAvailabilitySlot(slotId);
    await AuditService.log(userId, 'UPDATE_SETTINGS', { deletedSlotId: slotId }, ip);
  }

  // Update communication preferences
  async updateCommunication(userId: string, data: UpdateCommunicationInput, ip?: string) {
    const result = await brokerRepository.updateCommunication(userId, data.weeklyDigestOptIn);
    await AuditService.log(userId, 'UPDATE_PREFS', { weeklyDigestOptIn: data.weeklyDigestOptIn }, ip);
    return result;
  }

  // Request email change
  async requestEmailChange(userId: string, data: RequestEmailChangeInput, ip?: string) {
    const result = await brokerRepository.requestEmailChange(userId, data.newEmail);
    await AuditService.log(userId, 'UPDATE_PROFILE', { action: 'email_change_request', newEmail: data.newEmail }, ip);
    return result;
  }

  // Create featured request
  async createFeaturedRequest(userId: string, data: CreateFeaturedRequestInput, ip?: string) {
    // Create pending approval for highlight request
    await pendingApprovalsService.createApproval({
      userId,
      type: PendingApprovalType.HIGHLIGHT_AD,
      requestData: { adId: data.adId, notes: data.notes },
      oldData: {},
      reason: data.notes || 'בקשה להדגשת מודעה',
    });

    const result = await brokerRepository.createFeaturedRequest(userId, data);
    await AuditService.log(userId, 'CREATE_AD', { action: 'featured_request', requestId: result.id, adId: data.adId }, ip);
    return result;
  }

  // Create data export request
  async createDataExportRequest(userId: string, ip?: string) {
    const result = await brokerRepository.createDataExportRequest(userId);
    await AuditService.log(userId, 'UPDATE_PROFILE', { action: 'data_export_request', requestId: result.id }, ip);
    return result;
  }

  // Create account deletion request
  async createAccountDeletionRequest(userId: string, data: CreateAccountDeletionRequestInput, ip?: string) {
    // Create pending approval for account deletion
    await pendingApprovalsService.createApproval({
      userId,
      type: PendingApprovalType.ACCOUNT_DELETION,
      requestData: { reason: data.reason },
      oldData: {},
      reason: data.reason,
    });

    const result = await brokerRepository.createAccountDeletionRequest(userId, data);
    await AuditService.log(userId, 'DELETE_REQ', { requestId: result.id, reason: data.reason }, ip);
    return result;
  }
}

export const brokerService = new BrokerService();
