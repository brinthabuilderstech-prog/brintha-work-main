export type UserRole = 'admin' | 'supervisor' | 'worker';

export type AttendanceStatus = 'present' | 'half_day' | 'absent' | 'unmarked';

export type TradeType = 
  | 'Mason'
  | 'Helper'
  | 'Carpenter'
  | 'Electrician'
  | 'Plumber'
  | 'Painter'
  | 'Welder'
  | 'Tile Layer'
  | 'Steel Fixer';

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer';

export type LanguageCode = 'en' | 'hi' | 'ta';

export interface User {
  id: string;
  name: string;
  phone: string;
  password?: string;
  role: UserRole;
  trade?: TradeType;
  dailyRate?: number;
  site?: string;
  avatar?: string;
  language?: LanguageCode; // per-user language preference (NOT global settings)
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  markedBy?: string;
  timestamp?: string;
}

export interface AdvanceRecord {
  id: string;
  workerId: string;
  amount: number;
  reason: string;
  date: string; // YYYY-MM-DD
  status: 'active' | 'deducted';
}

export interface PaymentRecord {
  id: string;
  workerId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMode: PaymentMode;
  notes?: string;
  clearedBy?: string;
}

export interface AppSettings {
  theme: 'construction' | 'light' | 'dark' | 'emerald';
  attendanceNotifs: boolean;
  paymentNotifs: boolean;
  newWorkerNotifs: boolean;
  soundNotifs?: boolean;
  pushNotifs?: boolean;
  language: LanguageCode; // default/fallback language for logged-out or new users
  currency: string;
}

export type NotificationType = 'attendance' | 'payment' | 'worker' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
  targetRole: 'all' | 'staff' | UserRole;
  targetUserId?: string; // if set, only this specific user (plus staff) sees the notification
  linkModule?: string;
}

export interface WorkerCalculatedPayroll {
  workerId: string;
  workerName: string;
  trade: TradeType;
  dailyRate: number;
  presentCount: number;
  halfDayCount: number;
  absentCount: number;
  unmarkedCount: number;
  daysWorked: number;
  grossSalary: number;
  totalAdvances: number;
  netSalary: number;
  totalPaid: number;
  pendingBalance: number;
  isCleared: boolean;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}