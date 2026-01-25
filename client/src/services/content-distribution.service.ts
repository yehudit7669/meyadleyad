import api from './api';

export interface ContentItem {
  id: string;
  title: string;
  type: 'PDF' | 'LINK';
  url: string;
  thumbnailUrl?: string;
  status: 'ACTIVE' | 'NOT_DISTRIBUTED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastDistributedAt?: string;
  distributionCount: number;
}

export interface MailingSubscriber {
  id: string;
  email: string;
  name?: string;
  status: 'ACTIVE' | 'OPT_OUT' | 'BLOCKED';
  unsubscribedAt?: string;
  blockedAt?: string;
  blockedBy?: string;
  emailUpdatesEnabled: boolean;
  emailUpdatesCategories?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DistributionStats {
  subscribers: {
    total: number;
    active: number;
    optOut: number;
    blocked: number;
  };
  content: {
    total: number;
    active: number;
  };
  distributions: {
    total: number;
    last30Days: number;
    last?: {
      date: string;
      contentTitle: string;
      contentType: string;
      recipientsReached: number;
      totalRecipients: number;
      mode: string;
    };
  };
}

export interface DistributionHistory {
  id: string;
  contentItemId: string;
  mode: 'INITIAL' | 'REDISTRIBUTE' | 'PUSH';
  recipientsCount: number;
  successCount: number;
  failedCount: number;
  distributedAt: string;
  distributedBy: string;
  contentItem: {
    title: string;
    type: string;
  };
}

export interface CreateContentItemDto {
  title: string;
  type: 'PDF' | 'LINK';
  url: string;
  thumbnailUrl?: string;
}

export interface UpdateContentItemDto {
  title?: string;
  status?: 'ACTIVE' | 'NOT_DISTRIBUTED' | 'ARCHIVED';
  thumbnailUrl?: string;
}

export interface DistributeContentDto {
  contentItemId: string;
  mode: 'INITIAL' | 'REDISTRIBUTE' | 'PUSH';
  recipientEmails?: string[];
}

export interface AddSubscriberDto {
  email: string;
  name?: string;
}

export interface UpdateSubscriberDto {
  status?: 'ACTIVE' | 'OPT_OUT' | 'BLOCKED';
  name?: string;
  emailUpdatesEnabled?: boolean;
  emailUpdatesCategories?: string[];
}

class ContentDistributionService {
  // ========== Content Items ==========
  
  async getContentItems(): Promise<ContentItem[]> {
    const response = await api.get('/admin/content-distribution/content-items');
    return response.data;
  }

  async createContentItem(data: CreateContentItemDto): Promise<ContentItem> {
    const response = await api.post('/admin/content-distribution/content-items', data);
    return response.data;
  }

  async updateContentItem(id: string, data: UpdateContentItemDto): Promise<ContentItem> {
    const response = await api.patch(`/admin/content-distribution/content-items/${id}`, data);
    return response.data;
  }

  async deleteContentItem(id: string): Promise<void> {
    await api.delete(`/admin/content-distribution/content-items/${id}`);
  }

  async distributeContent(data: DistributeContentDto): Promise<{
    distributionId: string;
    totalRecipients: number;
    successCount: number;
    failedCount: number;
  }> {
    const response = await api.post(
      `/admin/content-distribution/content-items/${data.contentItemId}/distribute`,
      data
    );
    return response.data;
  }

  // ========== Mailing List ==========

  async getSubscribers(status?: 'ACTIVE' | 'OPT_OUT' | 'BLOCKED'): Promise<MailingSubscriber[]> {
    const params = status ? { status } : {};
    const response = await api.get('/admin/content-distribution/mailing-list', { params });
    return response.data;
  }

  async addSubscriber(data: AddSubscriberDto): Promise<MailingSubscriber> {
    const response = await api.post('/admin/content-distribution/mailing-list', data);
    return response.data;
  }

  async updateSubscriber(id: string, data: UpdateSubscriberDto): Promise<MailingSubscriber> {
    const response = await api.patch(`/admin/content-distribution/mailing-list/${id}`, data);
    return response.data;
  }

  async removeSubscriber(id: string): Promise<void> {
    await api.delete(`/admin/content-distribution/mailing-list/${id}`);
  }

  // ========== Statistics ==========

  async getStats(): Promise<DistributionStats> {
    const response = await api.get('/admin/content-distribution/stats');
    return response.data;
  }

  async exportStats(): Promise<Blob> {
    const response = await api.get('/admin/content-distribution/stats/export', {
      responseType: 'blob',
    });
    return response.data;
  }

  async getDistributionHistory(limit: number = 50): Promise<DistributionHistory[]> {
    const response = await api.get('/admin/content-distribution/history', {
      params: { limit },
    });
    return response.data;
  }

  // ========== Public ==========

  async unsubscribe(emailOrToken: string, isToken: boolean = false): Promise<void> {
    const data = isToken ? { token: emailOrToken } : { email: emailOrToken };
    await api.post('/admin/content-distribution/unsubscribe', data);
  }
}

export const contentDistributionService = new ContentDistributionService();
