import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Globe, AlertCircle } from 'lucide-react';
import { MedStockLogo } from '../assets/logo';
import { useApp } from '../context/AppContext';
import { loginApi } from '../services/apiService';
import { ApiError, getApiBaseUrl } from '../api/client';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('manager@medstock.ai');
  const [password, setPassword] = useState('medstock2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setCurrentUser, addToast, t, language, toggleLanguage } = useApp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user } = await loginApi(email, password);

      // Store user in localStorage for session persistence
      setCurrentUser(user);
      localStorage.setItem('medstock_user', JSON.stringify(user));

      addToast({
        type: 'success',
        title: 'Authentication Successful',
        message: `Welcome back, ${user.name}.`,
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);

      // Distinguish "wrong password" from "the API server isn't reachable" —
      // reporting a network failure as bad credentials sends people hunting
      // for the wrong problem.
      const isRejected = err instanceof ApiError && (err.status === 401 || err.status === 422);

      if (isRejected) {
        setError(t('login.invalid'));
        addToast({
          type: 'error',
          title: 'Authentication Failed',
          message: 'Invalid credentials. Please check your email and password.',
        });
      } else {
        const detail =
          err instanceof ApiError ? `Server responded ${err.status}.` : 'No response from the server.';
        setError(`${t('login.unreachable')} (${getApiBaseUrl()})`);
        addToast({
          type: 'error',
          title: 'Cannot Reach API Server',
          message: `${detail} Start the backend and make sure it is listening on ${getApiBaseUrl()}.`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('medstock2026');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left Brand Showcase Panel */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-slate-900 via-sky-950 to-teal-950 text-white p-8 md:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        {/* Top Logo + language toggle */}
        <div className="relative z-10 flex items-start justify-between gap-4">
          <MedStockLogo size="lg" variant="with-tagline" theme="dark" />
          <button
            onClick={toggleLanguage}
            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
            title={t('header.toggleLang')}
          >
            <Globe className="w-4 h-4 text-teal-300" />
            <span>{language === 'en' ? 'اردو' : 'English'}</span>
          </button>
        </div>

        {/* Hero Mission Statement */}
        <div className="my-12 md:my-auto relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 text-xs font-semibold mb-6">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            {t('login.badge')}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {t('login.h1.l1')}
            <br />
            {t('login.h1.l2')}
            <br />
            <span className="text-teal-400">{t('login.h1.l3')}</span>
          </h1>

          <p className="mt-6 text-slate-300 text-sm sm:text-base leading-relaxed">{t('login.quote')}</p>

          <div className="mt-8 grid grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{t('login.feat.forecast')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{t('login.feat.transfer')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{t('login.feat.expiry')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{t('login.feat.ai')}</span>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="text-xs text-slate-400 relative z-10">{t('login.meta')}</div>
      </div>

      {/* Right Login Form Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {t('login.welcome')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('login.welcomeSub')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('login.email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm rounded-xl border border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('login.password')}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    addToast({
                      type: 'info',
                      message: 'Password reset link sent to registered hospital email.',
                    })
                  }
                  className="text-xs font-semibold text-teal-600 hover:text-teal-800"
                >
                  {t('login.forgot')}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 text-sm rounded-xl border border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition-all text-slate-900 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-px" />
                <span className="break-words">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 transition-all active:scale-[0.99] disabled:opacity-70 mt-6"
            >
              {loading ? (
                <span>{t('login.signingIn')}</span>
              ) : (
                <>
                  <span>{t('login.signIn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              {t('login.personas')}
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handlePresetSelect('manager@medstock.ai')}
                className={`text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                  email === 'manager@medstock.ai'
                    ? 'border-teal-500 bg-teal-50/60 font-semibold text-teal-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold">{t('login.persona.manager')}</div>
                  <div className="text-[11px] text-slate-500">manager@medstock.ai</div>
                </div>
                <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                  {t('login.select')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('admin@medstock.ai')}
                className={`text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                  email === 'admin@medstock.ai'
                    ? 'border-teal-500 bg-teal-50/60 font-semibold text-teal-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold">{t('login.persona.admin')}</div>
                  <div className="text-[11px] text-slate-500">admin@medstock.ai</div>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {t('login.select')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('procurement@medstock.ai')}
                className={`text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                  email === 'procurement@medstock.ai'
                    ? 'border-teal-500 bg-teal-50/60 font-semibold text-teal-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold">{t('login.persona.procurement')}</div>
                  <div className="text-[11px] text-slate-500">procurement@medstock.ai</div>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {t('login.select')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
