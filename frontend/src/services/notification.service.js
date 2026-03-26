// Notification API Service

import api from './api';

const notificationService = {
  // Get notifications list (paginated)
  getNotifications: (limit = 30, offset = 0) => {
    return api.get('/notifications', { params: { limit, offset } });
  },

  // Get unread count
  getUnreadCount: () => {
    return api.get('/notifications/unread-count');
  },

  // Mark single notification as read
  markAsRead: (id) => {
    return api.patch(`/notifications/${id}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    return api.patch('/notifications/read-all');
  },

  // Delete a notification
  deleteNotification: (id) => {
    return api.delete(`/notifications/${id}`);
  },
};

export default notificationService;
