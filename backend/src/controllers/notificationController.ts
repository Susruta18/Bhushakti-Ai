import { Request, Response } from 'express';
import { getNotificationsForUser, getUnreadCount, markAsRead, markAllAsRead } from '../services/notificationService';

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Only fetch unread if specifically requested, else all
    const filter: any = {};
    if (req.query.unreadOnly === 'true') {
      filter.isRead = false;
    }

    const result = await getNotificationsForUser(userId, filter, page, limit);
    return res.status(200).json({ success: true, data: result.data, meta: { total: result.total, page: result.page, totalPages: result.totalPages } });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const count = await getUnreadCount(userId);
    return res.status(200).json({ success: true, data: { count } });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const notificationId = req.params.id as string;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const success = await markAsRead(notificationId, userId);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'Notification not found or already read' });
    }

    return res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (error: any) {
    console.error('Error marking read:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const count = await markAllAsRead(userId);
    return res.status(200).json({ success: true, message: 'All marked as read', data: { updatedCount: count } });
  } catch (error: any) {
    console.error('Error marking all read:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
