import prisma from '../../config/database';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../utils/errors';
import { EmailService } from '../email/email.service';
import { generateICS } from './ics.util';
import { AppointmentStatus } from '@prisma/client';

export class AppointmentsService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * בקשת פגישה להצגת נכס
   */
  async requestAppointment(
    userId: string,
    data: { adId: string; date: string; note?: string }
  ) {
    const requestDate = new Date(data.date);

    // בדיקה שהמשתמש לא חסום - בדיקה משולבת
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        UserAppointmentPolicy: true,
      },
    });

    if (!user) {
      throw new NotFoundError('משתמש לא נמצא');
    }

    // בדיקה אם המשתמש חסום מתיאום פגישות (שדה חדש)
    if (user.meetingsBlocked) {
      throw new ForbiddenError(
        'הפונקציה הזו אינה זמינה עבורך כעת. לפרטים, פנה לתמיכה.'
      );
    }

    // בדיקה אם יש policy ישן שחוסם
    if (user.UserAppointmentPolicy?.isBlocked) {
      throw new ForbiddenError(
        'הפונקציה הזו אינה זמינה עבורך כעת. לפרטים, פנה לתמיכה.'
      );
    }

    // טעינת המודעה
    const ad = await prisma.ad.findUnique({
      where: { id: data.adId },
      include: {
        User: {
          select: { id: true, email: true, name: true, phone: true },
        },
      },
    });

    if (!ad) {
      throw new NotFoundError('המודעה לא נמצאה');
    }

    // בדיקה שהמבקש אינו בעל המודעה
    if (ad.userId === userId) {
      throw new BadRequestError('לא ניתן לבקש פגישה למודעה שלך');
    }

    // בדיקה שהתאריך נופל בתוך אחד ה-slots של הזמינות
    const isDateValid = await this.validateDateInSlots(
      data.adId,
      requestDate
    );
    if (!isDateValid) {
      throw new BadRequestError(
        'התאריך והשעה שנבחרו אינם זמינים. אנא בחר זמן אחר.'
      );
    }

    // יצירת הפגישה
    const appointment = await prisma.appointment.create({
      data: {
        adId: data.adId,
        requesterId: userId,
        ownerId: ad.userId,
        date: requestDate,
        note: data.note,
        status: AppointmentStatus.PENDING,
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true, phone: true },
        },
        ad: {
          select: { id: true, title: true, address: true },
        },
      },
    });

    // שליחת מייל למפרסם
    await this.emailService.sendAppointmentRequestEmail(
      ad.User.email,
      {
        adTitle: ad.title,
        adId: ad.id,
        requesterName: appointment.requester.name || 'משתמש',
        date: requestDate,
        note: data.note,
        appointmentId: appointment.id,
      }
    );

    return appointment;
  }

  /**
   * בדיקה שהתאריך נופל בתוך אחד מה-slots
   */
  private async validateDateInSlots(
    adId: string,
    date: Date
  ): Promise<boolean> {
    const dayOfWeek = date.getDay(); // 0=Sunday
    const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes()
    ).padStart(2, '0')}`;

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        adId,
        dayOfWeek,
      },
    });

    // בדיקה אם השעה נופלת בתוך אחד הטווחים
    for (const slot of slots) {
      if (timeStr >= slot.startTime && timeStr <= slot.endTime) {
        return true;
      }
    }

    return false;
  }

  /**
   * קבלת פגישות שאני ביקשתי (כמבקש)
   */
  async getRequesterAppointments(userId: string) {
    return prisma.appointment.findMany({
      where: { requesterId: userId },
      include: {
        ad: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * קבלת פגישות לנכסים שלי (כבעל מודעה)
   */
  async getOwnerAppointments(ownerId: string, status?: AppointmentStatus) {
    const where: any = { ownerId };
    if (status) {
      where.status = status;
    }

    return prisma.appointment.findMany({
      where,
      include: {
        ad: {
          select: {
            id: true,
            title: true,
            address: true,
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
      orderBy: { date: 'asc' },
    });
  }

  /**
   * אישור/דחייה/הצעת מועד חדש ע"י בעל המודעה
   */
  async ownerAction(
    ownerId: string,
    data: {
      appointmentId: string;
      action: 'APPROVE' | 'REJECT' | 'RESCHEDULE';
      newDate?: string;
      reason?: string;
    }
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: {
        ad: {
          select: {
            id: true,
            title: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        requester: {
          select: { id: true, name: true, email: true },
        },
        owner: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundError('הפגישה לא נמצאה');
    }

    if (appointment.ownerId !== ownerId) {
      throw new ForbiddenError('אין לך הרשאה לבצע פעולה זו');
    }

    let newStatus: AppointmentStatus;
    let emailSent = false;

    switch (data.action) {
      case 'APPROVE':
        newStatus = AppointmentStatus.APPROVED;

        // שליחת מייל למבקש עם פרטי קשר מלאים + ICS
        const icsContent = generateICS({
          title: `פגישה - ${appointment.ad.title}`,
          description: `פגישה להצגת נכס: ${appointment.ad.title}`,
          location: appointment.ad.address || 'כתובת לא צוינה',
          startTime: appointment.date,
          endTime: new Date(appointment.date.getTime() + 60 * 60 * 1000), // +1 hour
          uid: appointment.id,
        });

        await this.emailService.sendAppointmentApprovedEmail(
          appointment.requester.email,
          {
            adTitle: appointment.ad.title,
            adAddress: appointment.ad.address || '',
            ownerName: appointment.owner.name || 'בעל הנכס',
            ownerPhone: appointment.owner.phone || '',
            date: appointment.date,
            icsContent,
          }
        );
        emailSent = true;
        break;

      case 'REJECT':
        newStatus = AppointmentStatus.REJECTED;
        await this.emailService.sendAppointmentRejectedEmail(
          appointment.requester.email,
          {
            adTitle: appointment.ad.title,
            reason: data.reason,
          }
        );
        emailSent = true;
        break;

      case 'RESCHEDULE':
        newStatus = AppointmentStatus.RESCHEDULE_REQUESTED;
        if (!data.newDate) {
          throw new BadRequestError('נדרש תאריך חדש להצעת מועד חלופי');
        }
        const newDateObj = new Date(data.newDate);
        
        // שמירת התאריך המוצע
        await prisma.appointment.update({
          where: { id: data.appointmentId },
          data: { proposedDate: newDateObj },
        });
        
        // רישום הצעת מועד חלופי בהיסטוריה
        await prisma.appointmentHistory.create({
          data: {
            appointmentId: data.appointmentId,
            fromStatus: appointment.status,
            toStatus: AppointmentStatus.RESCHEDULE_REQUESTED,
            fromDate: appointment.date,
            toDate: newDateObj,
            reason: data.reason || 'הצעת מועד חלופי על ידי בעל הנכס',
            changedById: ownerId,
          },
        });
        
        await this.emailService.sendAppointmentRescheduleEmail(
          appointment.requester.email,
          {
            adTitle: appointment.ad.title,
            originalDate: appointment.date,
            newDate: newDateObj,
            appointmentId: appointment.id,
          }
        );
        emailSent = true;
        break;
    }

    // עדכון סטטוס הפגישה
    const updated = await prisma.appointment.update({
      where: { id: data.appointmentId },
      data: { status: newStatus },
    });

    return { appointment: updated, emailSent };
  }

  /**
   * קביעת/עדכון זמינות למודעה
   */
  async setAdAvailability(
    userId: string,
    data: {
      adId: string;
      slots: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
      }>;
    }
  ) {
    // בדיקה שהמודעה שייכת למשתמש
    const ad = await prisma.ad.findUnique({
      where: { id: data.adId },
      select: { userId: true },
    });

    if (!ad) {
      throw new NotFoundError('המודעה לא נמצאה');
    }

    if (ad.userId !== userId) {
      throw new ForbiddenError('אין לך הרשאה לערוך זמינות למודעה זו');
    }

    // מחיקת slots קיימים
    await prisma.availabilitySlot.deleteMany({
      where: { adId: data.adId },
    });

    // יצירת slots חדשים
    if (data.slots.length > 0) {
      await prisma.availabilitySlot.createMany({
        data: data.slots.map((slot) => ({
          adId: data.adId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      });
    }

    // החזרת הזמינות המעודכנת
    const updatedSlots = await prisma.availabilitySlot.findMany({
      where: { adId: data.adId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return updatedSlots;
  }

  /**
   * קבלת זמינות מודעה (פומבי)
   */
  async getAdAvailability(adId: string) {
    return prisma.availabilitySlot.findMany({
      where: { adId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * אישור מועד חלופי על ידי המבקש
   */
  async confirmReschedule(userId: string, appointmentId: string) {
    // בדיקה שהפגישה קיימת ושהמשתמש הוא המבקש
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        ad: { select: { title: true } },
        owner: { select: { email: true, name: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundError('הפגישה לא נמצאה');
    }

    if (appointment.requesterId !== userId) {
      throw new ForbiddenError('אין לך הרשאה לאשר פגישה זו');
    }

    if (appointment.status !== AppointmentStatus.RESCHEDULE_REQUESTED) {
      throw new BadRequestError('הפגישה לא במצב של הצעת מועד חלופי');
    }

    if (!appointment.proposedDate) {
      throw new BadRequestError('לא נמצא תאריך מוצע חלופי');
    }

    // עדכון התאריך לתאריך המוצע ואישור הפגישה
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { 
        date: appointment.proposedDate,
        status: AppointmentStatus.APPROVED,
        proposedDate: null // ניקוי התאריך המוצע
      },
    });

    // רישום שינוי תאריך בהיסטוריה
    await prisma.appointmentHistory.create({
      data: {
        appointmentId,
        fromStatus: AppointmentStatus.RESCHEDULE_REQUESTED,
        toStatus: AppointmentStatus.APPROVED,
        fromDate: appointment.date,
        toDate: appointment.proposedDate,
        reason: 'אישור מועד חלופי על ידי המבקש',
        changedById: userId,
      },
    });

    // שליחת מייל אישור לבעל הנכס
    const icsContent = generateICS({
      title: `פגישה להצגת ${appointment.ad.title}`,
      description: `פגישה להצגת נכס מאושרת`,
      location: appointment.ad.city || '',
      startTime: updated.date,
      endTime: new Date(updated.date.getTime() + 60 * 60 * 1000), // +1 hour
      uid: `appointment-${appointmentId}`,
    });

    await this.emailService.sendAppointmentApprovedEmail(
      appointment.owner.email,
      {
        adTitle: appointment.ad.title,
        adAddress: appointment.ad.city || '',
        ownerName: appointment.owner.name || 'בעל הנכס',
        ownerPhone: '',
        date: updated.date,
        icsContent,
      }
    );

    return updated;
  }

  /**
   * ביטול פגישה על ידי המבקש
   */
  async cancelAppointment(userId: string, appointmentId: string) {
    // בדיקה שהפגישה קיימת ושהמשתמש הוא המבקש
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        ad: { select: { title: true } },
        owner: { select: { email: true, name: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundError('הפגישה לא נמצאה');
    }

    if (appointment.requesterId !== userId) {
      throw new ForbiddenError('אין לך הרשאה לבטל פגישה זו');
    }

    // מחיקת הפגישה
    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    // שליחת מייל לבעל הנכס על הביטול
    await this.emailService.sendEmail(
      appointment.owner.email,
      'ביטול פגישה - מיעדליעד',
      `
        <div dir="rtl" style="font-family: Arial; padding: 20px;">
          <h2>ביטול פגישה</h2>
          <p>הפגישה להצגת הנכס "${appointment.ad.title}" בוטלה על ידי המבקש.</p>
          <p><strong>תאריך המקורי:</strong> ${new Date(appointment.date).toLocaleString('he-IL')}</p>
        </div>
      `
    );

    return { success: true };
  }

  /**
   * חסימה/ביטול חסימה של משתמש על ידי אדמין
   */
  async setUserAppointmentPolicy(
    adminId: string,
    data: {
      userId: string;
      isBlocked: boolean;
      blockReason?: string;
    }
  ) {
    // עדכון או יצירת policy
    const policy = await prisma.userAppointmentPolicy.upsert({
      where: { userId: data.userId },
      create: {
        userId: data.userId,
        isBlocked: data.isBlocked,
        blockReason: data.blockReason,
        updatedById: adminId,
      },
      update: {
        isBlocked: data.isBlocked,
        blockReason: data.blockReason,
        updatedById: adminId,
      },
    });

    // רישום ב-audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action: data.isBlocked ? 'BLOCK_APPOINTMENTS' : 'UNBLOCK_APPOINTMENTS',
        targetId: data.userId,
        meta: {
          reason: data.blockReason,
        },
      },
    });

    return policy;
  }

  /**
   * קבלת policy של משתמש
   */
  async getUserAppointmentPolicy(userId: string) {
    return prisma.userAppointmentPolicy.findUnique({
      where: { userId },
    });
  }
}
