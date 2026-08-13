import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Phone,
  Edit2,
  Trash2,
  HardHat,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { User, TradeType } from '../types';
import { TRADES } from '../data/initialData';
import { exportWorkersPDF, exportWorkerPayslipPDF } from '../utils/pdfExport';
import { getTranslation } from '../utils/i18n';

export const WorkersDirectoryModule: React.FC = () => {
  const {
    workers,
    currentUser,
    addWorker,
    editWorker,
    deleteWorker,
    settings,
    getWorkerPayroll,
    usersLoading,
  } = useApp();

  const t = getTranslation(currentUser?.language || settings.language);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');

  // Modal state for Adding/Editing Worker
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected Worker Profile detail view modal
  const [profileWorker, setProfileWorker] = useState<User | null>(null);
  const [deletingWorker, setDeletingWorker] = useState<User | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('123456');
  const [formTrade, setFormTrade] = useState<TradeType>('Helper');
  const [formDailyRate, setFormDailyRate] = useState<string>('500');

  // Handle worker scope: if logged in as worker, only see self!
  const accessibleWorkers = currentUser?.role === 'worker'
    ? workers.filter((w) => w.id === currentUser.id)
    : workers;

  const filteredWorkers = accessibleWorkers.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.phone.includes(searchTerm) ||
      (w.trade && w.trade.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTrade = selectedTrade === 'all' || w.trade === selectedTrade;
    return matchesSearch && matchesTrade;
  });

  const handleOpenAdd = () => {
    setErrorMsg(null);
    setModalMode('add');
    setEditingId(null);
    setFormName('');
    setFormPhone('');
    setFormPassword('123456');
    setFormTrade('Helper');
    setFormDailyRate('500');
    setShowModal(true);
  };

  const handleOpenEdit = (w: User, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setErrorMsg(null);
    setModalMode('edit');
    setEditingId(w.id);
    setFormName(w.name);
    setFormPhone(w.phone);
    setFormPassword(w.password || '123456');
    if (w.trade) setFormTrade(w.trade);
    if (w.dailyRate) setFormDailyRate(String(w.dailyRate));
    setShowModal(true);
  };

  const handleDelete = (w: User, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingWorker(w);
  };

  const confirmDeleteWorker = () => {
    if (deletingWorker) {
      deleteWorker(deletingWorker.id);
      if (profileWorker?.id === deletingWorker.id) setProfileWorker(null);
      setDeletingWorker(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) {
      setErrorMsg('Name and Phone number are required.');
      return;
    }

    if (modalMode === 'add') {
      addWorker({
        name: formName,
        phone: formPhone,
        password: formPassword,
        trade: formTrade,
        dailyRate: Number(formDailyRate),
      });
    } else if (editingId) {
      editWorker(editingId, {
        name: formName,
        phone: formPhone,
        password: formPassword,
        trade: formTrade,
        dailyRate: Number(formDailyRate),
      });
    }

    setShowModal(false);
  };

  return (
    <div className="space-y-5 pb-24 text-slate-900">
      {/* Title Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            {t.workersDirectory}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentUser?.role === 'worker' ? t.onlySelfInfo : t.workersSubtitle}
          </p>
        </div>

        {currentUser?.role !== 'worker' && (
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => exportWorkersPDF(filteredWorkers, settings)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              {t.exportPdf}
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-md transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              {t.addWorker}
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label="Search workers by name, trade or phone"
            className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-md pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-xs"
          />
        </div>

        {currentUser?.role !== 'worker' && (
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              aria-label="Filter workers by trade"
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value)}
              className="flex-1 sm:flex-none bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-md px-3 py-2 text-sm text-slate-800 capitalize shadow-xs"
            >
              <option value="all">{t.allTrades}</option>
              {TRADES.map((tr) => (
                <option key={tr} value={tr}>
                  {tr}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Worker List Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-busy={usersLoading}>
        {usersLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`sk-${i}`} className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3 shadow-xs animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-slate-100" />
                  <div className="space-y-1">
                    <div className="h-4 bg-slate-100 rounded w-28" />
                    <div className="h-3 bg-slate-100 rounded w-20" />
                  </div>
                </div>
                <div className="w-16 h-6 bg-slate-100 rounded" />
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-md border border-slate-100 text-center">
                <div className="h-8 bg-slate-100 rounded" />
                <div className="h-8 bg-slate-100 rounded" />
                <div className="h-8 bg-slate-100 rounded" />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <div className="h-3 bg-slate-100 rounded w-32" />
                <div className="h-3 bg-slate-100 rounded w-24" />
              </div>
            </div>
          ))
        ) : (
          filteredWorkers.map((worker) => {
          const payroll = getWorkerPayroll(worker.id);

          return (
            <div
              key={worker.id}
              onClick={() => setProfileWorker(worker)}
              className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3 shadow-xs hover:border-indigo-300 transition cursor-pointer relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      worker.avatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${worker.name}`
                    }
                    alt={worker.name}
                    className="w-11 h-11 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{worker.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                        {worker.trade || 'Helper'}
                      </span>
                    </div>
                  </div>
                </div>

                {currentUser?.role !== 'worker' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(worker, e)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                      title={t.editAccount}
                      aria-label={`Edit ${worker.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(worker, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition"
                      title={t.deleteAccount}
                      aria-label={`Delete ${worker.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-md border border-slate-100 text-center font-mono">
                <div>
                  <div className="text-[9px] text-slate-400 uppercase font-bold">{t.dailyWageRate}</div>
                  <div className="text-xs font-bold text-slate-900">{settings.currency}{worker.dailyRate || 0}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 uppercase font-bold">{t.daysWorked}</div>
                  <div className="text-xs font-bold text-indigo-700">{payroll.daysWorked}d</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 uppercase font-bold">{t.netPayable}</div>
                  <div className="text-xs font-bold text-emerald-600">{settings.currency}{payroll.pendingBalance}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {worker.phone}
                </span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1" role="link" aria-label={`View profile of ${worker.name}`}>
                  <FileText className="w-3 h-3" />
                  View Profile
                </span>
              </div>
            </div>
          );
          })
        )}
      </div>

      {/* Worker Profile Detail Modal */}
      {profileWorker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="profile-heading">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-lg p-5 space-y-4 shadow-xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={
                    profileWorker.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${profileWorker.name}`
                  }
                  alt={profileWorker.name}
                  className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200"
                />
                <div>
                  <h3 id="profile-heading" className="font-bold text-base text-slate-900">{profileWorker.name}</h3>
                  <div className="text-xs text-slate-500 font-mono">{profileWorker.phone}</div>
                </div>
              </div>

              <button
                onClick={() => setProfileWorker(null)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Close profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detailed Payroll Breakdown */}
            {(() => {
              const p = getWorkerPayroll(profileWorker.id);
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{t.dailyWageRate}</div>
                      <div className="text-sm font-bold text-slate-900 font-mono">{settings.currency}{p.dailyRate}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{t.daysWorked}</div>
                      <div className="text-sm font-bold text-indigo-700 font-mono">{p.daysWorked} Days</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{t.totalAdvances}</div>
                      <div className="text-sm font-bold text-rose-600 font-mono">-{settings.currency}{p.totalAdvances}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{t.netPayable}</div>
                      <div className="text-sm font-bold text-emerald-600 font-mono">{settings.currency}{p.netSalary}</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-md border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone Number:</span>
                      <span className="font-bold font-mono text-slate-900">{profileWorker.phone}</span>
                    </div>
                    {currentUser?.role !== 'worker' && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Login Password:</span>
                        <span className="font-bold font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                          {profileWorker.password || '123456'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trade Specialty:</span>
                      <span className="font-bold text-slate-900">{profileWorker.trade || 'Helper'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned Site:</span>
                      <span className="font-bold text-slate-900">{profileWorker.site || 'Site A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Attendance Counts:</span>
                      <span className="font-bold text-slate-900">
                        {p.presentCount} Present • {p.halfDayCount} Half • {p.absentCount} Absent
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => exportWorkerPayslipPDF(profileWorker, p, settings)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-md text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      {t.downloadPayslip}
                    </button>
                    {currentUser?.role !== 'worker' && (
                      <button
                        onClick={() => handleOpenEdit(profileWorker)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-md text-xs uppercase"
                      >
                        {t.editAccount}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Add / Edit Worker Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md p-5 space-y-4 shadow-xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                {modalMode === 'add' ? t.addWorker : t.editAccount}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Worker Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-sm text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Login Password / PIN</label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-sm text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Worker will log in with Phone Number & this Password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Trade / Specialty</label>
                <select
                  value={formTrade}
                  onChange={(e) => setFormTrade(e.target.value as TradeType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {TRADES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Daily Wage Rate ({settings.currency})
                </label>
                <input
                  type="number"
                  min="100"
                  value={formDailyRate}
                  onChange={(e) => setFormDailyRate(e.target.value)}
                  placeholder="e.g. 850"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-sm text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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

      {/* Delete Confirmation Modal */}
      {deletingWorker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-sm p-5 space-y-4 shadow-xl text-slate-900">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase">Confirm Delete</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-slate-900">{deletingWorker.name}</span> ({deletingWorker.trade || 'Worker'}) from the system?
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingWorker(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 py-2 rounded-md text-xs font-bold text-slate-700 uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteWorker}
                className="flex-1 bg-rose-600 hover:bg-rose-700 py-2 rounded-md text-xs font-bold text-white uppercase shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
