import { prisma } from '../../config/database';

export interface EmailPermission {
  id?: number;
  email: string;
  permissionType: string;
  scope: 'one-time' | 'permanent';
  expiry?: string;
  adminNote: string;
  createdAt?: string;
  createdBy: string;
  usedAt?: string;
  isActive?: boolean;
}

export class EmailPermissionsService {
  async getAllPermissions(): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        id, 
        email, 
        permission_type as "permissionType", 
        scope, 
        expiry, 
        admin_note as "adminNote", 
        created_at as "createdAt", 
        created_by as "createdBy",
        used_at as "usedAt",
        is_active as "isActive"
      FROM email_permissions
      WHERE is_active = TRUE
      ORDER BY created_at DESC
    `;
    return result as any[];
  }

  async getPermissionsByEmail(email: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        id, 
        email, 
        permission_type as "permissionType", 
        scope, 
        expiry, 
        admin_note as "adminNote", 
        created_at as "createdAt", 
        created_by as "createdBy",
        used_at as "usedAt",
        is_active as "isActive"
      FROM email_permissions
      WHERE email = ${email} AND is_active = TRUE
      ORDER BY created_at DESC
    `;
    return result as any[];
  }

  async createPermission(permission: EmailPermission): Promise<any> {
    const { email, permissionType, scope, expiry, adminNote, createdBy } = permission;
    
    // Convert expiry to timestamp or null
    const expiryTimestamp = expiry ? new Date(expiry) : null;
    
    const result = await prisma.$queryRaw`
      INSERT INTO email_permissions 
        (email, permission_type, scope, expiry, admin_note, created_by)
      VALUES (${email}, ${permissionType}, ${scope}, ${expiryTimestamp}, ${adminNote}, ${createdBy})
      RETURNING 
        id, 
        email, 
        permission_type as "permissionType", 
        scope, 
        expiry, 
        admin_note as "adminNote", 
        created_at as "createdAt", 
        created_by as "createdBy",
        used_at as "usedAt",
        is_active as "isActive"
    `;
    
    return (result as any[])[0];
  }

  async updatePermission(id: number, updates: Partial<EmailPermission>): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.email !== undefined) {
      fields.push(`email = $${values.length + 1}`);
      values.push(updates.email);
    }
    if (updates.permissionType !== undefined) {
      fields.push(`permission_type = $${values.length + 1}`);
      values.push(updates.permissionType);
    }
    if (updates.scope !== undefined) {
      fields.push(`scope = $${values.length + 1}`);
      values.push(updates.scope);
    }
    if (updates.expiry !== undefined) {
      fields.push(`expiry = $${values.length + 1}`);
      // Convert string date to timestamp if provided
      values.push(updates.expiry ? new Date(updates.expiry) : null);
    }
    if (updates.adminNote !== undefined) {
      fields.push(`admin_note = $${values.length + 1}`);
      values.push(updates.adminNote);
    }

    const query = `
      UPDATE email_permissions
      SET ${fields.join(', ')}
      WHERE id = $${values.length + 1}
      RETURNING 
        id, 
        email, 
        permission_type as "permissionType", 
        scope, 
        expiry, 
        admin_note as "adminNote", 
        created_at as "createdAt", 
        created_by as "createdBy",
        used_at as "usedAt",
        is_active as "isActive"
    `;

    values.push(id);
    const result = await prisma.$queryRawUnsafe(query, ...values);
    return (result as any[])[0];
  }

  async deletePermission(id: number): Promise<void> {
    await prisma.$executeRaw`
      UPDATE email_permissions SET is_active = FALSE WHERE id = ${id}
    `;
  }

  async markAsUsed(id: number): Promise<void> {
    await prisma.$executeRaw`
      UPDATE email_permissions SET used_at = CURRENT_TIMESTAMP WHERE id = ${id}
    `;
  }

  async hasPermission(email: string, permissionType: string): Promise<boolean> {
    try {
      const result = await prisma.$queryRaw<{count: bigint}[]>`
        SELECT COUNT(*) as count
        FROM email_permissions
        WHERE email = ${email}
          AND permission_type = ${permissionType}
          AND is_active = TRUE
          AND (expiry IS NULL OR expiry > CURRENT_TIMESTAMP)
          AND (scope != 'one-time' OR used_at IS NULL)
      `;
      
      return Number(result[0].count) > 0;
    } catch (error: any) {
      // If table doesn't exist yet, return false (no permission)
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.log('Email permissions table not yet created, skipping permission check');
        return false;
      }
      console.error('Error checking email permission:', error);
      // On any other error, return false to allow operation to continue
      return false;
    }
  }
}

export const emailPermissionsService = new EmailPermissionsService();
