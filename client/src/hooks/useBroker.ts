import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brokerService } from '../services/brokerService';

// Profile hooks
export const useBrokerProfile = () => {
  return useQuery({
    queryKey: ['broker', 'profile'],
    queryFn: brokerService.getProfile,
  });
};

export const useUpdatePersonalDetails = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: brokerService.updatePersonalDetails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker', 'profile'] });
    },
  });
};

export const useUpdateOfficeDetails = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: brokerService.updateOfficeDetails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker', 'profile'] });
    },
  });
};

export const useUploadLogo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: brokerService.uploadLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker', 'profile'] });
    },
  });
};

// Team hooks
export const useBrokerTeam = () => {
  return useQuery({
    queryKey: ['broker', 'team'],
    queryFn: brokerService.getTeamMembers,
  });
};

export const useCreateTeamMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: brokerService.createTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker', 'team'] });
      queryClient.invalidateQueries({ queryKey: ['broker', 'profile'] });
    },
  });
};

export const useUpdateTeamMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      brokerService.updateTeamMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker', 'team'] });
    },
  });
};

export const useDeleteTeamMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: brokerService.deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker', 'team'] });
      queryClient.invalidateQueries({ queryKey: ['broker', 'profile'] });
    },
  });
};

// Ads hooks
export const useBrokerAds = () => {
  return useQuery({
    queryKey: ['broker', 'ads'],
    queryFn: brokerService.getBrokerAds,
  });
};

// Appointments hooks
export const useBrokerAppointments = () => {
  return useQuery({
    queryKey: ['broker', 'appointments'],
    queryFn: brokerService.getAppointments,
  });
};

export const useRespondToAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      brokerService.respondToAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker', 'appointments'] });
    },
  });
};

// Availability hooks
export const useAvailabilitySlots = (adId: string | null) => {
  return useQuery({
    queryKey: ['broker', 'availability', adId],
    queryFn: () => brokerService.getAvailabilitySlots(adId!),
    enabled: !!adId,
  });
};

export const useCreateAvailabilitySlot = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: brokerService.createAvailabilitySlot,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['broker', 'availability', variables.adId] });
    },
  });
};

export const useDeleteAvailabilitySlot = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: brokerService.deleteAvailabilitySlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker', 'availability'] });
    },
  });
};

// Communication hooks
export const useUpdateCommunication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: brokerService.updateCommunication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker', 'profile'] });
    },
  });
};

// Email change hook
export const useRequestEmailChange = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: brokerService.requestEmailChange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker', 'profile'] });
    },
  });
};

// Featured request hook
export const useCreateFeaturedRequest = () => {
  return useMutation({
    mutationFn: brokerService.createFeaturedRequest,
  });
};

// Account management hooks
export const useCreateExportRequest = () => {
  return useMutation({
    mutationFn: brokerService.createExportRequest,
  });
};

export const useCreateDeleteRequest = () => {
  return useMutation({
    mutationFn: brokerService.createDeleteRequest,
  });
};
