import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { NotificationDocument, UserDocument, AlertDocument } from '../models/types';

export const createNotificationsForAlert = async (alert: AlertDocument) => {
  if (!alert || !alert._id) return;
  const db = getDatabase();

  // Audience strategy: AUTHORITY and FIELD_OFFICER always get alerts.
  // We can include CITIZENs broadly for now as it's an early warning system.
  // In a robust system, we would filter CITIZENs by region/zoneId.
  const users = await db.collection<UserDocument>('users').find({
    isActive: true,
  }).toArray();

  if (users.length === 0) return;

  const notifications: NotificationDocument[] = users.map(user => ({
    userId: user._id!,
    alertId: alert._id!,
    zoneId: alert.zoneId,
    title: alert.title,
    message: alert.message,
    severity: alert.severity,
    isRead: false,
    createdAt: new Date()
  }));

  await db.collection<NotificationDocument>('notifications').insertMany(notifications);
};

export const getNotificationsForUser = async (userId: string, filter: any = {}, page: number = 1, limit: number = 20) => {
  const db = getDatabase();
  const skip = (page - 1) * limit;
  const query = { ...filter, userId: new ObjectId(userId) };

  const [data, total] = await Promise.all([
    db.collection<NotificationDocument>('notifications')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection<NotificationDocument>('notifications').countDocuments(query)
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  const db = getDatabase();
  return await db.collection<NotificationDocument>('notifications').countDocuments({
    userId: new ObjectId(userId),
    isRead: false
  });
};

export const markAsRead = async (notificationId: string, userId: string): Promise<boolean> => {
  if (!ObjectId.isValid(notificationId)) return false;
  const db = getDatabase();

  const result = await db.collection<NotificationDocument>('notifications').updateOne(
    { _id: new ObjectId(notificationId), userId: new ObjectId(userId) },
    { $set: { isRead: true } }
  );

  return result.modifiedCount > 0;
};

export const markAllAsRead = async (userId: string): Promise<number> => {
  const db = getDatabase();

  const result = await db.collection<NotificationDocument>('notifications').updateMany(
    { userId: new ObjectId(userId), isRead: false },
    { $set: { isRead: true } }
  );

  return result.modifiedCount;
};
