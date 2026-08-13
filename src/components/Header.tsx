import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LogOut,
  Download,
  Wifi,
  WifiOff,
  UserCheck,
  ShieldAlert,
  User as UserIcon,
  Bell,
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

export const Header: React.FC = () => {
  const {
    currentUser,
    logout,
    isOnline,
    pwaInstallEvent,
    promptPWAInstall,
    isInstalledPWA,
    unreadNotifCount,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  if (!currentUser) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Super Admin',
          bg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          icon: ShieldAlert,
        };
      case 'supervisor':
        return {
          label: 'Supervisor',
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: UserCheck,
        };
      default:
        return {
          label: 'Worker',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: UserIcon,
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-2 sm:px-4 py-2.5 sm:py-3 text-slate-900 shadow-sm max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* App Logo & Title */}
        <div className="flex items-center gap-3">
          <img
            src="/favicon.ico"
            alt="Brintha Builders Logo"
            className="w-10 h-10 rounded-lg object-cover border border-slate-800 shadow-md shrink-0 bg-slate-900"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-bold text-base sm:text-lg text-slate-900 leading-none uppercase tracking-tight">
              Brintha Builders
            </h1>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1 hidden sm:block">
              Attendance & Payroll Management System
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online/Offline status pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
            }`}
            title={isOnline ? 'Connected to internet' : 'Working offline - Data cached'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* PWA / Home Screen Install Button */}
          {!isInstalledPWA && (
            <button
              onClick={async () => {
                if (pwaInstallEvent) {
                  await promptPWAInstall();
                } else {
                  alert(
                    "To add Brintha Builders to your mobile home screen:\n\n• On Chrome/Android: Tap menu (⋮) -> 'Add to Home screen' or 'Install App'\n• On Safari/iOS: Tap Share button (⎋) -> 'Add to Home Screen'"
                  );
                }
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 sm:px-3 py-1.5 rounded-lg transition shadow-xs"
              title="Add App to Mobile Home Screen"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {/* Notification Bell Icon */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200"
            title="Notification Center"
          >
            <Bell className="w-4 h-4 text-slate-800" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white shadow-xs">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* User Profile & Role Badge */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 sm:px-2.5 py-1">
            <img
              src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
              alt={currentUser.name}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-300 bg-slate-200"
            />
            <div className="hidden md:flex flex-col items-start">
              <span className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</span>
              <span className={`text-[9px] px-1.5 py-0.2 font-bold uppercase rounded-sm border mt-0.5 ${roleInfo.bg}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>

          {/* Standalone Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs uppercase tracking-wider transition shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </header>
  );
};
