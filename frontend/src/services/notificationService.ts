import { apiRequest } from './api';

export interface Notification {
  id: number;
  userId: number;
  notificationType: string;
  message: string;
  referenceType: string | null;
  referenceId: number | null;
  channel: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  sentAt: string | null;
}

interface BackendNotification {
  id: number;
  user_id: number;
  notification_type: string;
  message: string;
  reference_type: string | null;
  reference_id: number | null;
  channel: string;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  sent_at: string | null;
}

const mapNotification = (data: BackendNotification): Notification => ({
  id: data.id,
  userId: data.user_id,
  notificationType: data.notification_type,
  message: data.message,
  referenceType: data.reference_type,
  referenceId: data.reference_id,
  channel: data.channel,
  status: data.status,
  createdAt: data.created_at,
  sentAt: data.sent_at,
});

export interface SendFeeReminderDto {
  parentId: number;
  studentName: string;
  amountDue: string;
  dueDate: string;
}

export const notificationService = {
  sendFeeReminder: async (data: SendFeeReminderDto): Promise<Notification> => {
    const response = await apiRequest<BackendNotification>('/notifications/fee-reminder', {
      method: 'POST',
      data,
    });
    return mapNotification(response);
  },

  getMyNotifications: async (filters?: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const queryString = params.toString();
    const response = await apiRequest<BackendNotification[]>(`/notifications/my${queryString ? `?${queryString}` : ''}`);
    return response.map(mapNotification);
  },
};

export default notificationService;
