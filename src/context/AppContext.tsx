import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  arrayUnion,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  OperationType,
  testFirebaseConnection,
} from '../lib/firebase';
import {
  User,
  AttendanceRecord,
  AdvanceRecord,
  PaymentRecord,
  AppSettings,
  AttendanceStatus,
  WorkerCalculatedPayroll,
  UserRole,
  BeforeInstallPromptEvent,
  AppNotification,
  LanguageCode,
} from '../types';

import { playNotificationSound } from '../utils/sound';
import { useToast } from '../components/Toast';
import {
  INITIAL_ADMINS,
  INITIAL_SUPERVISORS,
  INITIAL_WORKERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
  getDateOffset,
} from '../data/initialData';

// Sends a real push notification (via the Netlify function + Firebase Admin)
// to every device token a user has registered. Reaches the device even if
// the app/tab is completely closed, same as WhatsApp/Instagram. Safe no-op
// if the user has no saved tokens yet (e.g. never granted push permission).
async function sendPushToUser(
  user: User | undefined,
  title: string,
  body: string,
  link?: string
) {
  const tokens = user?.fcmTokens || [];
  for (const token of tokens) {
    fetch('/api/send-push-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fcmToken: token,
        title,
        body,
        data: link ? { link } : undefined,
      }),
    }).catch((err) => console.warn('Push send failed (non-fatal):', err));
  }
}

interface AppContextType {
  currentUser: User | null;
  allUsers: User[];
  workers: User[];
  supervisors: User[];
  admins: User[];
  attendance: AttendanceRecord[];
  advances: AdvanceRecord[];
  payments: PaymentRecord[];
  notifications: AppNotification[];
  unreadNotifCount: number;
  activeDate: string;
  setActiveDate: (date: string) => void;
  settings: AppSettings;
  isOnline: boolean;
  pwaInstallEvent: BeforeInstallPromptEvent | null;
  isInstalledPWA: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isFirebaseConnected: boolean;
  usersLoading: boolean;

