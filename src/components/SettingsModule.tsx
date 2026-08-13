import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Globe,
  FileSpreadsheet,
  Smartphone,
  CheckCircle2,
  Download,
  HardHat,
  User as UserIcon,
  Camera,
  BellRing,
  Volume2,
} from 'lucide-react';
import { LANGUAGES, getTranslation } from '../utils/i18n';
import { exportAttendancePDF, exportPayrollPDF, exportWorkersPDF, exportWorkerPayslipPDF } from '../utils/pdfExport';
import { getDateOffset } from '../data/initialData';
import { useToast } from './Toast';

export const SettingsModule: React.FC = () => {
  const {
    currentUser,
    settings,
    updateSettings,
    updateMyAvatar,
    updateMyLanguage,
    pwaInstallEvent,
    promptPWAInstall,
    isInstalledPWA,
    workers,
    attendance,
    getAllPayrolls,
    getWorkerPayroll,
    requestPushPermission,
    disablePushAndAllNotifs,
  } = useApp();

  const { showToast } = useToast();

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  const activeLanguage = currentUser?.language || settings.language;
  const t = getTranslation(currentUser?.language || settings.language);

  if (!currentUser) return null;

  const role = currentUser.role;

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('File size exceeds 2MB limit. Please select a smaller photo.', 'warning');
      return;
    }

    setAvatarUploading(true);
    setAvatarSuccess(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        await updateMyAvatar(dataUrl);
        setAvatarUploading(false);
        setAvatarSuccess(true);
        setTimeout(() => setAvatarSuccess(false), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportAttendancePDF = () => {
    const today = getDateOffset(0);
    exportAttendancePDF(today, workers, attendance, settings);
  };

  const handleExportPayrollPDF = () => {
    const startDate = getDateOffset(-6);
    const endDate = getDateOffset(0);
    const payrolls = getAllPayrolls(startDate, endDate);
    exportPayrollPDF(payrolls, startDate, endDate, settings);
  };

  const handleExportWorkersPDF = () => {
    exportWorkersPDF(workers, settings);
  };

  const handleExportWorkerPayslip = () => {
    const p = getWorkerPayroll(currentUser.id);
    exportWorkerPayslipPDF(currentUser, p, settings);
  };

  return (
    <div className="space-y-5 pb-24 text-slate-900 max-w-4xl mx-auto px-1 sm:px-0">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-xs shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
              {t.settingsTitle}
            </h2>
            <p className="text-xs text-slate-500">{t.roleSpecificSettings} ({role.toUpperCase()})</p>
          </div>
        </div>

        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
          role === 'admin'
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
            : role === 'supervisor'
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {role} mode
        </span>
      </div>

      {/* Profile Avatar & Photo Upload Section - Visible to All Roles */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-indigo-600" />
          My Profile
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 border border-slate-200 rounded-md p-3.5">
          <img
            src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
            alt={currentUser.name}
            className="w-16 h-16 rounded-full object-cover bg-white border-2 border-indigo-200 shadow-sm shrink-0"
          />

          <div className="flex-1 text-center sm:text-left space-y-1">
            <h4 className="font-bold text-sm text-slate-900">{currentUser.name}</h4>
            <p className="text-xs text-slate-500 font-mono">{currentUser.phone} • {currentUser.role.toUpperCase()}</p>
            <p className="text-[11px] text-slate-400">Upload a custom profile photo (JPEG, PNG, GIF up to 2MB)</p>
          </div>

          <div className="shrink-0 flex flex-col items-center sm:items-end gap-1">
            <label className="cursor-pointer inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-md transition shadow-xs">
              <Camera className="w-3.5 h-3.5" />
              {avatarUploading ? 'Uploading...' : 'Change Photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
                disabled={avatarUploading}
              />
            </label>
            {avatarSuccess && (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Profile updated!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Language Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          {t.language} Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {LANGUAGES.map((lang) => {
            const isSelected = activeLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => updateMyLanguage(lang.code)}
                className={`p-3 rounded-md border text-left transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold'
                }`}
              >
                <div>
                  <div className="text-xs">{lang.nativeName}</div>
                  <div className="text-[10px] text-slate-400 uppercase">{lang.name}</div>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Worker-Specific Profile Summary & Payslip Download */}
      {role === 'worker' && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-emerald-600" />
            My Registered Profile Details
          </h3>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Full Name:</span>
              <span className="font-bold text-slate-900">{currentUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">{t.contactNumber}:</span>
              <span className="font-bold text-slate-900 font-mono">{currentUser.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Trade Specialty:</span>
              <span className="font-bold text-indigo-700">{currentUser.trade || 'Helper'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">{t.dailyWageRate}:</span>
              <span className="font-bold text-slate-900 font-mono">{settings.currency}{currentUser.dailyRate || 0}</span>
            </div>
          </div>

          <button
            onClick={handleExportWorkerPayslip}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-md transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            {t.downloadPayslip} (PDF)
          </button>
        </div>
      )}

      {/* Notification Preferences — consolidated to a single toggle.
          Turning it on requests browser push permission AND bundles
          attendanceNotifs / paymentNotifs / newWorkerNotifs to true.
          Turning it off disables all of them together via
          disablePushAndAllNotifs (see AppContext.tsx). */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <BellRing className="w-4 h-4 text-indigo-600" />
            {t.notifications}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            One switch controls all alerts — attendance, payments, and new worker updates all ride on
            Browser Push Alerts. Audio chimes are separate since they're just local sound playback.
          </p>
        </div>

        <div className="space-y-3">
          {/* Browser Web Push Notifications — single master toggle */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Browser Push Alerts</span>
                {settings.pushNotifs ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-600 border border-slate-300">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Receive pop-up notifications for attendance, payments, and new worker updates on your
                desktop or mobile home screen
              </p>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
              <button
                onClick={async () => {
                  await requestPushPermission();
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider rounded transition"
              >
                {settings.pushNotifs ? 'Re-authorize Push' : 'Enable Push Alerts'}
              </button>
              <input
                type="checkbox"
                checked={!!settings.pushNotifs}
                onChange={async (e) => {
                  if (e.target.checked) {
                    await requestPushPermission();
                  } else {
                    await disablePushAndAllNotifs();
                  }
                }}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Sound Chime Toggle — kept separate, it's just local playback */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer" onClick={() => updateSettings({ soundNotifs: !settings.soundNotifs })}>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Volume2 className="w-4 h-4 text-indigo-600" />
                Audio Chime Effects
              </div>
              <p className="text-[11px] text-slate-500">
                Play dual-tone Web Audio chime when site alerts, payments, or attendance logs trigger
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.soundNotifs !== false}
              onChange={(e) => updateSettings({ soundNotifs: e.target.checked })}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
            />
          </div>
        </div>
      </div>

      {/* Data Exports Section - PDF Reports */}
      {(role === 'admin' || role === 'supervisor') && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            {t.downloadPdfReports}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={handleExportAttendancePDF}
              className="flex items-center justify-center gap-2 p-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md text-xs font-bold text-indigo-700 uppercase tracking-wider transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              Attendance PDF
            </button>

            <button
              onClick={handleExportPayrollPDF}
              className="flex items-center justify-center gap-2 p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md text-xs font-bold text-emerald-700 uppercase tracking-wider transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              Payroll PDF
            </button>

            <button
              onClick={handleExportWorkersPDF}
              className="flex items-center justify-center gap-2 p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md text-xs font-bold text-amber-700 uppercase tracking-wider transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              Workers Master PDF
            </button>
          </div>
        </div>
      )}

      {/* PWA Status */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-600" />
          {t.pwaStatus}
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-md border border-slate-200">
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              {isInstalledPWA ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Installed Standalone App Mode
                </>
              ) : (
                <>
                  <HardHat className="w-4 h-4 text-indigo-600" />
                  Running in Web Browser
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Offline caching is active via Firestore. Works without internet connection.
            </p>
          </div>

          {pwaInstallEvent && !isInstalledPWA && (
            <button
              onClick={promptPWAInstall}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-md transition shadow-xs shrink-0"
            >
              {t.installPwa}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};