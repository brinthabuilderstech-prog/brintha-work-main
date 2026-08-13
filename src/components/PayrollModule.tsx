import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CircleDollarSign,
  Search,
  PlusCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  TrendingDown,
  X,
  CreditCard,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { WorkerDetailsModal } from './WorkerDetailsModal';
import { exportPayrollPDF, exportWorkerPayslipPDF } from '../utils/pdfExport';
import { PaymentMode } from '../types';
import { getTranslation } from '../utils/i18n';
import { getDateOffset } from '../data/initialData';

// Helper: Get Monday of current week
const getWeekStart = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
};

// Helper: Get date range for last N days
const getLastNDaysRange = (days: number) => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  return { startDate, endDate };
};

// Helper: Check if date is within range
const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  return date >= startDate && date <= endDate;
};

// Helper: Resolve payroll date safely when the payroll record may not include an explicit date
const resolvePayrollDate = (rawDate?: string | number | Date): Date => {
  return rawDate ? new Date(rawDate) : new Date();
};

export const PayrollModule: React.FC = () => {
  const {
    workers,
    getAllPayrolls,
    addAdvance,
    clearPayment,
    settings,
    currentUser,
  } = useApp();

  const t = getTranslation(currentUser?.language || settings.language);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedWorkerForDetails, setSelectedWorkerForDetails] = useState<string | null>(null);

  // Modal States
  const [showAdvanceModal, setShowAdvanceModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  // Advance Form State
  const [advWorkerId, setAdvWorkerId] = useState<string>('');
  const [advAmount, setAdvAmount] = useState<string>('');
  const [advReason, setAdvReason] = useState<string>('');

  // Payment Form State
  const [payWorkerId, setPayWorkerId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMode, setPayMode] = useState<PaymentMode>('Cash');
  const [payNotes, setPayNotes] = useState<string>('');

  const allPayrolls = getAllPayrolls();

  // Restrict list if worker logged in: ONLY see own record
  const accessiblePayrolls = currentUser?.role === 'worker'
    ? allPayrolls.filter((p) => p.workerId === currentUser.id)
    : allPayrolls;

  // Filter payrolls by search
  const filteredPayrolls = accessiblePayrolls.filter((p) =>
    p.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.trade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ===== DATE FILTERING LOGIC =====
  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000); // End of week (Sunday)

  // Current week payrolls (assuming payroll has a date or we use current date)
  const currentWeekPayrolls = filteredPayrolls.filter((p) => {
    const payrollDate = resolvePayrollDate((p as any).date);
    return isDateInRange(payrollDate, weekStart, weekEnd);
  });

  // Balance payrolls (everything else or older weeks)
  const balancePayrolls = filteredPayrolls.filter((p) => {
    const payrollDate = resolvePayrollDate((p as any).date);
    return !isDateInRange(payrollDate, weekStart, weekEnd);
  });

  // ===== CURRENT WEEK TOTALS =====
  const currentWeekGross = currentWeekPayrolls.reduce((sum, p) => sum + p.grossSalary, 0);
  const currentWeekPaid = currentWeekPayrolls.reduce((sum, p) => sum + p.totalPaid, 0);
  const currentWeekAdvances = currentWeekPayrolls.reduce((sum, p) => sum + p.totalAdvances, 0);

  // ===== BALANCE TOTALS (Other weeks) =====
  const balanceGross = balancePayrolls.reduce((sum, p) => sum + p.grossSalary, 0);
  const balancePending = balancePayrolls.reduce((sum, p) => sum + p.pendingBalance, 0);
  const balanceAdvances = balancePayrolls.reduce((sum, p) => sum + p.totalAdvances, 0);

  // ===== PAYMENT HISTORY (Last 2 weeks) =====
  const { startDate: twoWeeksAgo } = getLastNDaysRange(14);
  const paymentHistory = accessiblePayrolls
    .flatMap((p) => {
      const history = (p as any).paymentHistory ?? (p as any).payments ?? [];
      return history.map((payment: any) => ({
        workerId: p.workerId,
        workerName: p.workerName,
        ...payment,
      }));
    })
    .filter((payment) => {
      const paymentDate = new Date(payment.date);
      return isDateInRange(paymentDate, twoWeeksAgo, new Date());
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Handlers
  const handleOpenAdvanceModal = (wId?: string) => {
    if (!wId && workers.length === 0) return;
    setAdvWorkerId(wId || (workers[0]?.id || ''));
    setAdvAmount('');
    setAdvReason('');
    setShowAdvanceModal(true);
  };

  const handleOpenPaymentModal = (wId?: string, defaultAmt?: number) => {
    if (!wId && workers.length === 0) return;
    setPayWorkerId(wId || (workers[0]?.id || ''));
    setPayAmount(defaultAmt ? String(defaultAmt) : '');
    setPayMode('Cash');
    setPayNotes('');
    setShowPaymentModal(true);
  };

  const handleAddAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advWorkerId || !advAmount || Number(advAmount) <= 0) return;
    addAdvance(advWorkerId, Number(advAmount), advReason || 'General Advance');
    setShowAdvanceModal(false);
  };

  const handleClearPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payWorkerId || !payAmount || Number(payAmount) <= 0) return;
    clearPayment(payWorkerId, Number(payAmount), payMode, payNotes);
    setShowPaymentModal(false);
  };

  const handleExportPDF = () => {
    exportPayrollPDF(
      filteredPayrolls,
      weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      weekEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      settings
    );
  };

  const weekRange = `${weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;

  return (
    <div className="space-y-5 pb-24 text-slate-900">
      {/* ===== CURRENT WEEK SECTION ===== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            This Week ({weekRange})
          </h2>
        </div>

        {/* Current Week Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {t.grossSalary}
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                {settings.currency}{currentWeekGross.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-indigo-600 mt-1">
                {currentWeekPayrolls.length} {currentWeekPayrolls.length === 1 ? 'worker' : 'workers'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-xs">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total Payment
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                {settings.currency}{currentWeekPaid.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-emerald-500 mt-1">
                {currentWeekPayrolls.filter(p => p.isCleared).length} cleared
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Advances
              </div>
              <div className="text-2xl font-black text-rose-600 mt-1 font-mono">
                -{settings.currency}{currentWeekAdvances.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-rose-500 mt-1">This week only</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-xs">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Action Bar & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between mt-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <label htmlFor="payroll-search" className="sr-only">
              {t.searchPlaceholder}
            </label>
            <input
              id="payroll-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-md pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            {currentUser?.role !== 'worker' && (
              <>
                <button
                  onClick={() => handleOpenAdvanceModal()}
                  disabled={workers.length === 0}
                  className="flex items-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="w-4 h-4" />
                  {t.recordAdvance}
                </button>

                <button
                  onClick={() => handleOpenPaymentModal()}
                  disabled={workers.length === 0}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-md transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-4 h-4" />
                  {t.clearSalary}
                </button>
              </>
            )}

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md text-slate-800 font-bold text-xs uppercase transition shadow-xs"
              title="Export Weekly Payroll PDF"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Payroll List Cards - Current Week */}
        <div className="space-y-2.5 mt-4">
          {currentWeekPayrolls.length === 0 && (
            <div className="bg-white border border-dashed border-slate-200 rounded-lg p-8 text-center text-sm text-slate-400 font-semibold">
              No payroll records for this week.
            </div>
          )}

          {currentWeekPayrolls.map((p) => (
            <div
              key={p.workerId}
              className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-xs hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    {p.workerName}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                      {p.trade}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.dailyWageRate}: <span className="font-mono font-semibold">{settings.currency}{p.dailyRate}</span> • {p.daysWorked} {t.daysWorked}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 uppercase ${
                      p.isCleared
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}
                  >
                    {p.isCleared ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {p.isCleared ? t.cleared : t.pending}
                  </span>
                </div>
              </div>

              {/* Calculations Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-100 p-2.5 rounded-md text-center text-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{t.grossSalary}</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {settings.currency}{p.grossSalary}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{t.totalAdvances}</div>
                  <div className="font-mono font-bold text-rose-600 mt-0.5">
                    -{settings.currency}{p.totalAdvances}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{t.netPayable}</div>
                  <div className="font-mono font-bold text-emerald-600 mt-0.5">
                    {settings.currency}{p.pendingBalance}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{t.totalPaid}</div>
                  <div className="font-mono font-bold text-slate-700 mt-0.5">
                    {settings.currency}{p.totalPaid}
                  </div>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedWorkerForDetails(p.workerId)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 self-start sm:self-auto"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details & History
                </button>

                {currentUser?.role !== 'worker' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAdvanceModal(p.workerId)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded border border-slate-200 transition"
                    >
                      + Advance
                    </button>

                    <button
                      onClick={() => handleOpenPaymentModal(p.workerId, p.pendingBalance)}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded shadow-xs transition"
                    >
                      Clear Payment
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const w = workers.find((w) => w.id === p.workerId);
                      if (w) exportWorkerPayslipPDF(w, p, settings);
                    }}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded shadow-xs flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t.downloadPayslip}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== BALANCE SECTION (Other Weeks) ===== */}
      {balancePayrolls.length > 0 && (
        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Outstanding Balance
            </h2>
          </div>

          {/* Balance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                  Total Gross (Other Weeks)
                </div>
                <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
                  {settings.currency}{balanceGross.toLocaleString()}
                </div>
                <div className="text-[10px] font-bold text-amber-600 mt-1">
                  {balancePayrolls.length} {balancePayrolls.length === 1 ? 'worker' : 'workers'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-white text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
                <CircleDollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                  Pending Payment
                </div>
                <div className="text-2xl font-black text-rose-700 mt-1 font-mono">
                  {settings.currency}{balancePending.toLocaleString()}
                </div>
                <div className="text-[10px] font-bold text-rose-600 mt-1">To be cleared</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-white text-rose-600 flex items-center justify-center border border-rose-200 shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  Advances (Other Weeks)
                </div>
                <div className="text-2xl font-black text-slate-700 mt-1 font-mono">
                  -{settings.currency}{balanceAdvances.toLocaleString()}
                </div>
                <div className="text-[10px] font-bold text-slate-600 mt-1">To be deducted</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-white text-slate-600 flex items-center justify-center border border-slate-200 shadow-xs">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Balance Payroll List */}
          <div className="space-y-2.5 mt-4">
            {balancePayrolls.map((p) => (
              <div
                key={`balance-${p.workerId}`}
                className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 shadow-xs hover:border-slate-300 transition opacity-75"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {p.workerName}
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                        {p.trade}
                      </span>
                    </h3>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 uppercase ${
                        p.isCleared
                          ? 'bg-slate-200 text-slate-600 border-slate-300'
                          : 'bg-rose-100 text-rose-700 border-rose-200'
                      }`}
                    >
                      {p.isCleared ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {p.isCleared ? 'Cleared' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Calculations Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white border border-slate-100 p-2.5 rounded-md text-center text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Gross</div>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">
                      {settings.currency}{p.grossSalary}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Advances</div>
                    <div className="font-mono font-bold text-rose-600 mt-0.5">
                      -{settings.currency}{p.totalAdvances}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Pending</div>
                    <div className="font-mono font-bold text-amber-600 mt-0.5">
                      {settings.currency}{p.pendingBalance}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Paid</div>
                    <div className="font-mono font-bold text-slate-700 mt-0.5">
                      {settings.currency}{p.totalPaid}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== PAYMENT HISTORY (Last 2 Weeks) ===== */}
      {paymentHistory.length > 0 && (
        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Payment History (Last 2 Weeks)
            </h2>
          </div>

          {/* Payment History List */}
          <div className="space-y-2">
            {paymentHistory.map((payment, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{payment.workerName}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(payment.date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })} • {payment.mode}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-600 font-mono">
                    {settings.currency}{payment.amount.toLocaleString()}
                  </div>
                  {payment.notes && (
                    <p className="text-[10px] text-slate-500 mt-0.5">{payment.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Worker Details Modal Popup */}
      <WorkerDetailsModal
        workerId={selectedWorkerForDetails}
        onClose={() => setSelectedWorkerForDetails(null)}
      />

      {/* Add Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md p-5 space-y-4 shadow-xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-amber-600" />
                {t.recordAdvance}
              </h3>
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdvanceSubmit} className="space-y-4">
              <div>
                <label htmlFor="adv-worker" className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Select Worker
                </label>
                <select
                  id="adv-worker"
                  value={advWorkerId}
                  onChange={(e) => setAdvWorkerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.trade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="adv-amount" className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Advance Amount ({settings.currency})
                </label>
                <input
                  id="adv-amount"
                  type="number"
                  min="1"
                  step="1"
                  value={advAmount}
                  onChange={(e) => setAdvAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label htmlFor="adv-reason" className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Reason for Advance
                </label>
                <input
                  id="adv-reason"
                  type="text"
                  value={advReason}
                  onChange={(e) => setAdvReason(e.target.value)}
                  placeholder="e.g. Medical, Travel expense support"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 py-2 rounded-md text-xs font-bold text-slate-700 uppercase"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-2 rounded-md text-xs font-bold text-white uppercase shadow-xs"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md p-5 space-y-4 shadow-xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                {t.clearSalary}
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClearPaymentSubmit} className="space-y-4">
              <div>
                <label htmlFor="pay-worker" className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Select Worker
                </label>
                <select
                  id="pay-worker"
                  value={payWorkerId}
                  onChange={(e) => setPayWorkerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.trade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pay-amount" className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Amount Paid ({settings.currency})
                </label>
                <input
                  id="pay-amount"
                  type="number"
                  min="1"
                  step="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 4250"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label htmlFor="pay-mode" className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Payment Mode
                </label>
                <select
                  id="pay-mode"
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as PaymentMode)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label htmlFor="pay-notes" className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Notes / Reference
                </label>
                <input
                  id="pay-notes"
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Week 32 salary settlement"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 py-2 rounded-md text-xs font-bold text-slate-700 uppercase"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-2 rounded-md text-xs font-bold text-white uppercase shadow-xs"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};