  // Notification actions
  addNotification: (notifData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  deleteNotification: (id: string) => void;
  requestPushPermission: () => Promise<boolean>;
  disablePushAndAllNotifs: () => Promise<void>;
  canSeeNotification: (n: AppNotification) => boolean;

  // Auth actions
  login: (phone: string, pass: string) => { success: boolean; message?: string };
  demoLogin: (role: UserRole) => void;
  logout: () => void;

  // Attendance actions
  markAttendance: (workerId: string, date: string, status: AttendanceStatus) => void;
  markAllPresent: (date: string, workerIds: string[]) => void;

  // Payroll actions
  addAdvance: (workerId: string, amount: number, reason: string) => void;
  deleteAdvance: (id: string) => void;
  clearPayment:
    | ((
        workerId: string,
        amount: number,
        paymentMode: 'Cash' | 'UPI' | 'Bank Transfer',
        notes?: string
      ) => void);
  deletePayment: (id: string) => void;
  getWorkerPayroll: (workerId: string, startDate?: string, endDate?: string) => WorkerCalculatedPayroll;
  getAllPayrolls: (startDate?: string, endDate?: string) => WorkerCalculatedPayroll[];

  // Management actions
  addWorker: (w: Omit<User, 'id' | 'role'>) => void;
  editWorker: (id: string, w: Partial<User>) => void;
  deleteWorker: (id: string) => { success: boolean; message?: string };

  addSupervisor: (s: Omit<User, 'id' | 'role'>) => void;
  editSupervisor: (id: string, s: Partial<User>) => void;
  deleteSupervisor: (id: string) => { success: boolean; message?: string };

  addAdmin: (a: Omit<User, 'id' | 'role'>) => void;
  editAdmin: (id: string, a: Partial<User>) => void;
  deleteAdmin: (id: string) => { success: boolean; message?: string };

  // Settings & System
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateMyAvatar: (avatarUrl: string) => Promise<void>;
  updateMyLanguage: (lang: LanguageCode) => Promise<void>;
  promptPWAInstall: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'labortrack_pwa_session_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [admins, setAdmins] = useState<User[]>(INITIAL_ADMINS);
  const [supervisors, setSupervisors] = useState<User[]>(INITIAL_SUPERVISORS);
  const [workers, setWorkers] = useState<User[]>(INITIAL_WORKERS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [advances, setAdvances] = useState<AdvanceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  const [activeDate, setActiveDate] = useState<string>(getDateOffset(0));
  const [activeTab, setActiveTab] = useState<string>('attendance');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pwaInstallEvent, setPwaInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalledPWA, setIsInstalledPWA] = useState<boolean>(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [usersLoading, setUsersLoading] = useState<boolean>(true);

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  useEffect(() => {
    let unsubUsers: (() => void) | undefined;
    let unsubAttendance: (() => void) | undefined;
    let unsubAdvances: (() => void) | undefined;
    let unsubPayments: (() => void) | undefined;
    let unsubNotifications: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;

    const initFirebase = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (usersSnap.empty) {
          await setDoc(doc(db, 'settings', 'app_config'), INITIAL_SETTINGS);
        }
      } catch (err) {
        console.warn('Firebase seeding encountered error:', err);
      }

      unsubUsers = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          const fetchedUsers = snapshot.docs.map((doc) => doc.data() as User);
          setAdmins(fetchedUsers.filter((u) => u.role === 'admin'));
          setSupervisors(fetchedUsers.filter((u) => u.role === 'supervisor'));
          setWorkers(fetchedUsers.filter((u) => u.role === 'worker'));
          setUsersLoading(false);

          setCurrentUser((prev) => {
            if (!prev) return prev;
            const updated = fetchedUsers.find((u) => u.id === prev.id);
            return updated ? updated : prev;
          });
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'users')
      );

      unsubAttendance = onSnapshot(
        collection(db, 'attendance'),
        (snapshot) => {
          const fetchedAtt = snapshot.docs.map((doc) => doc.data() as AttendanceRecord);
          setAttendance(fetchedAtt);
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'attendance')
      );

      unsubAdvances = onSnapshot(
        collection(db, 'advances'),
        (snapshot) => {
          const fetchedAdv = snapshot.docs.map((doc) => doc.data() as AdvanceRecord);
          setAdvances(fetchedAdv);
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'advances')
      );

      unsubPayments = onSnapshot(
        collection(db, 'payments'),
        (snapshot) => {
          const fetchedPay = snapshot.docs.map((doc) => doc.data() as PaymentRecord);
          setPayments(fetchedPay);
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'payments')
      );

      unsubNotifications = onSnapshot(
        collection(db, 'notifications'),
        (snapshot) => {
          const fetchedNotifs = snapshot.docs.map((doc) => doc.data() as AppNotification);
          fetchedNotifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setNotifications(fetchedNotifs);
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'notifications')
      );

      unsubSettings = onSnapshot(
        doc(db, 'settings', 'app_config'),
        (docSnap) => {
          if (docSnap.exists()) {
            setSettings(docSnap.data() as AppSettings);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'settings/app_config')
      );
    };

    initFirebase();

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubAttendance) unsubAttendance();
      if (unsubAdvances) unsubAdvances();
      if (unsubPayments) unsubPayments();
      if (unsubNotifications) unsubNotifications();
      if (unsubSettings) unsubSettings();
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      try {
        const parsedUser = JSON.parse(saved);
        if (parsedUser?.id) setCurrentUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalledPWA(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPwaInstallEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const allUsers: User[] = [...admins, ...supervisors, ...workers];

  const login = (phone: string, pass: string) => {
    const trimmedPhone = phone.trim();
    const found = allUsers.find(
      (u) => u.phone.replace(/\D/g, '') === trimmedPhone.replace(/\D/g, '')
    );

    if (!found) {
      return { success: false, message: 'No user account found with this phone number.' };
    }

    if (found.password && found.password !== pass) {
      return { success: false, message: 'Invalid password. Please check and try again.' };
    }

    setCurrentUser(found);
    if (found.role === 'worker') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('attendance');
    }
    return { success: true };
  };

  const demoLogin = (role: UserRole) => {
    if (role === 'admin' && admins.length > 0) {
      setCurrentUser(admins[0]);
      setActiveTab('attendance');
    } else if (role === 'supervisor' && supervisors.length > 0) {
      setCurrentUser(supervisors[0]);
      setActiveTab('attendance');
    } else if (role === 'worker' && workers.length > 0) {
      setCurrentUser(workers[0]);
      setActiveTab('dashboard');
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const markAttendance = async (workerId: string, date: string, status: AttendanceStatus) => {
    const todayStr = getDateOffset(0);
    if (date !== todayStr) {
      console.warn(`Attendance modification rejected: Date ${date} is not today (${todayStr}).`);
      return;
    }

    const existingIdx = attendance.findIndex((a) => a.workerId === workerId && a.date === date);
    const updatedRecord: AttendanceRecord = {
      id: existingIdx >= 0 ? attendance[existingIdx].id : `att-${workerId}-${date}`,
      workerId,
      date,
      status,
      markedBy: currentUser?.name || 'Supervisor',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAttendance((prev) => {
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = updatedRecord;
        return next;
      } else {
        return [...prev, updatedRecord];
      }
    });

    try {
      await setDoc(doc(db, 'attendance', updatedRecord.id), updatedRecord);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `attendance/${updatedRecord.id}`);
    }
  };

  const markAllPresent = async (date: string, workerIds: string[]) => {
    const todayStr = getDateOffset(0);
    if (date !== todayStr) {
      console.warn(`Attendance modification rejected: Date ${date} is not today (${todayStr}).`);
      return;
    }

    const updatedRecords: AttendanceRecord[] = [];
    setAttendance((prev) => {
      const next = [...prev];
      workerIds.forEach((wId) => {
        const existingIdx = next.findIndex((a) => a.workerId === wId && a.date === date);
        const record: AttendanceRecord = {
          id: existingIdx >= 0 ? next[existingIdx].id : `att-${wId}-${date}`,
          workerId: wId,
          date,
          status: 'present',
          markedBy: currentUser?.name || 'Supervisor',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        updatedRecords.push(record);
        if (existingIdx >= 0) {
          next[existingIdx] = record;
        } else {
          next.push(record);
        }
      });
      return next;
    });

    try {
      for (const rec of updatedRecords) {
        await setDoc(doc(db, 'attendance', rec.id), rec);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'attendance');
    }

    if (settings.attendanceNotifs && workerIds.length > 0) {
      addNotification({
        title: 'Attendance Marked',
        message: `${currentUser?.name || 'Supervisor'} marked ${workerIds.length} worker${
          workerIds.length === 1 ? '' : 's'
        } present for today.`,
        type: 'attendance',
        targetRole: 'staff',
        linkModule: 'attendance',
      });

      // Real push to each present worker's phone, even if their app is closed.
      workerIds.forEach((wId) => {
        const worker = workers.find((w) => w.id === wId);
        sendPushToUser(
          worker,
          'Attendance Marked',
          `You were marked present for ${date}.`,
          'https://brintha-workers.netlify.app/attendance'
        );
      });
    }
  };

  const addAdvance = async (workerId: string, amount: number, reason: string) => {
    const newAdvance: AdvanceRecord = {
      id: `adv-${Date.now()}`,
      workerId,
      amount,
      reason,
      date: getDateOffset(0),
      status: 'active',
    };
    setAdvances((prev) => [newAdvance, ...prev]);

    try {
      await setDoc(doc(db, 'advances', newAdvance.id), newAdvance);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `advances/${newAdvance.id}`);
    }

    if (settings.paymentNotifs) {
      const worker = workers.find((w) => w.id === workerId);
      const workerName = worker ? worker.name : 'Worker';
      addNotification({
        title: 'Advance Issued',
        message: `${settings.currency}${amount} advance recorded for ${workerName} (${reason}).`,
        type: 'payment',
        targetRole: 'staff',
        targetUserId: workerId,
        linkModule: 'payroll',
      });

      sendPushToUser(
        worker,
        'Advance Issued',
        `${settings.currency}${amount} advance recorded (${reason}).`,
        'https://brintha-workers.netlify.app/payroll'
      );
    }
  };

  const deleteAdvance = async (id: string) => {
    setAdvances((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteDoc(doc(db, 'advances', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `advances/${id}`);
    }
  };

  const clearPayment = async (
    workerId: string,
    amount: number,
    paymentMode: 'Cash' | 'UPI' | 'Bank Transfer',
    notes?: string
  ) => {
    const newPay: PaymentRecord = {
      id: `pay-${Date.now()}`,
      workerId,
      amount,
      date: getDateOffset(0),
      paymentMode,
      notes: notes || '',
      clearedBy: currentUser?.name || 'Admin',
    };
    setPayments((prev) => [newPay, ...prev]);

    try {
      await setDoc(doc(db, 'payments', newPay.id), newPay);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `payments/${newPay.id}`);
    }

    if (settings.paymentNotifs) {
      const worker = workers.find((w) => w.id === workerId);
      const workerName = worker ? worker.name : 'Worker';
      addNotification({
        title: 'Salary Payment Cleared',
        message: `${settings.currency}${amount} payment cleared for ${workerName} via ${paymentMode}.`,
        type: 'payment',
        targetRole: 'staff',
        targetUserId: workerId,
        linkModule: 'payroll',
      });

      // Real push — reaches the worker's phone even if the app is closed.
      sendPushToUser(
        worker,
        'Salary Payment Cleared',
        `${settings.currency}${amount} payment cleared via ${paymentMode}.`,
        'https://brintha-workers.netlify.app/payroll'
      );
    }
  };

  const deletePayment = async (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteDoc(doc(db, 'payments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `payments/${id}`);
    }
  };

  const getWorkerPayroll = (
    workerId: string,
    startDate?: string,
    endDate?: string
  ): WorkerCalculatedPayroll => {
    const worker = workers.find((w) => w.id === workerId);
    if (!worker) {
      return {
        workerId,
        workerName: 'Unknown',
        trade: 'Helper',
        dailyRate: 0,
        presentCount: 0,
        halfDayCount: 0,
        absentCount: 0,
        unmarkedCount: 0,
        daysWorked: 0,
        grossSalary: 0,
        totalAdvances: 0,
        netSalary: 0,
        totalPaid: 0,
        pendingBalance: 0,
        isCleared: true,
      };
    }

    const workerAtt = attendance.filter((a) => {
      if (a.workerId !== workerId) return false;
      if (startDate && a.date < startDate) return false;
      if (endDate && a.date > endDate) return false;
      return true;
    });

    const presentCount = workerAtt.filter((a) => a.status === 'present').length;
    const halfDayCount = workerAtt.filter((a) => a.status === 'half_day').length;
    const absentCount = workerAtt.filter((a) => a.status === 'absent').length;
    const unmarkedCount = workerAtt.filter((a) => a.status === 'unmarked').length;

    const daysWorked = presentCount + halfDayCount * 0.5;
    const dailyRate = worker.dailyRate || 0;
    const grossSalary = daysWorked * dailyRate;

    const totalAdvances = advances
      .filter((adv) => adv.workerId === workerId && adv.status === 'active')
      .reduce((sum, item) => sum + item.amount, 0);

    const netSalary = Math.max(0, grossSalary - totalAdvances);

    const totalPaid = payments
      .filter((p) => p.workerId === workerId)
      .reduce((sum, item) => sum + item.amount, 0);

    const pendingBalance = Math.max(0, netSalary - totalPaid);
    const isCleared = grossSalary === 0 || pendingBalance <= 0;

    return {
      workerId,
      workerName: worker.name,
      trade: worker.trade || 'Helper',
      dailyRate,
      presentCount,
      halfDayCount,
      absentCount,
      unmarkedCount,
      daysWorked,
      grossSalary,
      totalAdvances,
      netSalary,
      totalPaid,
      pendingBalance,
      isCleared,
    };
  };

  const getAllPayrolls = (startDate?: string, endDate?: string): WorkerCalculatedPayroll[] => {
    return workers.map((w) => getWorkerPayroll(w.id, startDate, endDate));
  };

  const addWorker = async (w: Omit<User, 'id' | 'role'>) => {
    const newW: User = {
      ...w,
      id: `wrk-${Date.now()}`,
      role: 'worker',
      avatar: w.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(w.name)}`,
    };
    setWorkers((prev) => [newW, ...prev]);

    try {
      await setDoc(doc(db, 'users', newW.id), newW);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${newW.id}`);
    }

    if (settings.newWorkerNotifs) {
      addNotification({
        title: 'New Worker Onboarded',
        message: `${w.name} enrolled as ${w.trade} (${w.phone}) under ${w.site || 'Main Site'}.`,
        type: 'worker',
        targetRole: 'staff',
        linkModule: 'workers',
      });
    }
  };

  const editWorker = async (id: string, updated: Partial<User>) => {
    const existing = workers.find((w) => w.id === id);
    if (!existing) return;
    const fullUpdated = { ...existing, ...updated };
    setWorkers((prev) => prev.map((w) => (w.id === id ? fullUpdated : w)));

    try {
      await setDoc(doc(db, 'users', id), fullUpdated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${id}`);
    }
  };

  const deleteWorker = (id: string) => {
    setWorkers((prev) => prev.filter((w) => w.id !== id));
    deleteDoc(doc(db, 'users', id)).catch((error) =>
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`)
    );
    return { success: true };
  };

  const addSupervisor = async (s: Omit<User, 'id' | 'role'>) => {
    const newS: User = {
      ...s,
      id: `sup-${Date.now()}`,
      role: 'supervisor',
      avatar: s.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(s.name)}`,
    };
    setSupervisors((prev) => [newS, ...prev]);

    try {
      await setDoc(doc(db, 'users', newS.id), newS);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${newS.id}`);
    }
  };

