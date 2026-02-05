import { brokerRepository } from './broker.repository';
import { AuditService } from '../profile/audit.service';
import { pendingApprovalsService } from '../admin/pending-approvals.service';
import { PendingApprovalType } from '@prisma/client';
import prisma from '../../config/database';
import * as XLSX from 'xlsx';
import fs from 'fs/promises';
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

  // Request import permission
  async requestImportPermission(userId: string, reason: string, ip?: string) {
    // Check if already has permission or pending request
    const existingApproval = await prisma.pendingApproval.findFirst({
      where: {
        userId,
        type: PendingApprovalType.IMPORT_PROPERTIES_PERMISSION,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingApproval) {
      if (existingApproval.status === 'APPROVED') {
        throw new Error('כבר יש לך הרשאה לייבוא נכסים');
      }
      throw new Error('קיימת בקשה ממתינה להרשאת ייבוא');
    }

    // Create pending approval
    const result = await pendingApprovalsService.createApproval({
      userId,
      type: PendingApprovalType.IMPORT_PROPERTIES_PERMISSION,
      requestData: { reason },
      oldData: {},
      reason: reason || 'בקשת הרשאה לייבוא נכסים מקובץ',
    });

    await AuditService.log(userId, 'IMPORT_PERMISSION_REQUEST', { approvalId: result.id }, ip);
    return result;
  }

  // Check if broker has import permission
  async checkImportPermission(userId: string): Promise<boolean> {
    const approval = await prisma.pendingApproval.findFirst({
      where: {
        userId,
        type: PendingApprovalType.IMPORT_PROPERTIES_PERMISSION,
        status: 'APPROVED',
      },
    });

    return !!approval;
  }

  // Import properties preview
  async importPropertiesPreview(userId: string, file: Express.Multer.File, categoryId: string, adType: string) {
    // Check permission
    const hasPermission = await this.checkImportPermission(userId);
    if (!hasPermission) {
      await fs.unlink(file.path);
      throw new Error('אין לך הרשאה לייבוא נכסים. נא לבקש הרשאה תחילה.');
    }

    // Validate file type
    const ext = file.originalname.toLowerCase().split('.').pop();
    if (ext !== 'xlsx' && ext !== 'xls') {
      await fs.unlink(file.path);
      throw new Error('ייבוא נכסים דורש קובץ XLSX בלבד');
    }

    // Read Excel file
    const workbook = XLSX.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    // Clean up temp file
    await fs.unlink(file.path);

    if (data.length === 0) {
      throw new Error('הקובץ ריק');
    }

    // Validate rows
    const preview: any[] = [];
    let validRows = 0;
    let invalidRows = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const errors: string[] = [];

      // Basic validation
      if (!row['שם'] || !row['טלפון']) {
        errors.push('חסרים שם או טלפון');
      }

      const status = errors.length > 0 ? 'שגוי' : 'תקין';
      if (status === 'תקין') {
        validRows++;
      } else {
        invalidRows++;
      }

      preview.push({
        rowNumber: i + 2, // Excel rows start at 2 (after header)
        ...row,
        status,
        errors,
      });
    }

    return {
      fileName: file.originalname,
      totalRows: data.length,
      validRows,
      invalidRows,
      duplicates: 0,
      warnings: [],
      preview,
    };
  }

  // Import properties commit
  async importPropertiesCommit(userId: string, categoryId: string, adType: string, data: any[], ip?: string) {
    // Force reload - updated city/street lookup logic
    console.log('🚀 Starting import commit:', { userId, categoryId, adType, dataLength: data.length });
    
    // Check permission
    const hasPermission = await this.checkImportPermission(userId);
    if (!hasPermission) {
      throw new Error('אין לך הרשאה לייבוא נכסים');
    }

    // Find category
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new Error('קטגוריה לא נמצאה');
    }

    console.log('📁 Category found:', category.nameHe);

    const isWanted = adType && adType.includes('WANTED');
    let successCount = 0;
    const errors: any[] = [];
    const createdAds: any[] = [];

    // Import each valid row
    for (const row of data) {
      try {
        console.log('📝 Processing row:', row);
        
        // Build custom fields
        const customFields = this.buildCustomFields(row, category.slug, adType);

        // Build title
        const title = this.buildTitle(row, category.slug, adType);
        
        // Build address
        const address = this.buildAddress(row, adType);

        console.log('🏗️ Built ad data:', { title, address, customFields });

        // For wanted ads: requestedLocationText
        const requestedLocationText = isWanted ? (row['רחוב / אזור מבוקש'] || row.requestedLocation) : null;

        // Find city if provided (for regular ads)
        let cityRecord = null;
        let streetRecord = null;
        let neighborhood = null;
        
        if (!isWanted && row['עיר']) {
          const cityName = row['עיר'].toString().trim();
          console.log('🔍 Searching for city:', cityName);
          
          cityRecord = await prisma.city.findFirst({
            where: { 
              OR: [
                { name: { equals: cityName, mode: 'insensitive' } },
                { nameHe: { equals: cityName, mode: 'insensitive' } },
                { name: { contains: cityName, mode: 'insensitive' } },
                { nameHe: { contains: cityName, mode: 'insensitive' } },
              ]
            },
          });
          console.log('🏙️ City found:', cityRecord ? `${cityRecord.nameHe} (ID: ${cityRecord.id})` : 'NOT FOUND');
          
          // Find street if city found and street provided
          if (cityRecord && row['רחוב']) {
            const streetName = row['רחוב'].toString().trim();
            console.log('🔍 Searching for street:', streetName, 'in city:', cityRecord.nameHe);
            
            streetRecord = await prisma.street.findFirst({
              where: {
                OR: [
                  { name: { equals: streetName, mode: 'insensitive' } },
                  { name: { contains: streetName, mode: 'insensitive' } },
                ],
                cityId: cityRecord.id,
              },
              include: {
                Neighborhood: true,
              },
            });
            console.log('🛣️ Street found:', streetRecord ? `${streetRecord.name} (ID: ${streetRecord.id})` : 'NOT FOUND');
            
            if (streetRecord?.Neighborhood) {
              neighborhood = streetRecord.Neighborhood.name;
              console.log('🏘️ Neighborhood:', neighborhood);
            }
          }
        }

        // Create ad with PENDING status
        const newAd = await prisma.ad.create({
          data: {
            id: `ad-import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title,
            description: row['תיאור הנכס'] || row.description || 'נכס מיובא',
            price: row['מחיר'] ? parseFloat(row['מחיר'].toString()) : null,
            userId,
            categoryId: category.id,
            cityId: cityRecord?.id,
            streetId: streetRecord?.id,
            neighborhood: neighborhood,
            address,
            requestedLocationText,
            isWanted: isWanted || false,
            adType,
            customFields,
            status: 'PENDING',
            updatedAt: new Date(),
          },
        });

        console.log('✅ Ad created:', newAd.id);
        createdAds.push(newAd);
        successCount++;
      } catch (error: any) {
        console.error('❌ Error creating ad:', error.message);
        errors.push({
          row: row.rowNumber,
          error: error.message,
        });
      }
    }

    console.log('📊 Import summary:', { successCount, failedCount: errors.length });

    await AuditService.log(userId, 'IMPORT_PROPERTIES', {
      categoryId,
      adType,
      totalRows: data.length,
      successRows: successCount,
      failedRows: errors.length,
    }, ip);

    return {
      success: true,
      totalRows: data.length,
      successRows: successCount,
      failedRows: errors.length,
      errors: errors.slice(0, 10),
      createdAds: createdAds,
    };
  }

  // Helper: Build custom fields from row data
  private buildCustomFields(row: any, categorySlug: string, adType: string): any {
    const fields: any = {};
    
    // Common fields
    if (row['תיווך']) fields.isBrokered = this.parseBoolean(row['תיווך']);
    if (row['סוג הנכס']) fields.propertyType = row['סוג הנכס'];
    if (row['מספר חדרים']) fields.rooms = parseFloat(row['מספר חדרים'].toString());
    if (row['שטח במר']) fields.squareMeters = parseFloat(row['שטח במר'].toString());
    if (row['קומה']) fields.floor = row['קומה'].toString();
    if (row['מצב הנכס']) fields.condition = row['מצב הנכס'];
    if (row['ריהוט']) fields.furniture = row['ריהוט'];
    if (row['תאריך כניסה']) fields.entryDate = row['תאריך כניסה'];
    if (row['ארנונה']) fields.propertyTax = parseFloat(row['ארנונה'].toString());
    if (row['ועד בית']) fields.vaadBait = parseFloat(row['ועד בית'].toString());
    
    // Boolean fields
    if (row['חניה']) fields.parking = this.parseBoolean(row['חניה']);
    if (row['מחסן']) fields.storage = this.parseBoolean(row['מחסן']);
    if (row['ממד']) fields.shelter = this.parseBoolean(row['ממד']);
    if (row['מרפסת סוכה']) fields.sukkahBalcony = this.parseBoolean(row['מרפסת סוכה']);
    if (row['מעלית']) fields.elevator = this.parseBoolean(row['מעלית']);
    if (row['נוף']) fields.view = this.parseBoolean(row['נוף']);
    if (row['יחידת הורים']) fields.masterBedroom = this.parseBoolean(row['יחידת הורים']);
    if (row['יחידת דיור']) fields.housingUnit = this.parseBoolean(row['יחידת דיור']);
    if (row['חצר']) fields.yard = this.parseBoolean(row['חצר']);
    if (row['מיזוג']) fields.airConditioning = this.parseBoolean(row['מיזוג']);
    if (row['אופציה']) fields.option = this.parseBoolean(row['אופציה']);
    
    // Wanted-specific fields
    if (row['מספר מרפסות'] || row['מרפסות']) {
      fields.balconies = parseFloat((row['מספר מרפסות'] || row['מרפסות']).toString());
    }

    // Contact info
    if (row['שם']) fields.contactName = row['שם'];
    if (row['טלפון']) fields.contactPhone = row['טלפון'];

    return fields;
  }

  // Helper: Build title from row data
  private buildTitle(row: any, categorySlug: string, adType: string): string {
    const isWanted = adType && adType.includes('WANTED');
    
    if (isWanted) {
      const rooms = row['מספר חדרים'] || '';
      const location = row['רחוב / אזור מבוקש'] || '';
      return `מחפש ${row['סוג הנכס'] || 'נכס'} ${rooms ? rooms + ' חדרים' : ''} ${location ? 'ב' + location : ''}`.trim();
    }
    
    const propertyType = row['סוג הנכס'] || 'נכס';
    const rooms = row['מספר חדרים'] || '';
    const city = row['עיר'] || '';
    const street = row['רחוב'] || '';
    
    return `${propertyType} ${rooms ? rooms + ' חדרים' : ''} ${street ? 'ב' + street : ''} ${city}`.trim();
  }

  // Helper: Build address from row data
  private buildAddress(row: any, adType: string): string | null {
    const isWanted = adType && adType.includes('WANTED');
    
    if (isWanted) {
      return null; // Wanted ads don't have specific address
    }
    
    const street = row['רחוב'] || '';
    const houseNumber = row['מספר בית'] || '';
    
    if (!street) return null;
    
    return `${street}${houseNumber ? ' ' + houseNumber : ''}`.trim();
  }

  // Helper: Parse boolean values
  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      return lower === 'כן' || lower === 'yes' || lower === 'true' || lower === '1';
    }
    return false;
  }
}

export const brokerService = new BrokerService();
