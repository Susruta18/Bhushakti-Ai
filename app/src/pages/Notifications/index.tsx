import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { AppNotification } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { formatTimeAgo } from '../../utils/dateUtils';
import { useAppContext } from '../../context/AppContext';
import { buildRoute } from '../../constants/routes';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { unreadNotificationCount, setUnreadNotificationCount } = useAppContext();

  const fetchNotifications = async () => {
    setLoading(true);
    const data = await notificationService.getNotifications();
    setNotifications(data);
    
    // Update count in context
    const unread = data.filter(n => !n.isRead).length;
    setUnreadNotificationCount(unread);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    const success = await notificationService.markAllAsRead();
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotificationCount(0);
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      const success = await notificationService.markAsRead(notification._id);
      if (success) {
        setNotifications(prev => prev.map(n => 
          n._id === notification._id ? { ...n, isRead: true } : n
        ));
        const newCount = unreadNotificationCount - 1;
        setUnreadNotificationCount(Math.max(0, newCount));
      }
    }
    
    // Navigate to alert details if exists
    if (notification.alertId) {
      navigate(buildRoute.alertDetail(notification.alertId));
    }
  };

  if (loading && notifications.length === 0) {
    return <LoadingState message="Loading notifications..." />;
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertTriangle className="w-5 h-5 text-error" />;
      case 'HIGH': return <AlertTriangle className="w-5 h-5 text-warning" />;
      default: return <Info className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-title-lg font-bold text-on-background flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Notifications
        </h2>
        
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAllRead}
            className="text-label-md text-primary hover:text-primary-container transition-colors flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-surface-container rounded-2xl border border-outline-variant/30">
          <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-on-surface-variant" />
          </div>
          <p className="text-body-lg text-on-surface font-medium mb-1">No notifications yet</p>
          <p className="text-body-md text-on-surface-variant">You're all caught up!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map(notification => (
            <div 
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                !notification.isRead 
                  ? 'bg-surface-container-high border-primary/30 shadow-[0_4px_12px_rgba(0,0,0,0.1)]' 
                  : 'bg-surface border-outline-variant/50 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex gap-3 items-start">
                <div className="mt-0.5 shrink-0">
                  {getSeverityIcon(notification.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className={`text-title-sm font-semibold truncate ${
                      notification.severity === 'CRITICAL' ? 'text-error' :
                      notification.severity === 'HIGH' ? 'text-warning' :
                      'text-on-surface'
                    }`}>
                      {notification.title}
                    </h4>
                    <span className="text-label-sm text-on-surface-variant whitespace-nowrap shrink-0">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant line-clamp-2">
                    {notification.message}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 self-center" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
