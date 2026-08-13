import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Phone,
  Shield,
  KeyRound,
} from 'lucide-react';
import { User } from '../types';
import { getTranslation } from '../utils/i18n';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';

export const ManagementModule: React.FC = () => {
  const {
    supervisors,
    admins,
    currentUser,
    addSupervisor,
    editSupervisor,
    deleteSupervisor,
    addAdmin,
    editAdmin,
    deleteAdmin,
    settings,
  } = useApp();

  const { showToast } = useToast();
  const confirm = useConfirm();

  const t = getTranslation(currentUser?.language || settings.language);

  // Hooks must run in the same order on every render, so all useState calls
  // live here — above the early "access denied" return below — rather than
  // after it. Previously they were declared after the return, which meant a
  // worker landing on this screen would skip every hook call entirely.
  const [activeSubTab, setActiveSubTab] = useState<'supervisors' | 'admins'>('supervisors');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');

  // If worker or unauthorized user, show access denied
  if (currentUser?.role === 'worker') {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center space-y-3 max-w-md mx-auto shadow-sm my-10">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{t.accessDenied}</h3>
        <p className="text-xs text-slate-500">{t.onlySelfInfo}</p>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setErrorMsg(null);
    setModalMode('add');
    setEditingId(null);
    setFormName('');
    setFormPhone('');
    setFormPassword('123456');
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setErrorMsg(null);
    setModalMode('edit');
    setEditingId(user.id);
    setFormName(user.name);
    setFormPhone(user.phone);
    setFormPassword(user.password || '123456');
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    setErrorMsg(null);
    const roleLabel = activeSubTab === 'supervisors' ? 'Supervisor' : 'Admin';

    const confirmed = await confirm({
      title: 'Confirm Delete',
      message: `Are you sure you want to remove account for ${name} (${roleLabel}) from the system? This action cannot be undone.`,
      confirmLabel: 'Delete Account',
      danger: true,
    });

    if (!confirmed) return;

    if (activeSubTab === 'supervisors') {
      deleteSupervisor(id);
      showToast(`${name} removed from supervisors.`, 'success');
    } else if (activeSubTab === 'admins') {
      const res = deleteAdmin(id);
      if (!res.success && res.message) {
        setErrorMsg(res.message);
        showToast(res.message, 'error');
      } else {
        showToast(`${name} removed from admins.`, 'success');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formName || !formPhone) {
      setErrorMsg('Name and Phone number are required.');
      return;
    }

    const roleLabel = activeSubTab === 'supervisors' ? 'Supervisor' : 'Admin';

    if (activeSubTab === 'supervisors') {
      if (modalMode === 'add') {
        addSupervisor({
          name: formName,
          phone: formPhone,
          password: formPassword,
        });
      } else if (editingId) {
        editSupervisor(editingId, {
          name: formName,
          phone: formPhone,
          password: formPassword,
        });
      }
    } else if (activeSubTab === 'admins') {
      if (modalMode === 'add') {
        addAdmin({
          name: formName,
          phone: formPhone,
          password: formPassword,
        });
      } else if (editingId) {
        editAdmin(editingId, {
          name: formName,
          phone: formPhone,
          password: formPassword,
        });
      }
    }

    showToast(
      modalMode === 'add' ? `${roleLabel} account created for ${formName}.` : `${roleLabel} account updated.`,
      'success'
    );
    setShowModal(false);
  };

  const getActiveList = () => {
    let list: User[] = [];
    if (activeSubTab === 'supervisors') list = supervisors;
    if (activeSubTab === 'admins') list = admins;

    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone.includes(searchTerm)
    );
  };

  const currentList = getActiveList();

  return (
    <div className="space-y-5 pb-24 text-slate-900">
      {/* Module Title */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            {t.userManagement}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.manageSubtitle}
          </p>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="bg-slate-100 p-1 rounded-md flex items-center gap-1 border border-slate-200">
          <button
            onClick={() => {
              setActiveSubTab('supervisors');
              setSearchTerm('');
            }}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
              activeSubTab === 'supervisors'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Supervisors ({supervisors.length})
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => {
                setActiveSubTab('admins');
                setSearchTerm('');
              }}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                activeSubTab === 'admins'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admins ({admins.length})
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-md text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeSubTab} by name or phone...`}
            className="w-full bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-md pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-xs"
          />
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-md transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            {activeSubTab === 'supervisors' ? t.addSupervisor : t.addAdmin}
          </button>
        )}
      </div>

      {/* User Records Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {currentList.map((user) => (
          <div
            key={user.id}
            className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition"
          >
            <div className="flex items-center gap-3">
              <img
                src={
                  user.avatar ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`
                }
                alt={user.name}
                className="w-11 h-11 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
              />
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  {user.name}
                  {user.id === currentUser?.id && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                      You
                    </span>
                  )}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {user.phone}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <KeyRound className="w-3 h-3" />
                    •••
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {currentUser?.role === 'admin' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(user)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                  title={t.editAccount}
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(user.id, user.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition"
                  title={t.deleteAccount}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg w-full max-w-md p-5 space-y-4 shadow-xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight capitalize">
                {modalMode === 'add' ? 'Add' : 'Edit'} {activeSubTab === 'supervisors' ? 'Supervisor' : 'Admin'} Account
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Account Password
                </label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Enter login password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
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
    </div>
  );
};