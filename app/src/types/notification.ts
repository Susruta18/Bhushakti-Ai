export interface AppNotification {
  _id: string;
  userId: string;
  alertId: string;
  zoneId: string;
  title: string;
  message: string;
  severity: 'MODERATE' | 'HIGH' | 'CRITICAL';
  isRead: boolean;
  createdAt: string;
}
