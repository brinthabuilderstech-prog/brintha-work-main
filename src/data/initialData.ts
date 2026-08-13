import { User, AttendanceRecord, AdvanceRecord, PaymentRecord, AppSettings, AppNotification } from '../types';

/**
 * Returns a YYYY-MM-DD date string offset by `days` from today.
 * getDateOffset(0)  -> today
 * getDateOffset(-1) -> yesterday
 */
export const getDateOffset = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

/**
 * Adds (or subtracts) days from a given YYYY-MM-DD date string and
 * returns the result as a YYYY-MM-DD string.
 * addDaysToDateString('2026-08-08', 1)  -> '2026-08-09'
 * addDaysToDateString('2026-08-08', -1) -> '2026-08-07'
 */
export const addDaysToDateString = (dateString: string, days: number): string => {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// List of trade types available when adding/editing a worker.
// Adjust this list to match the trades your team actually uses.
export const TRADES: string[] = [
  'Mason',
  'Carpenter',
  'Electrician',
  'Plumber',
  'Painter',
  'Welder',
  'Helper',
  'Steel Fixer',
  'Tile Layer',
  'Supervisor',
];

// No demo accounts or demo records — all users, attendance, advances, and
// payments come from Firebase/Firestore. These stay empty until real data
// is created (via a sign-up flow, the Firebase console, or app usage).

export const INITIAL_ADMINS: User[] = [];

export const INITIAL_SUPERVISORS: User[] = [];

export const INITIAL_WORKERS: User[] = [];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_ADVANCES: AdvanceRecord[] = [];

export const INITIAL_PAYMENTS: PaymentRecord[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

// Default app settings — this is real configuration, not demo data, so it's
// kept here and seeded into Firestore once if no 'settings/app_config' doc exists.
export const INITIAL_SETTINGS: AppSettings = {
  currency: '₹',
  theme: 'light',
  attendanceNotifs: true,
  paymentNotifs: true,
  newWorkerNotifs: true,
  soundNotifs: true,
  pushNotifs: false,
  language: 'en',
};