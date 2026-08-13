import React from 'react';
import { useApp } from '../context/AppContext';
import {
  CalendarCheck,
  CircleDollarSign,
  Users,
  Settings,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';
import { getTranslation } from '../utils/i18n';

export const BottomNav: React.FC = () => {
  const { currentUser, activeTab, setActiveTab, settings } = useApp();

  if (!currentUser) return null;

  const t = getTranslation(currentUser?.language || settings.language);
  const role = currentUser.role;

  const getNavItems = () => {
    if (role === 'worker') {
      return [
        { id: 'dashboard', label: t.myDashboard, icon: LayoutDashboard },
        { id: 'attendance', label: t.myLogs, icon: CalendarCheck },
        { id: 'payroll', label: t.myPayroll, icon: CircleDollarSign },
        { id: 'settings', label: t.settings, icon: Settings },
      ];
    }

    if (role === 'supervisor') {
      return [
        { id: 'attendance', label: t.attendance, icon: CalendarCheck },
        { id: 'payroll', label: t.payroll, icon: CircleDollarSign },
        { id: 'workers', label: t.workers, icon: Users },
        { id: 'settings', label: t.settings, icon: Settings },
      ];
    }

    // Admin
    return [
      { id: 'attendance', label: t.attendance, icon: CalendarCheck },
      { id: 'payroll', label: t.payroll, icon: CircleDollarSign },
      { id: 'workers', label: t.workers, icon: Users },
      { id: 'management', label: t.management, icon: ShieldCheck },
      { id: 'settings', label: t.settings, icon: Settings },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1.5 shadow-lg">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-0.5 sm:gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 sm:px-2 rounded-md transition-all duration-150 ${
                isActive
                  ? 'text-indigo-700 bg-indigo-50 font-bold border border-indigo-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] leading-tight mt-0.5 truncate max-w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