  const editSupervisor = async (id: string, updated: Partial<User>) => {
    const existing = supervisors.find((s) => s.id === id);
    if (!existing) return;
    const fullUpdated = { ...existing, ...updated };
    setSupervisors((prev) => prev.map((s) => (s.id === id ? fullUpdated : s)));

    try {
      await setDoc(doc(db, 'users', id), fullUpdated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${id}`);
    }
  };

  const deleteSupervisor = (id: string) => {
    setSupervisors((prev) => prev.filter((s) => s.id !== id));
    deleteDoc(doc(db, 'users', id)).catch((error) =>
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`)
    );
    return { success: true };
  };

  const addAdmin = async (a: Omit<User, 'id' | 'role'>) => {
    const newA: User = {
      ...a,
      id: `adm-${Date.now()}`,
      role: 'admin',
      avatar: a.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(a.name)}`,
    };
    setAdmins((prev) => [newA, ...prev]);

    try {
      await setDoc(doc(db, 'users', newA.id), newA);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${newA.id}`);
    }
  };

  const editAdmin = async (id: string, updated: Partial<User>) => {
    const existing = admins.find((a) => a.id === id);
    if (!existing) return;
    const fullUpdated = { ...existing, ...updated };
    setAdmins((prev) => prev.map((a) => (a.id === id ? fullUpdated : a)));

    try {
      await setDoc(doc(db, 'users', id), fullUpdated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${id}`);
    }
  };

  const deleteAdmin = (id: string) => {
    if (currentUser?.id === id) {
      return { success: false, message: 'You cannot delete your own logged in admin account.' };
    }
    if (admins.length <= 1) {
      return { success: false, message: 'At least one admin account must remain in the system.' };
    }
    setAdmins((prev) => prev.filter((a) => a.id !== id));
    deleteDoc(doc(db, 'users', id)).catch((error) =>
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`)
    );
    return { success: true };
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      await setDoc(doc(db, 'settings', 'app_config'), updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/app_config');
    }
  };

  const updateMyAvatar = async (avatarUrl: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, avatar: avatarUrl };
    setCurrentUser(updatedUser);
    if (currentUser.role === 'admin') {
      await editAdmin(currentUser.id, { avatar: avatarUrl });
    } else if (currentUser.role === 'supervisor') {
      await editSupervisor(currentUser.id, { avatar: avatarUrl });
    } else if (currentUser.role === 'worker') {
      await editWorker(currentUser.id, { avatar: avatarUrl });
    }
  };

  const updateMyLanguage = async (lang: LanguageCode) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, language: lang };
    setCurrentUser(updatedUser);
    if (currentUser.role === 'admin') {
      await editAdmin(currentUser.id, { language: lang });
    } else if (currentUser.role === 'supervisor') {
      await editSupervisor(currentUser.id, { language: lang });
    } else if (currentUser.role === 'worker') {
      await editWorker(currentUser.id, { language: lang });
    }
  };

  const promptPWAInstall = async () => {
    if (pwaInstallEvent) {
      pwaInstallEvent.prompt();
      const choiceResult = await pwaInstallEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalledPWA(true);
        setPwaInstallEvent(null);
      }
    }
  };

  const canSeeNotification = (n: AppNotification): boolean => {
    if (n.targetRole === 'all') return true;
    const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
    if (n.targetRole === 'staff') {
      if (isStaff) return true;
      return !!n.targetUserId && n.targetUserId === currentUser?.id;
    }
    return n.targetRole === currentUser?.role;
  };

  const unreadNotifCount = notifications.filter((n) => !n.read && canSeeNotification(n)).length;

  const addNotification = async (notifData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...notifData,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);

    if (settings.soundNotifs !== false) {
      playNotificationSound();
    }

    if (settings.pushNotifs && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notifData.title, {
          body: notifData.message,
          icon: '/logo.png',
        });
      } catch (e) {
        console.warn('Native push notification failed:', e);
      }
    }

    try {
      await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `notifications/${newNotif.id}`);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `notifications/${id}`);
    }
  };

  const markAllNotificationsAsRead = async () => {
    const visibleIds = new Set(notifications.filter((n) => canSeeNotification(n)).map((n) => n.id));
    setNotifications((prev) => prev.map((n) => (visibleIds.has(n.id) ? { ...n, read: true } : n)));
    try {
      for (const n of notifications) {
        if (!n.read && visibleIds.has(n.id)) {
          await setDoc(doc(db, 'notifications', n.id), { read: true }, { merge: true });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'notifications');
    }
  };

  const clearNotifications = async () => {
    const visibleIds = notifications.filter((n) => canSeeNotification(n)).map((n) => n.id);
    const idsToDelete = new Set(visibleIds);
    setNotifications((prev) => prev.filter((n) => !idsToDelete.has(n.id)));
    try {
      for (const id of visibleIds) {
        await deleteDoc(doc(db, 'notifications', id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'notifications');
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `notifications/${id}`);
    }
  };

  // Bundles: granting push permission now turns on attendance, payment,
  // and new-worker notifications together, and (best-effort) registers this
  // device for background FCM push — see lib/firebase-messaging.ts. If FCM
  // isn't wired up yet, this still works exactly as before (foreground-only
  // Notification API), it just won't reach a closed app.
  const requestPushPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      showToast('Push notifications are not supported in this browser.', 'warning');
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await updateSettings({
          pushNotifs: true,
          attendanceNotifs: true,
          paymentNotifs: true,
          newWorkerNotifs: true,
        });

        // Best-effort FCM device registration for background/closed-app push.
        // Safe no-op if lib/firebase-messaging.ts hasn't been added yet.
        try {
          const mod = await import('../lib/firebase-messaging');
          if (currentUser && mod?.registerFcmToken) {
            const token = await mod.registerFcmToken();
            if (token) {
              await setDoc(
                doc(db, 'users', currentUser.id),
                { fcmTokens: arrayUnion(token) },
                { merge: true }
              );
            }
          }
        } catch (fcmErr) {
          console.warn('FCM registration skipped/failed (non-fatal):', fcmErr);
        }

        addNotification({
          title: 'Push Alerts Enabled',
          message: 'You will now receive desktop and mobile push alerts for site activities.',
          type: 'system',
          targetRole: 'all',
          linkModule: 'settings',
        });
        return true;
      } else {
        await updateSettings({ pushNotifs: false });
        return false;
      }
    } catch (err) {
      console.warn('Push permission request failed:', err);
      return false;
    }
  };

  // Turns off the master toggle and every notification category it bundles,
  // in one write — used by the single Settings toggle when switched off.
  const disablePushAndAllNotifs = async (): Promise<void> => {
    await updateSettings({
      pushNotifs: false,
      attendanceNotifs: false,
      paymentNotifs: false,
      newWorkerNotifs: false,
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers,
        workers,
        supervisors,
        admins,
        attendance,
        advances,
        payments,
        notifications,
        unreadNotifCount,
        activeDate,
        setActiveDate,
        settings,
        isOnline,
        pwaInstallEvent,
        isInstalledPWA,
        activeTab,
        setActiveTab,
        isFirebaseConnected,
        usersLoading,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        deleteNotification,
        requestPushPermission,
        disablePushAndAllNotifs,
        canSeeNotification,
        login,
        demoLogin,
        logout,
        markAttendance,
        markAllPresent,
        addAdvance,
        deleteAdvance,
        clearPayment,
        deletePayment,
        getWorkerPayroll,
        getAllPayrolls,
        addWorker,
        editWorker,
        deleteWorker,
        addSupervisor,
        editSupervisor,
        deleteSupervisor,
        addAdmin,
        editAdmin,
        deleteAdmin,
        updateSettings,
        updateMyAvatar,
        updateMyLanguage,
        promptPWAInstall,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};