import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Calendar,
  Banknote,
  UserPlus,
  Info,
  ExternalLink,
} from 'lucide-react';
import { NotificationType } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadNotifCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    deleteNotification,
    setActiveTab,
    canSeeNotification,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | NotificationType>('all');

  if (!isOpen) return null;

  const visibleNotifications = notifications.filter((n) => canSeeNotification(n));

  const filteredNotifications = visibleNotifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  const getNotifIcon = (type: NotificationType) => {
    switch (type) {
      case 'attendance':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'payment':
        return <Banknote className="w-4 h-4 text-emerald-600" />;
      case 'worker':
        return <UserPlus className="w-4 h-4 text-indigo-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatTimestamp = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      // eslint-disable-next-line react-hooks/purity -- Date.now() here is
      // intentional: it's read fresh on every render purely to compute a
      // relative "time ago" label for display, it never drives state or
      // side effects, so the impurity is harmless.
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  const handleNotificationClick = (id: string, read: boolean, linkModule?: string) => {
    if (!read) {
      markNotificationAsRead(id);
    }
    if (linkModule) {
      setActiveTab(linkModule);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer content */}
      <div className="relative z-10 w-full max-w-sm bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white relative">
              <Bell className="w-5 h-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {unreadNotifCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="font-extrabold text-sm uppercase tracking-wide">Notifications</h2>
              <p className="text-[10px] text-slate-300 font-medium">Site Alerts & System Updates</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded transition ${
                activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({visibleNotifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={`px-2.5 py-1 rounded transition ${
                activeFilter === 'unread' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Unread ({unreadNotifCount})
            </button>
          </div>

          <div className="flex items-center gap-1">
            {unreadNotifCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-200 rounded transition"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearNotifications}
                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-200 rounded transition"
                title="Clear all notifications"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <Bell className="w-10 h-10 stroke-1 text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No Notifications</p>
              <p className="text-[11px] text-slate-400">
                {activeFilter === 'unread' ? 'All catch up! No unread alerts.' : 'No real notification history yet.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif.id, notif.read, notif.linkModule)}
                className={`p-3 rounded-lg border transition cursor-pointer relative ${
                  notif.read
                    ? 'bg-white border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-300'
                    : 'bg-indigo-50/50 border-indigo-200 shadow-xs hover:bg-indigo-50'
                }`}
              >
                {!notif.read && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                )}
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-md bg-white border border-slate-200 shrink-0 shadow-xs">
                    {getNotifIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{notif.title}</h4>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition shrink-0"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{notif.message}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{formatTimestamp(notif.timestamp)}</span>
                      {notif.linkModule && (
                        <span className="text-indigo-600 font-bold flex items-center gap-0.5 uppercase tracking-wider">
                          Open <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Link to Notification Settings */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              setActiveTab('settings');
              onClose();
            }}
            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-md transition text-center shadow-xs"
          >
            Manage Preferences in Settings
          </button>
        </div>
      </div>
    </div>
  );
};