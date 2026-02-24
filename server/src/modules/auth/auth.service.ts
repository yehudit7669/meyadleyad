import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import prisma from '../../config/database';
import { config } from '../../config';
import { ConflictError, UnauthorizedError, ValidationError } from '../../utils/errors';
import { UserRole, PendingApprovalType, ApprovalStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { pendingApprovalsService } from '../admin/pending-approvals.service';

const googleClient = new OAuth2Client(config.google.clientId);

export class AuthService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }
  async register(data: {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    role?: UserRole;
    companyName?: string;
    licenseNumber?: string;
  }) {
    console.log('AuthService.register called with:', { ...data, password: '***' });
    
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      console.log('User already exists:', data.email);
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    console.log('Creating user with data - email:', data.email);

    // יצירת verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // תוקף ל-24 שעות

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role || UserRole.USER,
        isEmailVerified: false,
        isVerified: false,
        verificationToken,
        verificationExpires,
        name: data.name || undefined,
        phone: data.phone || undefined,
        companyName: data.companyName || undefined,
        licenseNumber: data.licenseNumber || undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        companyName: true,
        licenseNumber: true,
      },
    });

    console.log('User created successfully:', user.id);

    // שליחת מייל אימות
    try {
      await this.emailService.sendVerificationEmail(user.email, verificationToken);
      console.log('✅ Verification email sent to:', user.email);
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      // לא זורקים שגיאה - המשתמש נוצר בהצלחה
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    console.log('Registration complete, returning user and tokens');
    return { 
      user: {
        ...user,
        isAdmin: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR',
        isBroker: user.role === 'BROKER',
      }, 
      ...tokens 
    };
  }

  async registerServiceProvider(data: {
    serviceProviderType: 'BROKER' | 'LAWYER' | 'APPRAISER' | 'DESIGNER_ARCHITECT' | 'MORTGAGE_ADVISOR';
    firstName: string;
    lastName: string;
    phonePersonal: string;
    email: string;
    password: string;
    businessName: string;
    businessAddress: string;
    businessPhone?: string;
    website?: string;
    brokerLicenseNumber?: string;
    brokerCityId?: string;
    weeklyDigestOptIn: boolean;
    termsAccepted: boolean;
    declarationAccepted: boolean;
  }) {
    console.log('AuthService.registerServiceProvider called with:', { 
      ...data, 
      password: '***' 
    });

    // בדיקה שהמייל לא קיים
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      console.log('User already exists:', data.email);
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // יצירת verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    // קביעת role בהתאם לסוג נותן השירות
    const role = data.serviceProviderType === 'BROKER' ? 'BROKER' : 'SERVICE_PROVIDER';

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: role as any,
        userType: 'SERVICE_PROVIDER' as any,
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`, // שמירה גם ב-name לתאימות לאחור
        phonePersonal: data.phonePersonal,
        phone: data.phonePersonal, // גם ב-phone לתאימות לאחור
        serviceProviderType: data.serviceProviderType as any,
        businessName: data.businessName,
        companyName: data.businessName, // גם ב-companyName לתאימות לאחור
        // שמירת הכתובת כ-pending עד לאישור מנהל
        officeAddressPending: data.businessAddress,
        officeAddressStatus: ApprovalStatus.PENDING,
        businessPhone: data.businessPhone || undefined,
        website: data.website || undefined,
        brokerLicenseNumber: data.brokerLicenseNumber || undefined,
        licenseNumber: data.brokerLicenseNumber || undefined, // גם ב-licenseNumber לתאימות לאחור
        brokerCityId: data.brokerCityId || undefined,
        weeklyDigestOptIn: data.weeklyDigestOptIn,
        termsAcceptedAt: data.termsAccepted ? new Date() : undefined,
        declarationAcceptedAt: data.declarationAccepted ? new Date() : undefined,
        isEmailVerified: false,
        isVerified: false,
        verificationToken,
        verificationExpires,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        role: true,
        userType: true,
        serviceProviderType: true,
        businessName: true,
        phonePersonal: true,
      },
    });

    console.log('Service provider created successfully:', user.id);

    // יצירת pending approval לכתובת המשרד
    try {
      await pendingApprovalsService.createApproval({
        userId: user.id,
        type: PendingApprovalType.OFFICE_ADDRESS_UPDATE,
        requestData: { address: data.businessAddress },
        oldData: null,
        reason: 'כתובת משרד חדשה מהרשמה',
      });
      console.log('✅ Pending approval created for office address');
    } catch (error) {
      console.error('❌ Failed to create pending approval:', error);
    }

    // למתווכים - יצירת BrokerOffice עם כתובת pending
    if (data.serviceProviderType === 'BROKER') {
      try {
        await prisma.brokerOffice.create({
          data: {
            brokerOwnerUserId: user.id,
            businessName: data.businessName,
            businessAddressPending: data.businessAddress,
            businessPhone: data.businessPhone || undefined,
            publishOfficeAddress: false, // כברירת מחדל לא מפרסם עד שמאושר
          },
        });
        console.log('✅ BrokerOffice created for broker');
      } catch (error) {
        console.error('❌ Failed to create BrokerOffice:', error);
      }
    }

    // שליחת מייל אימות
    try {
      await this.emailService.sendVerificationEmail(user.email, verificationToken);
      console.log('✅ Verification email sent to:', user.email);
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    console.log('Service provider registration complete');
    return {
      user: {
        ...user,
        isAdmin: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR',
        isBroker: user.role === 'BROKER',
        isServiceProvider: true,
      },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    console.log('AuthService.login called for:', email);
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      console.log('Login failed: user not found or no password');
      throw new UnauthorizedError('Invalid credentials');
    }

    console.log('User found, comparing password');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('Login failed: invalid password');
      throw new UnauthorizedError('Invalid credentials');
    }

    console.log('Password valid, generating tokens');
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    console.log('✅ LOGIN SUCCESS - CURRENT USER ROLE:', user.role, 'userType:', user.userType, 'serviceProviderType:', user.serviceProviderType);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        userType: user.userType,
        serviceProviderType: user.serviceProviderType,
        isAdmin: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR',
        isBroker: user.role === 'BROKER',
        phone: user.phone,
        phonePersonal: user.phonePersonal,
        companyName: user.companyName,
        avatar: user.avatar,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    };
  }

  async googleAuth(token: string) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: config.google.clientId,
      });

      const payload = ticket.getPayload();
      
      if (!payload || !payload.email) {
        throw new ValidationError('Invalid Google token');
      }

      let user = await prisma.user.findUnique({
        where: { email: payload.email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: payload.email,
            name: payload.name || 'User',
            googleId: payload.sub,
            avatar: payload.picture,
            isVerified: true, // backward compatibility
            isEmailVerified: true, // Google emails are pre-verified
          },
        });
      } else if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: payload.sub },
        });
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isAdmin: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR',
          isBroker: user.role === 'BROKER',
          avatar: user.avatar,
        },
        ...tokens,
      };
    } catch (error) {
      throw new ValidationError('Invalid Google token');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      jwt.verify(refreshToken, config.jwt.refreshSecret);

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      const tokens = await this.generateTokens(
        storedToken.user.id,
        storedToken.user.email,
        storedToken.user.role
      );

      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw error;
    }
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const jwtSecret: string = config.jwt.secret;
    const jwtRefreshSecret: string = config.jwt.refreshSecret;
    const jwtExpiresIn: string = config.jwt.expiresIn;
    const jwtRefreshExpiresIn: string = config.jwt.refreshExpiresIn;

    // @ts-ignore - config.jwt types are correctly defined
    const accessToken = jwt.sign(
      { userId, email, role },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    // @ts-ignore - config.jwt types are correctly defined
    const refreshToken = jwt.sign(
      { userId, email, role },
      jwtRefreshSecret,
      { expiresIn: jwtRefreshExpiresIn }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: { gt: new Date() }, // Check if not expired
      },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        isVerified: true, // backward compatibility
        verificationToken: null,
        verificationExpires: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpires,
        // Keep legacy fields for backward compatibility
        resetToken: resetToken,
        resetTokenExpiry: resetTokenExpires,
      },
    });

    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken);
      console.log('✅ Password reset email sent to:', email);
    } catch (error) {
      console.error('❌ Failed to send reset email:', error);
      // Don't throw error - we don't want to reveal if email exists
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }, // Check if not expired
      },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        // Clear legacy fields too
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    console.log('✅ Password reset successfully for user:', user.email);
    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new UnauthorizedError('משתמש לא נמצא');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('הסיסמה הנוכחית שגויה');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('הסיסמה החדשה חייבת להכיל לפחות 6 תווים');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    console.log('✅ Password changed successfully for user:', user.email);
    return { message: 'הסיסמה שונתה בהצלחה' };
  }
}
