import React from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  User,
  Phone,
  Briefcase,
  Calendar,
  CreditCard,
  History,
  TrendingDown,
  CheckCircle2,
  DollarSign,
  Trash2,
} from 'lucide-react';
import { getDateOffset } from '../data/initialData';

interface WorkerDetailsModalProps {
  workerId: string | null;
  onClose: () => void;
}

export const WorkerDetailsModal: React.FC<WorkerDetailsModalProps> = ({ workerId, onClose }) => {
  const { workers, advances, payments, getWorkerPayroll, settings, deleteAdvance, deletePayment, currentUser } = useApp();

  if (!workerId) return null;

  const worker = workers.find((w) => w.id === workerId);
  if (!worker) return null;

  const payroll = getWorkerPayroll(workerId);
  const workerAdvances = advances.filter((a) => a.workerId === workerId);
  const workerPayments = payments.filter((p) => p.workerId === workerId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900 p-5 space-y-5 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <img
              src={
                worker.avatar ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${worker.name}`
              }
              alt={worker.name}
              className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
            />
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {worker.name}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                  {worker.trade || 'Helper'}
                </span>
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {worker.phone}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Calculated Payroll Summary Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" />
            Current Payroll Calculation
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-white p-2.5 rounded border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Daily Wage</div>
              <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                {settings.currency}{worker.dailyRate || 0}
              </div>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Days Worked</div>
              <div className="text-base font-bold text-indigo-700 mt-0.5">
                {payroll.daysWorked} Days
              </div>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Gross Salary</div>
              <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                {settings.currency}{payroll.grossSalary}
              </div>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Net Payable</div>
              <div className="text-base font-bold font-mono text-emerald-600 mt-0.5">
                {settings.currency}{payroll.netSalary}
              </div>
            </div>
          </div>
        </div>

        {/* Advance History */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-amber-600" />
            Advance History ({workerAdvances.length})
          </h3>

          {workerAdvances.length === 0 ? (
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
              No active advances recorded for this worker.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {workerAdvances.map((adv) => (
                <div
                  key={adv.id}
                  className="bg-slate-50 border border-slate-200 p-2.5 rounded flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{adv.reason}</div>
                    <div className="text-[10px] text-slate-500">{adv.date}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-mono font-bold text-rose-600">
                        -{settings.currency}{adv.amount}
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 uppercase font-bold">
                        {adv.status}
                      </span>
                    </div>
                    {currentUser?.role !== 'worker' && (
                      <button
                        onClick={() => deleteAdvance(adv.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded transition"
                        title="Delete advance record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            Payment History ({workerPayments.length})
          </h3>

          {workerPayments.length === 0 ? (
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
              No payments cleared yet for this worker.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {workerPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="bg-slate-50 border border-slate-200 p-2.5 rounded flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      Payment via {pay.paymentMode}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {pay.date} • Cleared by {pay.clearedBy || 'Admin'}
                    </div>
                    {pay.notes && (
                      <div className="text-[10px] text-slate-500 italic">{pay.notes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-600">
                        +{settings.currency}{pay.amount}
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase font-bold">
                        Cleared
                      </span>
                    </div>
                    {currentUser?.role !== 'worker' && (
                      <button
                        onClick={() => deletePayment(pay.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded transition"
                        title="Delete payment record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-xs uppercase transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
