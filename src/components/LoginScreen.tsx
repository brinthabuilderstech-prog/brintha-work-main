import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  CheckSquare,
  Square,
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, allUsers } = useApp();
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load remembered credentials on mount
  useEffect(() => {
    const saved = localStorage.getItem('brintha_remember_creds');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.phone) setPhone(parsed.phone);
        // For security, do not prefill saved password. Only restore phone and remember flag.
        if (typeof parsed.remember === 'boolean') setRememberMe(parsed.remember);
      } catch (e) {
        console.warn('Failed to parse saved login credentials');
      }
    }
  }, []);

  // Auto detect role based on phone entered
  const detectedUser = allUsers.find(
    (u) => u.phone.replace(/\D/g, '') === phone.replace(/\D/g, '') && phone.length >= 4
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!phone) {
      setErrorMsg('Please enter your phone number.');
      return;
    }
    setIsSubmitting(true);
    const res = login(phone, password);
    if (!res.success && res.message) {
      setErrorMsg(res.message);
      setIsSubmitting(false);
    } else if (res.success) {
      if (rememberMe) {
        // Save only non-sensitive info to localStorage
        localStorage.setItem('brintha_remember_creds', JSON.stringify({ phone, remember: true }));
      } else {
        localStorage.removeItem('brintha_remember_creds');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 text-slate-900">
      <div className="w-full max-w-md space-y-6">
        {/* App Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 shadow-md overflow-hidden p-0.5 mb-1">
            <img
              src="/favicon.ico"
              alt="Brintha Builders Logo"
              className="w-full h-full object-cover rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 id="app-title" className="text-2xl font-black tracking-tight text-slate-900 uppercase">Brintha Builders</h1>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Labour Attendance & Weekly Payroll Portal
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 id="login-heading" className="text-sm font-bold text-slate-900 uppercase tracking-tight">Account Login</h2>
            {detectedUser && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold uppercase flex items-center gap-1">
                Role: {detectedUser.role}
              </span>
            )}
          </div>

          {errorMsg && (
            <div
              id="login-error"
              role="alert"
              aria-live="polite"
              className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-md text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" aria-labelledby="login-heading" aria-describedby={errorMsg ? 'login-error' : undefined}>
            {/* Phone Number Field */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  aria-label="Phone number"
                  className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-md pl-9 pr-4 py-2 text-sm text-slate-900 font-mono placeholder-slate-400 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  aria-label="Password"
                  className="w-full bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-md pl-9 pr-10 py-2 text-sm text-slate-900 placeholder-slate-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  aria-pressed={rememberMe}
                  aria-label="Remember me on this device"
                  className="text-indigo-600 hover:text-indigo-700 focus:outline-hidden"
                >
                  {rememberMe ? (
                    <CheckSquare className="w-4 h-4 fill-indigo-50 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                <span onClick={() => setRememberMe(!rememberMe)}>Remember me on this device</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-md transition flex items-center justify-center gap-2 shadow-xs text-xs uppercase tracking-wider"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Brintha Builders Progressive Web App • Works Offline
        </p>
      </div>
    </div>
  );
};
