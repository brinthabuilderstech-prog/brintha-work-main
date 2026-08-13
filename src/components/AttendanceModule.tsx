import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  MinusCircle,
  CheckCheck,
  Download,
  Filter,
  Layers,
  Lock,
} from 'lucide-react';
import { AttendanceStatus, TradeType } from '../types';
import { TRADES, getDateOffset, addDaysToDateString } from '../data/initialData';
import { exportAttendancePDF } from '../utils/pdfExport';
import { getTranslation } from '../utils/i18n';

export const AttendanceModule: React.FC = () => {
  const {
    workers,
    attendance,
    activeDate,
    setActiveDate,
    markAttendance,
    markAllPresent,
    currentUser,
    settings,
  } = useApp();

  const t = getTranslation(currentUser?.language || settings.language);

  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');

  // Date Navigation Handlers
  const todayStr = getDateOffset(0);
  const isToday = activeDate === todayStr;

  const handlePrevDay = () => {
    setActiveDate(addDaysToDateString(activeDate, -1));
  };

  const handleNextDay = () => {
    if (activeDate >= todayStr) return;
    const nextDate = addDaysToDateString(activeDate, 1);
    setActiveDate(nextDate > todayStr ? todayStr : nextDate);
  };

  const handleYesterday = () => {
    setActiveDate(getDateOffset(-1));
  };

  const handleToday = () => {
    setActiveDate(todayStr);
  };

  // Restrict list if worker logged in: ONLY see own record
  const accessibleWorkers = currentUser?.role === 'worker'
    ? workers.filter((w) => w.id === currentUser.id)
    : workers;

  // Filter Workers
  const filteredWorkers = accessibleWorkers.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.trade && w.trade.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (w.phone && w.phone.includes(searchTerm));
    const matchesTrade = selectedTrade === 'all' || w.trade === selectedTrade;
    return matchesSearch && matchesTrade;
  });

  // Calculate Attendance Stats for activeDate
  const currentRecords = attendance.filter((a) => a.date === activeDate);
  let presentCount = 0;
  let halfDayCount = 0;
  let absentCount = 0;
  let unmarkedCount = 0;

  filteredWorkers.forEach((w) => {
    const rec = currentRecords.find((r) => r.workerId === w.id);
    if (!rec || rec.status === 'unmarked') {
      unmarkedCount++;
    } else if (rec.status === 'present') {
      presentCount++;
    } else if (rec.status === 'half_day') {
      halfDayCount++;
    } else if (rec.status === 'absent') {
      absentCount++;
    }
  });

  const totalWorkers = filteredWorkers.length;
  const presentPct = totalWorkers > 0 ? Math.round(((presentCount + halfDayCount * 0.5) / totalWorkers) * 100) : 0;

  const handleMarkAllPresent = () => {
    const ids = filteredWorkers.map((w) => w.id);
    markAllPresent(activeDate, ids);
  };

  const getStatusOfWorker = (workerId: string): AttendanceStatus => {
    const rec = currentRecords.find((r) => r.workerId === workerId);
    return rec ? rec.status : 'unmarked';
  };

  // Format Date for Header Display (local safe)
  const [actY, actM, actD] = activeDate.split('-').map(Number);
  const formattedDate = new Date(actY, actM - 1, actD).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Generate 7 days for weekly view relative to activeDate
  const getPastSevenDays = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      days.push(addDaysToDateString(activeDate, -i));
    }
    return days;
  };
  const weekDates = getPastSevenDays();

  return (
    <div className="space-y-5 pb-24 text-slate-900">
      {/* Date Header & View Selector */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Date Picker Nav */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 bg-slate-100 p-1.5 rounded-md border border-slate-200">
            <button
              onClick={handlePrevDay}
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
              title="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 px-1 sm:px-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <input
                type="date"
                value={activeDate}
                max={todayStr}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val > todayStr) {
                    setActiveDate(todayStr);
                  } else {
                    setActiveDate(val);
                  }
                }}
                aria-label="Select date"
                className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer font-mono"
              />
            </div>

            <button
              onClick={handleNextDay}
              disabled={activeDate >= todayStr}
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Next Day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleYesterday}
              className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 px-2 py-1 rounded font-bold uppercase tracking-wider transition"
            >
              Yesterday
            </button>

            <button
              onClick={handleToday}
              className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-2 py-1 rounded font-bold uppercase tracking-wider transition"
            >
              {t.today}
            </button>
          </div>

          {/* Toggle Daily vs Weekly & Export */}
          <div className="flex items-center gap-2 justify-end">
            <div className="bg-slate-100 p-1 rounded-md flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition ${
                  viewMode === 'daily'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.daily}
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition ${
                  viewMode === 'weekly'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.weeklyMatrix}
              </button>
            </div>

            <button
              onClick={() => exportAttendancePDF(activeDate, filteredWorkers, attendance, settings)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md text-slate-800 text-xs font-bold uppercase transition"
              title="Export PDF"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Summary Stats */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-tight">
              {t.dailyTracker} — {formattedDate}
            </span>
            <span className="font-bold text-indigo-700 text-xs">{presentPct}% {t.capacity}</span>
          </div>

          {/* Multi-segment progress bar */}
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${(presentCount / (totalWorkers || 1)) * 100}%` }}
              className="bg-emerald-500 transition-all duration-300"
              title="Present"
            />
            <div
              style={{ width: `${(halfDayCount / (totalWorkers || 1)) * 100}%` }}
              className="bg-amber-400 transition-all duration-300"
              title="Half Day"
            />
            <div
              style={{ width: `${(absentCount / (totalWorkers || 1)) * 100}%` }}
              className="bg-rose-500 transition-all duration-300"
              title="Absent"
            />
          </div>

          {/* Count Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-2 text-center">
            <div className="bg-emerald-50 border border-emerald-100 p-2 sm:p-2.5 rounded-md">
              <div className="text-emerald-700 font-black text-lg sm:text-xl">{presentCount}</div>
              <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">{t.present}</div>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-2 sm:p-2.5 rounded-md">
              <div className="text-amber-700 font-black text-lg sm:text-xl">{halfDayCount}</div>
              <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">{t.halfDay}</div>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-2 sm:p-2.5 rounded-md">
              <div className="text-rose-700 font-black text-lg sm:text-xl">{absentCount}</div>
              <div className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">{t.absent}</div>
            </div>
            <div className="bg-slate-100 border border-slate-200 p-2 sm:p-2.5 rounded-md">
              <div className="text-slate-700 font-black text-lg sm:text-xl">{unmarkedCount}</div>
              <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{t.unmarked}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lock Notification Banner for Non-Today Dates */}
      {!isToday && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-medium shadow-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Attendance Locked ({activeDate}):</strong> Attendance can only be marked or changed for <strong>Today ({todayStr})</strong>. Yesterday and past dates are view-only.
            </span>
          </div>
          <button
            onClick={handleToday}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded transition"
          >
            Go to Today
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-md pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-xs"
          />
        </div>

        {currentUser?.role !== 'worker' && (
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-48">
              <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                value={selectedTrade}
                aria-label="Filter workers by trade"
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-md pl-9 pr-3 py-2 text-sm text-slate-800 capitalize appearance-none shadow-xs"
              >
                <option value="all">{t.allTrades}</option>
                {TRADES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleMarkAllPresent}
              disabled={!isToday}
              title={!isToday ? "Attendance can only be marked for Today" : "Mark all present"}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-md transition shadow-xs whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4" />
              {t.markAllPresent}
            </button>
          </div>
        )}
      </div>

      {/* Daily Mode: Worker Cards */}
      {viewMode === 'daily' && (
        <div className="space-y-2.5">
          {filteredWorkers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 shadow-xs">
              <Layers className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-bold">No workers found.</p>
            </div>
          ) : (
            filteredWorkers.map((worker) => {
              const status = getStatusOfWorker(worker.id);

              return (
                <div
                  key={worker.id}
                  className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-slate-300 transition"
                >
                  {/* Worker Info */}
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        worker.avatar ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${worker.name}`
                      }
                      alt={worker.name}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        {worker.name}
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                          {worker.trade || 'Helper'}
                        </span>
                      </h3>
                      <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                        <span className="font-mono font-semibold">{settings.currency}{worker.dailyRate || 0}/day</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Control Buttons */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      onClick={() => markAttendance(worker.id, activeDate, 'present')}
                      disabled={!isToday || currentUser?.role === 'worker'}
                      title={!isToday ? "Attendance can only be marked for Today" : "Mark Present"}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition border disabled:opacity-40 disabled:cursor-not-allowed ${
                        status === 'present'
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-500 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      P
                    </button>

                    <button
                      onClick={() => markAttendance(worker.id, activeDate, 'half_day')}
                      disabled={!isToday || currentUser?.role === 'worker'}
                      title={!isToday ? "Attendance can only be marked for Today" : "Mark Half Day"}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition border disabled:opacity-40 disabled:cursor-not-allowed ${
                        status === 'half_day'
                          ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-amber-400 hover:text-white'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      H
                    </button>

                    <button
                      onClick={() => markAttendance(worker.id, activeDate, 'absent')}
                      disabled={!isToday || currentUser?.role === 'worker'}
                      title={!isToday ? "Attendance can only be marked for Today" : "Mark Absent"}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition border disabled:opacity-40 disabled:cursor-not-allowed ${
                        status === 'absent'
                          ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-rose-500 hover:text-white'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      A
                    </button>

                    {status !== 'unmarked' && isToday && currentUser?.role !== 'worker' && (
                      <button
                        onClick={() => markAttendance(worker.id, activeDate, 'unmarked')}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
                        title="Reset Status"
                      >
                        <MinusCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Weekly Matrix Mode */}
      {viewMode === 'weekly' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs text-slate-800 min-w-[640px]">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Worker</th>
                {weekDates.map((d) => {
                  const [y, m, dayNum] = d.split('-').map(Number);
                  const localD = new Date(y, m - 1, dayNum);
                  const dayName = localD.toLocaleDateString('en-US', { weekday: 'short' });
                  const dateNum = localD.getDate();
                  const isToday = d === getDateOffset(0);
                  return (
                    <th
                      key={d}
                      className={`p-2 text-center cursor-pointer hover:bg-slate-100 transition ${
                        isToday ? 'bg-indigo-50 text-indigo-700' : ''
                      }`}
                      onClick={() => setActiveDate(d)}
                      title={`Switch view to ${d}`}
                    >
                      <div>{dayName}</div>
                      <div className="text-[9px] text-slate-400">{dateNum}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkers.map((worker) => (
                <tr key={worker.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-xs text-slate-900">{worker.name}</div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase font-semibold">
                        {worker.trade}
                      </span>
                    </div>
                  </td>
                  {weekDates.map((d) => {
                    const rec = attendance.find((a) => a.workerId === worker.id && a.date === d);
                    const st = rec ? rec.status : 'unmarked';
                    const isCellToday = d === todayStr;

                    return (
                      <td key={d} className="p-2 text-center">
                        <button
                          onClick={() => {
                            if (!isCellToday || currentUser?.role === 'worker') return;
                            const nextSt: AttendanceStatus =
                              st === 'unmarked'
                                ? 'present'
                                : st === 'present'
                                ? 'half_day'
                                : st === 'half_day'
                                ? 'absent'
                                : 'unmarked';
                            markAttendance(worker.id, d, nextSt);
                          }}
                          disabled={!isCellToday || currentUser?.role === 'worker'}
                          title={!isCellToday ? `Attendance for ${d} is read-only` : 'Click to change status'}
                          className={`w-7 h-7 rounded font-bold text-xs transition border mx-auto flex items-center justify-center ${
                            !isCellToday || currentUser?.role === 'worker' ? 'cursor-not-allowed opacity-75' : ''
                          } ${
                            st === 'present'
                              ? 'bg-emerald-500 text-white border-emerald-600'
                              : st === 'half_day'
                              ? 'bg-amber-400 text-white border-amber-500'
                              : st === 'absent'
                              ? 'bg-rose-500 text-white border-rose-600'
                              : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {st === 'present'
                            ? 'P'
                            : st === 'half_day'
                            ? 'H'
                            : st === 'absent'
                            ? 'A'
                            : '-'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
