import React from 'react';
import { AppProvider, useApp } from './context/AppContext';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { LoginScreen } from './components/LoginScreen';

import { AttendanceModule } from './components/AttendanceModule';
import { PayrollModule } from './components/PayrollModule';
import { WorkersDirectoryModule } from './components/WorkersDirectoryModule';
import { ManagementModule } from './components/ManagementModule';
import { SettingsModule } from './components/SettingsModule';
import { WorkerDashboard } from './components/WorkerDashboard';
import { OfflineIndicator } from './components/OfflineIndicator';

import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';

const MainLayout: React.FC = () => {
  const { currentUser, activeTab } = useApp();

  // IMPORTANT:
  // When there is no logged-in user, show the login screen.
  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <OfflineIndicator />

      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 py-4 sm:py-6 overflow-x-hidden">
        {activeTab === 'dashboard' && <WorkerDashboard />}

        {activeTab === 'attendance' && <AttendanceModule />}

        {activeTab === 'payroll' && <PayrollModule />}

        {activeTab === 'workers' && <WorkersDirectoryModule />}

        {activeTab === 'management' && <ManagementModule />}

        {activeTab === 'settings' && <SettingsModule />}
      </main>

      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    // ErrorBoundary sits outermost so it can catch crashes from anywhere
    // below it, including inside AppProvider itself (e.g. a bad Firestore
    // response) — a bug now shows a "Reload App" screen instead of a blank
    // white page.
    //
    // ToastProvider/ConfirmProvider sit OUTSIDE AppProvider (not inside) so
    // that AppContext.tsx's own internal functions (e.g. requestPushPermission)
    // can call useToast()/useConfirm() themselves — a hook only works inside
    // a descendant of its provider, and AppProvider needs to be that descendant.
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <AppProvider>
            <MainLayout />
          </AppProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}