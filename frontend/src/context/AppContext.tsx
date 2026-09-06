import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, NotificationItem, ToastMessage } from '../types';
import { apiService, loginApi } from '../services/apiService';
import { setAuthToken } from '../api/client';
import { Lang, translate } from '../i18n/translations';

const LANG_STORAGE_KEY = 'medstock_lang';

function readStoredLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'en' || saved === 'ur') return saved;
  } catch (e) {
    console.warn(e);
  }
  return 'en';
}

// Default guest persona until a real backend login replaces it
const DEFAULT_USER: User = {
  id: 'guest',
  name: 'Guest User',
  email: '',
  role: 'Store Manager',
  facility: '',
};

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchDemoUser: (role: 'Admin' | 'Store Manager' | 'Procurement Specialist') => void;
  language: Lang;
  setLanguage: (lang: Lang) => void;
  toggleLanguage: () => void;
  /** Translate a key for the active language, interpolating `{var}` placeholders. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  isRtl: boolean;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  notifications: NotificationItem[];
  markAllNotificationsRead: () => void;
  unreadNotificationsCount: number;
  pendingRecommendationsCount: number;
  activeAlertsCount: number;
  refreshCounts: () => Promise<void>;
  resetToDefault: () => void;
  logout: () => void;
  demoStep: number;
  setDemoStep: (step: number) => void;
}
const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('medstock_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn(e);
      }
    }
    return DEFAULT_USER;
  });

  const [language, setLanguageState] = useState<Lang>(readStoredLang);

  // Persist the choice and reflect it on <html> (dir + lang + Urdu font) so the
  // whole app — every page, not just translated ones — switches direction.
  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch (e) {
      console.warn(e);
    }
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === 'ur' ? 'rtl' : 'ltr';
    document.body.classList.toggle('font-urdu', language === 'ur');
  }, [language]);

  const setLanguage = useCallback((lang: Lang) => setLanguageState(lang), []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language]
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pendingRecommendationsCount, setPendingRecommendationsCount] = useState<number>(0);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  const [demoStep, setDemoStep] = useState<number>(1);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    apiService
      .markAllNotificationsRead()
      .catch((e) => console.warn('Mark all read error', e));
    addToast({
      type: 'info',
      message: 'All notifications marked as read',
    });
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const refreshNotifications = async () => {
    try {
      const items = await apiService.getNotifications();
      setNotifications(items);
    } catch (e) {
      console.warn('Notification refresh error', e);
    }
  };

  const refreshCounts = async () => {
    try {
      const [recs, alerts] = await Promise.all([
        apiService.getRecommendations(),
        apiService.getAlerts(),
      ]);
      setPendingRecommendationsCount(recs.filter((r) => r.status === 'PENDING').length);
      setActiveAlertsCount(alerts.filter((a) => a.status === 'ACTIVE').length);
    } catch (e) {
      console.warn('Count refresh error', e);
    }
  };

  useEffect(() => {
    refreshCounts();
    refreshNotifications();
  }, []);

  const switchDemoUser = async (role: 'Admin' | 'Store Manager' | 'Procurement Specialist') => {
    const emailMap: Record<string, string> = {
      'Admin': 'admin@medstock.ai',
      'Store Manager': 'manager@medstock.ai',
      'Procurement Specialist': 'procurement@medstock.ai',
    };
    const email = emailMap[role] || 'manager@medstock.ai';
    try {
      const { user } = await loginApi(email, 'medstock2026');
      setCurrentUser(user);
      localStorage.setItem('medstock_user', JSON.stringify(user));
      addToast({
        type: 'info',
        title: 'Profile Switched',
        message: `Active session: ${user.name} (${user.role})`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Profile Switch Failed',
        message: 'Could not authenticate against the backend. Is the API server running?',
      });
    }
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('medstock_user');
    setCurrentUser(DEFAULT_USER);
    setNotifications([]);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => {
      const next: Lang = prev === 'en' ? 'ur' : 'en';
      addToast({
        type: 'info',
        message: next === 'ur' ? 'زبان اردو میں تبدیل ہو گئی' : 'Switched to English',
      });
      return next;
    });
  };

  const resetToDefault = () => {
    apiService.resetDemoData();
    refreshNotifications();
    refreshCounts();
    setDemoStep(1);
    addToast({
      type: 'success',
      title: 'Environment Reset',
      message: 'Live data reloaded from the backend database.',
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchDemoUser,
        language,
        setLanguage,
        toggleLanguage,
        t,
        isRtl: language === 'ur',
        toasts,
        addToast,
        removeToast,
        notifications,
        markAllNotificationsRead,
        unreadNotificationsCount,
        pendingRecommendationsCount,
        activeAlertsCount,
        refreshCounts,
        resetToDefault,
        logout,
        demoStep,
        setDemoStep,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
