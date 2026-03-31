'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, Zap, TrendingUp, AlertCircle, Users, Loader2 } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  entityId?: string;
}

interface NotificationCenterProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  friction_alert: <AlertCircle className="w-4 h-4" />,
  deal_health_change: <TrendingUp className="w-4 h-4" />,
  score_update: <Zap className="w-4 h-4" />,
  partner_activity: <Users className="w-4 h-4" />,
  system: <Bell className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  friction_alert: 'bg-red-50 border-red-200',
  deal_health_change: 'bg-yellow-50 border-yellow-200',
  score_update: 'bg-blue-50 border-blue-200',
  partner_activity: 'bg-green-50 border-green-200',
  system: 'bg-gray-50 border-gray-200',
};

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

function groupByTime(notifications: Notification[]): Record<string, Notification[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, Notification[]> = { Today: [], Earlier: [] };

  notifications.forEach((notif) => {
    const notifDate = new Date(notif.createdAt);
    const notifDateOnly = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

    if (notifDateOnly.getTime() === today.getTime()) {
      groups.Today.push(notif);
    } else {
      groups.Earlier.push(notif);
    }
  });

  return groups;
}

export function NotificationCenter({
  userId,
  isOpen,
  onClose,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/live/notifications?userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/live/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`/api/live/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  if (!isOpen) return null;

  const grouped = groupByTime(notifications);

  return (
    <div ref={ref} className="fixed right-0 top-0 bottom-0 w-[380px] max-w-[100vw] bg-white shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-tcs-border">
        <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-tcs-teal" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-600">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y divide-tcs-border">
            {Object.entries(grouped).map(([timeGroup, groupNotifs]) => {
              if (groupNotifs.length === 0) return null;
              return (
                <div key={timeGroup}>
                  <div className="px-4 py-2 bg-tcs-bg sticky top-0">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase">
                      {timeGroup}
                    </h3>
                  </div>
                  {groupNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-l-2 transition-colors ${
                        notif.read
                          ? 'border-l-gray-200'
                          : 'border-l-tcs-teal bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-tcs-teal mt-0.5 flex-shrink-0">
                          {TYPE_ICONS[notif.type] || <Bell className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTimeAgo(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="text-tcs-teal hover:text-tcs-teal/70 flex-shrink-0"
                            title="Mark as read"
                          >
                            <CheckCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && unreadCount > 0 && (
        <div className="border-t border-tcs-border p-3">
          <button
            onClick={handleMarkAllAsRead}
            className="w-full px-3 py-2 text-xs font-medium text-tcs-teal hover:bg-tcs-bg rounded transition-colors"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
}
