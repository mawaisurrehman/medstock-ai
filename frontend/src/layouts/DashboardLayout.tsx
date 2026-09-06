import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Boxes,
  Building2,
  Truck,
  BarChart3,
  FileText,
  Bot,
  Settings,
  HelpCircle,
  Menu,
  X,
  Search,
  Bell,
  Globe,
  ChevronDown,
  LogOut,
  Upload,
  RotateCcw,
  Sparkles,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { MedStockLogo } from '../assets/logo';
import { useApp } from '../context/AppContext';
import { ToastContainer } from '../components/common/ToastContainer';
import { apiService } from '../services/apiService';
import type { Medicine, Batch, Facility, Recommendation } from '../types';

export const DashboardLayout: React.FC = () => {
  const {
    currentUser,
    switchDemoUser,
    language,
    toggleLanguage,
    t,
    notifications,
    unreadNotificationsCount,
    markAllNotificationsRead,
    pendingRecommendationsCount,
    activeAlertsCount,
    resetToDefault,
    logout,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchData, setSearchData] = useState<{
    medicines: Medicine[];
    batches: Batch[];
    facilities: Facility[];
    recommendations: Recommendation[];
  }>({ medicines: [], batches: [], facilities: [], recommendations: [] });
  const searchDataLoaded = useRef(false);

  // Load searchable records from the backend once, on first search interaction
  const loadSearchData = async () => {
    if (searchDataLoaded.current) return;
    searchDataLoaded.current = true;
    try {
      const [medicines, batches, facilities, recommendations] = await Promise.all([
        apiService.getMedicines(),
        apiService.getBatches(),
        apiService.getFacilities(),
        apiService.getRecommendations(),
      ]);
      setSearchData({ medicines, batches, facilities, recommendations });
    } catch (e) {
      searchDataLoaded.current = false; // allow retry on next interaction
      console.warn('Search data load error', e);
    }
  };

  const location = useLocation();
  const navigate = useNavigate();

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search results categorized (live backend records)
  const q = searchQuery.toLowerCase().trim();
  const searchResults = q
    ? {
        medicines: searchData.medicines.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.genericName.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q)
        ).slice(0, 3),
        batches: searchData.batches.filter(
          (b) =>
            b.batchId.toLowerCase().includes(q) || b.medicineName.toLowerCase().includes(q)
        ).slice(0, 3),
        facilities: searchData.facilities.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 2),
        recommendations: searchData.recommendations.filter(
          (r) =>
            r.code.toLowerCase().includes(q) || r.medicineName.toLowerCase().includes(q)
        ).slice(0, 2),
      }
    : null;

  const totalResultsCount = searchResults
    ? searchResults.medicines.length +
      searchResults.batches.length +
      searchResults.facilities.length +
      searchResults.recommendations.length
    : 0;

  const handleSearchResultClick = (path: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const navItems = [
    { label: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { label: t('nav.inventory'), path: '/inventory', icon: Package },
    { label: t('nav.forecasts'), path: '/forecasts', icon: TrendingUp },
    {
      label: t('nav.alerts'),
      path: '/alerts',
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? activeAlertsCount : null,
      badgeColor: 'bg-rose-500',
    },
    {
      label: t('nav.recommendations'),
      path: '/recommendations',
      icon: Lightbulb,
      badge: pendingRecommendationsCount > 0 ? pendingRecommendationsCount : null,
      badgeColor: 'bg-teal-600',
    },
    { label: t('nav.batches'), path: '/batches', icon: Boxes },
    { label: t('nav.facilities'), path: '/facilities', icon: Building2 },
    { label: t('nav.suppliers'), path: '/suppliers', icon: Truck },
    { label: t('nav.analytics'), path: '/analytics', icon: BarChart3 },
    { label: t('nav.reports'), path: '/reports', icon: FileText },
    {
      label: t('nav.assistant'),
      path: '/assistant',
      icon: Bot,
      highlight: true,
    },
  ];

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${language === 'ur' ? 'font-urdu' : ''}`}>
      {/* Toast notifications container */}
      <ToastContainer />

      {/* Top Mobile & Desktop Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          {/* Left: Mobile menu toggle & brand for mobile */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden">
              <MedStockLogo size="sm" variant="compact" />
            </div>

            {/* Desktop Quick Breadcrumb / Live Environment tag */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 pl-2">
              <span className="inline-flex items-center gap-1.5 font-medium text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                {t('header.liveTelemetry')}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-medium">{t('header.facility')}: Main Hospital</span>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="flex-1 max-w-lg mx-4 hidden sm:block relative" ref={searchRef}>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                  if (e.target.value.trim()) loadSearchData();
                }}
                onFocus={() => {
                  setSearchOpen(true);
                  loadSearchData();
                }}
                placeholder={t('header.search')}
                className="w-full pl-9 pr-8 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs rounded-xl border border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Categorized Search Results Dropdown */}
            {searchOpen && searchQuery && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                  <span>Results for "{searchQuery}"</span>
                  <span className="font-semibold text-slate-700">{totalResultsCount} found</span>
                </div>

                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                  {searchResults?.medicines.length ? (
                    <div className="p-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                        Medicines
                      </div>
                      {searchResults.medicines.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleSearchResultClick(`/inventory/${m.id}`)}
                          className="w-full text-left p-2 hover:bg-teal-50/60 rounded-xl flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{m.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {m.category} • {m.currentStock} {m.unit} in stock
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              m.stockoutRisk === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {m.daysRemaining} days left
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {searchResults?.batches.length ? (
                    <div className="p-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                        Batches & Expiry
                      </div>
                      {searchResults.batches.map((b) => (
                        <button
                          key={b.batchId}
                          onClick={() => handleSearchResultClick(`/batches`)}
                          className="w-full text-left p-2 hover:bg-teal-50/60 rounded-xl flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">
                              Batch {b.batchId} — {b.medicineName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Expiry: {b.expiryDate} ({b.daysToExpiry} days)
                            </div>
                          </div>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                            {b.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {searchResults?.recommendations.length ? (
                    <div className="p-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                        AI Recommendations
                      </div>
                      {searchResults.recommendations.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => handleSearchResultClick(`/recommendations`)}
                          className="w-full text-left p-2 hover:bg-teal-50/60 rounded-xl flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">
                              {r.code}: {r.actionText}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {r.medicineName} ({r.quantity} {r.unit})
                            </div>
                          </div>
                          <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded">
                            {r.aiConfidence}% match
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {totalResultsCount === 0 && (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No matching records found for "{searchQuery}".
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Controls: Notifications, Language, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Reset / Scenario Button */}
            <button
              onClick={resetToDefault}
              title="Reset Demo Dataset to initial state"
              className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              {t('header.resetDemo')}
            </button>

            {/* Quick Upload Button */}
            <NavLink
              to="/upload"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 text-teal-400" />
              {t('header.uploadData')}
            </NavLink>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
              title={t('header.toggleLang')}
            >
              <Globe className="w-4 h-4 text-teal-600" />
              <span>{language === 'en' ? 'اردو' : 'English'}</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{t('header.notifications')}</span>
                      {unreadNotificationsCount > 0 && (
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                          {unreadNotificationsCount} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-teal-600 hover:text-teal-800 font-semibold transition-colors"
                    >
                      {t('header.markAllRead')}
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setNotificationsOpen(false);
                          if (n.link) navigate(n.link);
                        }}
                        className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                          !n.read ? 'bg-teal-50/30' : ''
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            n.severity === 'CRITICAL'
                              ? 'bg-rose-500'
                              : n.severity === 'WARNING'
                              ? 'bg-amber-500'
                              : 'bg-teal-500'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-slate-900">{n.title}</div>
                          <div className="text-xs text-slate-600 mt-0.5">{n.message}</div>
                          <div className="text-[10px] text-slate-400 mt-1">{n.timeAgo}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                    <NavLink
                      to="/alerts"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                    >
                      View All Alerts & Warnings →
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">
                    {t(`role.${currentUser.role}`)}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 p-2 animate-in fade-in slide-in-from-top-2">
                  <div className="p-2.5 border-b border-slate-100 mb-1">
                    <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                    <div className="mt-1.5 text-[10px] uppercase font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded inline-block">
                      {t(`role.${currentUser.role}`)}
                    </div>
                  </div>

                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    {t('header.switchProfile')}
                  </div>
                  <button
                    onClick={() => {
                      switchDemoUser('Store Manager');
                      setUserMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      currentUser.role === 'Store Manager'
                        ? 'bg-teal-50 font-bold text-teal-800'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Store Manager (Zubair)</span>
                    {currentUser.role === 'Store Manager' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </button>
                  <button
                    onClick={() => {
                      switchDemoUser('Admin');
                      setUserMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      currentUser.role === 'Admin'
                        ? 'bg-teal-50 font-bold text-teal-800'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Admin (Dr. Tariq)</span>
                    {currentUser.role === 'Admin' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </button>
                  <button
                    onClick={() => {
                      switchDemoUser('Procurement Specialist');
                      setUserMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      currentUser.role === 'Procurement Specialist'
                        ? 'bg-teal-50 font-bold text-teal-800'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Procurement (Fatima)</span>
                    {currentUser.role === 'Procurement Specialist' && (
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                    )}
                  </button>

                  <div className="border-t border-slate-100 my-1 pt-1">
                    <NavLink
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      {t('header.settings')}
                    </NavLink>
                    <NavLink
                      to="/login"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      {t('header.signOut')}
                    </NavLink>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main App Body with Desktop Sidebar + Main Content */}
      <div className="flex-1 flex w-full">
        {/* Persistent Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-slate-200/90 shrink-0 select-none">
          {/* Brand header */}
          <div className="p-5 border-b border-slate-100">
            <NavLink to="/dashboard" className="block group">
              <MedStockLogo size="md" variant="full" />
            </NavLink>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-teal-50 text-teal-900 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-teal-600'
                          : item.highlight
                          ? 'text-teal-600'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span
                      className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  ) : null}

                  {item.highlight && !item.badge && (
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded">
                      AI
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* Divider */}
            <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
              <NavLink
                to="/settings"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  location.pathname === '/settings'
                    ? 'bg-teal-50 text-teal-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>{t('nav.settings')}</span>
              </NavLink>

              <button
                onClick={() => setHelpOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>{t('nav.help')}</span>
              </button>
            </div>
          </div>

          {/* User Profile Card in Sidebar Bottom */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-teal-700 font-semibold truncate">
                  {t(`role.${currentUser.role}`)}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <MedStockLogo size="sm" variant="compact" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold ${
                        isActive
                          ? 'bg-teal-50 text-teal-900'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-5 h-5 ${
                            isActive ? 'text-teal-600' : 'text-slate-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span
                          className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </NavLink>
                  );
                })}

                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <NavLink
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600"
                  >
                    <Settings className="w-5 h-5 text-slate-400" />
                    <span>{t('nav.settings')}</span>
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Outlet Area */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Help & Hackathon Demo Walkthrough Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  MedStock AI — Prototype Tour & Demo Script
                </h3>
              </div>
              <button
                onClick={() => setHelpOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-900">
                Official Live Hackathon Demo Walkthrough (Section 29):
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono text-[11px]">
                <div className="text-teal-700 font-bold">1. Dashboard → Click Insulin Alert</div>
                <div>2. Inspect Insulin detail, demand forecast chart, & AI explanation</div>
                <div className="text-teal-700 font-bold">
                  3. View Recommendation #REC-1024 → Click [Approve]
                </div>
                <div>4. Notice real-time inventory increment & risk clearance!</div>
                <div className="text-teal-700 font-bold">
                  5. Open Amoxicillin Expiry Alert → Approve Transfer to Facility B
                </div>
                <div>6. Navigate to Reports → Generate & Preview Procurement Report</div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-900">Language toggle:</span> Click{' '}
                <span className="font-bold text-teal-700">🌐 اردو</span> in top bar to experience
                bilingual healthcare summaries.
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setHelpOpen(false)}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700"
              >
                Got it, let's explore!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
