import api from './api';

export interface BrokerProfile {
  user: {
    id: string;
    email: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    phonePersonal: string | null;
    businessPhone: string | null;
    weeklyDigestOptIn: boolean;
    pendingEmail: string | null;
    role: string;
    userType: string | null;
    serviceProviderType: string | null;
  };
  office: {
    id: string;
    businessName: string;
    businessAddressApproved: string;
    businessAddressPending: string | null;
    businessPhone: string | null;
    website: string | null;
    aboutBusinessApproved: string | null;
    aboutBusinessPending: string | null;
    publishOfficeAddress: boolean;
    logoUrlApproved: string | null;
    logoUrlPending: string | null;
  } | null;
  teamMembers: BrokerTeamMember[];
  stats: {
    totalAds: number;
    activeAds: number;
  };
}

export interface BrokerTeamMember {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export interface BrokerAd {
  id: string;
  title: string;
  adNumber: number;
  status: string;
  createdAt: string;
  Category?: {
    nameHe: string;
  };
  City?: {
    nameHe: string;
  };
  AdImage?: Array<{
    url: string;
  }>;
}

export interface BrokerAppointment {
  id: string;
  date: string;
  status: string;
  note: string | null;
  ad: {
    id: string;
    title: string;
    adNumber: number;
  };
  requester: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

export interface AvailabilitySlot {
  id: string;
  adId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export const brokerService = {
  // Get complete profile
  getProfile: async (): Promise<BrokerProfile> => {
    const response = await api.get('/broker/profile');
    return response.data;
  },

  // Update personal details
  updatePersonalDetails: async (data: {
    fullName?: string;
    phonePersonal?: string;
    businessPhone?: string;
  }) => {
    const response = await api.patch('/broker/profile/personal', data);
    return response.data;
  },

  // Update office details
  updateOfficeDetails: async (data: {
    businessName?: string;
    businessAddressPending?: string;
    website?: string;
    publishOfficeAddress?: boolean;
    aboutBusinessPending?: string;
  }) => {
    const response = await api.patch('/broker/profile/office', data);
    return response.data;
  },

  // Upload logo
  uploadLogo: async (logoUrl: string) => {
    const response = await api.post('/broker/profile/logo', { logoUrl });
    return response.data;
  },

  // Team management
  getTeamMembers: async (): Promise<BrokerTeamMember[]> => {
    const response = await api.get('/broker/team');
    return response.data;
  },

  createTeamMember: async (data: {
    fullName: string;
    email: string;
    phone: string;
  }) => {
    const response = await api.post('/broker/team', data);
    return response.data;
  },

  updateTeamMember: async (
    id: string,
    data: {
      fullName?: string;
      email?: string;
      phone?: string;
      isActive?: boolean;
    }
  ) => {
    const response = await api.patch(`/broker/team/${id}`, data);
    return response.data;
  },

  deleteTeamMember: async (id: string) => {
    const response = await api.delete(`/broker/team/${id}`);
    return response.data;
  },

  // Ads
  getBrokerAds: async (): Promise<BrokerAd[]> => {
    const response = await api.get('/broker/ads');
    return response.data;
  },

  // Appointments
  getAppointments: async (): Promise<BrokerAppointment[]> => {
    const response = await api.get('/broker/appointments');
    return response.data;
  },

  respondToAppointment: async (
    id: string,
    data: {
      status: 'APPROVED' | 'REJECTED' | 'RESCHEDULE_REQUESTED';
      note?: string;
      newDate?: string;
    }
  ) => {
    const response = await api.patch(`/broker/appointments/${id}/respond`, data);
    return response.data;
  },

  // Availability
  getAvailabilitySlots: async (adId: string): Promise<AvailabilitySlot[]> => {
    const response = await api.get(`/broker/availability/${adId}`);
    return response.data;
  },

  createAvailabilitySlot: async (data: {
    adId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }) => {
    const response = await api.post('/broker/availability', data);
    return response.data;
  },

  deleteAvailabilitySlot: async (id: string) => {
    const response = await api.delete(`/broker/availability/${id}`);
    return response.data;
  },

  // Communication
  updateCommunication: async (data: { weeklyDigestOptIn: boolean }) => {
    const response = await api.patch('/broker/communication', data);
    return response.data;
  },

  // Email change
  requestEmailChange: async (newEmail: string) => {
    const response = await api.post('/broker/email/change-request', { newEmail });
    return response.data;
  },

  // Featured request
  createFeaturedRequest: async (data: { adId: string; notes?: string }) => {
    const response = await api.post('/broker/featured-request', data);
    return response.data;
  },

  // Account management
  createExportRequest: async () => {
    const response = await api.post('/broker/account/export-request');
    return response.data;
  },

  createDeleteRequest: async (reason?: string) => {
    const response = await api.post('/broker/account/delete-request', { reason });
    return response.data;
  },
};
