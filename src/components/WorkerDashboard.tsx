import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Download,
  TrendingDown,
  History,
  HardHat,
} from 'lucide-react';
import { getDateOffset } from '../data/initialData';
import { exportWorkerPayslipPDF } from '../utils/pdfExport';
import { getTranslation } from '../utils/i18n';
import { useToast } from './Toast';

export const WorkerDashboard: React.FC = () => {
  const { currentUser, attendance, advances, payments, getWorkerPayroll, settings } = useApp();
  const { showToast } = useToast();

  const t = getTranslation(currentUser?.language || settings.language);

  // getWorkerPayroll always returns a complete WorkerCalculatedPayroll object
  // (it has its own internal default for an unknown/missing worker), so no
  // fallback object is needed here — and a partial fallback would fail to
  // satisfy the return type anyway.
  const payroll = getWorkerPayroll(currentUser?.id ?? '');

  // Hooks must run in the same order on every render, so these are called
  // unconditionally, before any early return below — filtering safely on
  // currentUser?.id rather than relying on currentUser being defined.
  const myAdvances = React.useMemo(
    () => advances.filter((a) => a.workerId === currentUser?.id),
    [advances, currentUser?.id]
  );

  const myPayments = React.useMemo(
    () => payments.filter((p) => p.workerId === currentUser?.id),
    [payments, currentUser?.id]
  );

  // Early return happens only after all hooks above have run, so hook order
  // stays consistent across renders even when currentUser is briefly null
  // (e.g. during logout or initial load).
  if (!currentUser) return null;

  // Past 7 days attendance
  const getPastSevenDays = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      days.push(getDateOffset(-i));
    }
    return days;
  };
  const weekDates = getPastSevenDays();

  const handleDownloadPayslip = () => {
    try {
      exportWorkerPayslipPDF(currentUser, payroll, settings);
    } catch (error) {
      console.error('Failed to export payslip:', error);
      showToast('Failed to download payslip. Please try again.', 'error');
    }
  };

  const currency = settings?.currency || '$';
  const dailyRate = currentUser.dailyRate ?? 0;

  return (
    <div className="space-y-5 pb-24 text-slate-900">
      {/* Profile Greeting Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={
                currentUser.avatar ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`
              }
              alt={currentUser.name}
              className="w-14 h-14 rounded-lg object-cover bg-slate-100 border border-slate-200 shadow-xs"
              onError={(e) => {
                e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`;
              }}
            />
            <div>
              <div className="text-[10px] text-indigo-700 font-bold uppercase tracking-widest flex items-center gap-1 mb-0.5">
                <HardHat className="w-3.5 h-3.5" />
                {t.worker} Portal
              </div>
              <h2 className="text-xl font-black text-slate-900">{currentUser.name}</h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold uppercase text-[10px]">
                  {currentUser.trade || 'Helper'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadPayslip}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-md transition shadow-xs"
            disabled={!payroll || payroll.daysWorked === 0}
          >
            <Download className="w-4 h-4" />
            {t.downloadPayslip} (PDF)
          </button>
        </div>
      </div>

      {/* Payroll Financial Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.dailyWageRate}</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {currency}{dailyRate}
          </div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">Per Day Wage</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.daysWorked}</div>
          <div className="text-2xl font-black text-indigo-700 mt-1 font-mono">
            {payroll.daysWorked ?? 0} Days
          </div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">
            {payroll.presentCount ?? 0} Full + {payroll.halfDayCount ?? 0} Half
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.totalAdvances}</div>
          <div className="text-2xl font-black text-rose-600 mt-1 font-mono">
            -{currency}{payroll.totalAdvances ?? 0}
          </div>
          <div className="text-[10px] font-bold text-rose-500 mt-1">Deducted from gross</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-center">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">{t.netPayable}</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
            {currency}{payroll.netSalary ?? 0}
          </div>
          <div className="text-[10px] font-bold text-emerald-600 mt-1">
            {payroll.isCleared ? t.cleared : t.pending}
          </div>
        </div>
      </div>

      {/* Weekly Attendance Matrix */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          {t.myAttendanceSummary}
        </h3>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-3 text-center pt-2">
          {weekDates.map((d) => {
            const dayName = new Date(d).toLocaleDateString('en-US', { weekday: 'short' });
            const dateNum = new Date(d).getDate();

            const rec = attendance.find((a) => a.workerId === currentUser.id && a.date === d);
            const status = rec?.status ?? 'unmarked';

            return (
              <div key={d} className="bg-slate-50 border border-slate-200 p-2 rounded-md">
                <div className="text-[10px] text-slate-500 font-bold uppercase">{dayName}</div>
                <div className="text-xs font-semibold text-slate-400 mb-1">{dateNum}</div>

                <div
                  className={`w-7 h-7 mx-auto rounded flex items-center justify-center font-bold text-xs ${
                    status === 'present'
                      ? 'bg-emerald-500 text-white'
                      : status === 'half_day'
                      ? 'bg-amber-400 text-white'
                      : status === 'absent'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {status === 'present' ? 'P' : status === 'half_day' ? 'H' : status === 'absent' ? 'A' : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Advances & Payments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Advance History */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-amber-600" />
            {t.myAdvancesHistory} ({myAdvances.length})
          </h3>

          {myAdvances.length === 0 ? (
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
              {t.noAdvances}
            </p>
          ) : (
            <div className="space-y-2">
              {myAdvances.map((adv) => (
                <div
                  key={adv.id}
                  className="bg-slate-50 border border-slate-200 p-2.5 rounded flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{adv.reason || 'N/A'}</div>
                    <div className="text-[10px] text-slate-500">{adv.date || 'Unknown date'}</div>
                  </div>
                  <div className="font-mono font-bold text-rose-600">
                    -{currency}{adv.amount ?? 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            {t.myPaymentsHistory} ({myPayments.length})
          </h3>

          {myPayments.length === 0 ? (
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
              {t.noPayments}
            </p>
          ) : (
            <div className="space-y-2">
              {myPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="bg-slate-50 border border-slate-200 p-2.5 rounded flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      Payment via {pay.paymentMode || 'N/A'}
                    </div>
                    <div className="text-[10px] text-slate-500">{pay.date || 'Unknown date'}</div>
                  </div>
                  <div className="font-mono font-bold text-emerald-600">
                    +{currency}{pay.amount ?? 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};