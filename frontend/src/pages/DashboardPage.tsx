import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  Clock,
  TrendingDown,
  Percent,
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  Truck,
  Building2,
  Wallet,
  Timer,
  ClipboardCheck,
} from 'lucide-react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { apiService, AnalyticsSnapshot } from '../services/apiService';
import {
  DashboardStats,
  MedicineForecast,
  Medicine,
  Facility,
  Supplier,
  Alert,
  Recommendation,
} from '../types';
import { Modal } from '../components/common/Modal';
import confetti from 'canvas-confetti';

type RoleKey = 'Admin' | 'Store Manager' | 'Procurement Specialist';

interface KpiCard {
  key: string;
  label: string;
  value: React.ReactNode;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'slate' | 'rose' | 'amber' | 'teal' | 'emerald' | 'indigo';
  onClick?: () => void;
}

const TONES: Record<KpiCard['tone'], { border: string; value: string; icon: string; sub: string }> = {
  slate: { border: 'border-slate-200', value: 'text-slate-900', icon: 'text-slate-400', sub: 'text-slate-500' },
  rose: { border: 'border-rose-200', value: 'text-rose-600', icon: 'text-rose-600', sub: 'text-rose-700/90' },
  amber: { border: 'border-amber-200', value: 'text-amber-700', icon: 'text-amber-600', sub: 'text-amber-700' },
  teal: { border: 'border-teal-200', value: 'text-teal-700', icon: 'text-teal-600', sub: 'text-teal-800' },
  emerald: { border: 'border-emerald-200', value: 'text-emerald-700', icon: 'text-emerald-600', sub: 'text-emerald-800' },
  indigo: { border: 'border-indigo-200', value: 'text-indigo-700', icon: 'text-indigo-600', sub: 'text-indigo-800' },
};

export const DashboardPage: React.FC = () => {
  const { currentUser, addToast, refreshCounts, t } = useApp();
  const navigate = useNavigate();

  // Role-based dashboard variants: Admin oversees the whole system, the Store
  // Manager runs daily inventory operations, Procurement owns purchasing.
  const roleKey: RoleKey = (['Admin', 'Store Manager', 'Procurement Specialist'] as RoleKey[]).includes(
    currentUser.role as RoleKey
  )
    ? (currentUser.role as RoleKey)
    : 'Store Manager';
  const isAdmin = roleKey === 'Admin';
  const isProcurement = roleKey === 'Procurement Specialist';
  const isManager = roleKey === 'Store Manager';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [forecastData, setForecastData] = useState<MedicineForecast | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);

  // Filters for Forecast Chart
  const [selectedMedicine, setSelectedMedicine] = useState<string>('');
  const [selectedHorizon, setSelectedHorizon] = useState<'7_DAYS' | '30_DAYS' | '90_DAYS'>('30_DAYS');
  const [selectedFacility, setSelectedFacility] = useState<string>('all');

  // Modals
  const [approveModalRec, setApproveModalRec] = useState<Recommendation | null>(null);
  const [modifyModalRec, setModifyModalRec] = useState<Recommendation | null>(null);
  const [modifyQty, setModifyQty] = useState<number>(300);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      const [s, a, r] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getAlerts(),
        apiService.getRecommendations(),
      ]);
      setStats(s);
      setAlerts(a);
      setRecommendations(r);
    } catch (e) {
      console.error('Error loading dashboard data', e);
      addToast({
        type: 'error',
        message: 'Failed to load dashboard data. Check that the API server is running.',
      });
    }
  };

  useEffect(() => {
    if (!selectedMedicine) return;
    apiService
      .getForecast(selectedMedicine, selectedHorizon)
      .then(setForecastData)
      .catch((e) => {
        console.error('Error loading forecast', e);
        setForecastData(null);
      });
  }, [selectedMedicine, selectedHorizon]);

  useEffect(() => {
    loadData();
    apiService
      .getMedicines()
      .then((meds) => {
        setMedicines(meds);
        setSelectedMedicine((prev) => {
          if (prev) return prev;
          const mostAtRisk = [...meds].sort((a, b) => a.daysRemaining - b.daysRemaining)[0];
          return mostAtRisk?.id ?? '';
        });
      })
      .catch((e) => console.error('Error loading medicines', e));
    apiService.getFacilities().then(setFacilities).catch((e) => console.error('Error loading facilities', e));
    // Suppliers + analytics power the Admin and Procurement dashboards.
    apiService.getSuppliers().then(setSuppliers).catch((e) => console.error('Error loading suppliers', e));
    apiService.getAnalytics().then(setAnalytics).catch((e) => console.error('Error loading analytics', e));
  }, []);

  const featuredAlert = useMemo(() => {
    const severityOrder: Record<string, number> = { CRITICAL: 0, WARNING: 1, INFO: 2, SAFE: 3 };
    return (
      [...alerts]
        .filter((a) => a.status === 'ACTIVE')
        .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])[0] ?? null
    );
  }, [alerts]);

  const criticalAlerts = useMemo(() => {
    const severityOrder: Record<string, number> = { CRITICAL: 0, WARNING: 1, INFO: 2, SAFE: 3 };
    return [...alerts]
      .filter((a) => a.status === 'ACTIVE')
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
      .slice(0, isManager ? 3 : 4);
  }, [alerts, isManager]);

  const activeAlertsCount = useMemo(
    () => alerts.filter((a) => a.status === 'ACTIVE').length,
    [alerts]
  );

  const selectableMedicines = useMemo(
    () =>
      selectedFacility === 'all'
        ? medicines
        : medicines.filter((m) => m.facilityId === selectedFacility),
    [medicines, selectedFacility]
  );

  const handleFacilityChange = (facilityId: string) => {
    setSelectedFacility(facilityId);
    if (facilityId !== 'all') {
      const inFacility = medicines.filter((m) => m.facilityId === facilityId);
      if (inFacility.length > 0 && !inFacility.some((m) => m.id === selectedMedicine)) {
        setSelectedMedicine(inFacility[0].id);
      }
    }
  };

  const modelLabel = forecastData
    ? forecastData.modelName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  const pendingRecs = useMemo(
    () => recommendations.filter((r) => r.status === 'PENDING'),
    [recommendations]
  );
  const pendingOrders = useMemo(() => pendingRecs.filter((r) => r.type === 'ORDER'), [pendingRecs]);
  const pendingOrderBudget = useMemo(
    () => pendingOrders.reduce((sum, r) => sum + r.estimatedCostPkr, 0),
    [pendingOrders]
  );
  const openSupplierOrders = useMemo(
    () => suppliers.reduce((sum, s) => sum + (s.openOrders ?? 0), 0),
    [suppliers]
  );
  const avgLeadTime = useMemo(() => {
    if (!suppliers.length) return 0;
    return Math.round(
      suppliers.reduce((sum, s) => sum + (s.averageLeadTimeDays ?? 0), 0) / suppliers.length
    );
  }, [suppliers]);

  const formatPkr = (value: number): string =>
    value >= 1_000_000
      ? `Rs. ${(value / 1_000_000).toFixed(1)}M`
      : `Rs. ${Math.round(value / 1000)}K`;

  // ── Role-specific KPI card sets ─────────────────────────────────
  const kpis: KpiCard[] = useMemo(() => {
    const forecastCard: KpiCard = {
      key: 'forecastAccuracy',
      label: t('dash.kpi.forecastAccuracy'),
      value: stats ? `${stats.forecastAccuracy}%` : '—',
      sub: t('dash.kpi.forecastAccuracy.sub', { mape: stats ? stats.mape : '—' }),
      icon: Percent,
      tone: 'teal',
      onClick: () => navigate('/forecasts'),
    };

    if (isAdmin) {
      return [
        {
          key: 'totalMedicines',
          label: t('dash.kpi.totalMedicines'),
          value: stats?.totalMedicines ?? '—',
          sub: t('dash.kpi.totalMedicines.sub', { trend: stats ? stats.totalMedicinesTrend : '—' }),
          icon: Package,
          tone: 'slate',
          onClick: () => navigate('/inventory'),
        },
        {
          key: 'activeAlerts',
          label: t('dash.kpi.activeAlerts'),
          value: activeAlertsCount,
          sub: t('dash.kpi.activeAlerts.sub'),
          icon: ShieldAlert,
          tone: 'rose',
          onClick: () => navigate('/alerts'),
        },
        {
          key: 'stockoutRisks',
          label: t('dash.kpi.stockoutRisks'),
          value: stats?.criticalStockoutRisks ?? '—',
          sub: t('dash.kpi.stockoutRisks.sub'),
          icon: AlertTriangle,
          tone: 'rose',
          onClick: () => navigate('/alerts?tab=stockout'),
        },
        {
          key: 'expiryRisks',
          label: t('dash.kpi.expiryRisks'),
          value: stats?.expiryRisks ?? '—',
          sub: t('dash.kpi.expiryRisks.sub'),
          icon: Clock,
          tone: 'amber',
          onClick: () => navigate('/batches'),
        },
        {
          key: 'facilities',
          label: t('dash.kpi.facilities'),
          value: facilities.length || '—',
          sub: t('dash.kpi.facilities.sub'),
          icon: Building2,
          tone: 'slate',
          onClick: () => navigate('/facilities'),
        },
        forecastCard,
      ];
    }

    if (isProcurement) {
      return [
        {
          key: 'pendingOrders',
          label: t('dash.kpi.pendingOrders'),
          value: pendingOrders.length,
          sub: t('dash.kpi.pendingOrders.sub'),
          icon: ClipboardCheck,
          tone: 'indigo',
          onClick: () => navigate('/recommendations'),
        },
        {
          key: 'orderBudget',
          label: t('dash.kpi.orderBudget'),
          value: formatPkr(pendingOrderBudget),
          sub: t('dash.kpi.orderBudget.sub'),
          icon: Wallet,
          tone: 'teal',
        },
        {
          key: 'openSupplierOrders',
          label: t('dash.kpi.openSupplierOrders'),
          value: openSupplierOrders || '—',
          sub: t('dash.kpi.openSupplierOrders.sub'),
          icon: Truck,
          tone: 'slate',
          onClick: () => navigate('/suppliers'),
        },
        {
          key: 'avgLeadTime',
          label: t('dash.kpi.avgLeadTime'),
          value: avgLeadTime ? `${avgLeadTime} ${t('common.days')}` : '—',
          sub: t('dash.kpi.avgLeadTime.sub'),
          icon: Timer,
          tone: 'slate',
          onClick: () => navigate('/suppliers'),
        },
        {
          key: 'emergencyAvoided',
          label: t('dash.kpi.emergencyAvoided'),
          value: analytics ? formatPkr(analytics.emergencyPurchases.estimatedCostAvoided) : '—',
          sub: t('dash.kpi.emergencyAvoided.sub'),
          icon: Sparkles,
          tone: 'emerald',
          onClick: () => navigate('/analytics'),
        },
        forecastCard,
      ];
    }

    // Store Manager — daily operations
    return [
      {
        key: 'totalMedicines',
        label: t('dash.kpi.totalMedicines'),
        value: stats?.totalMedicines ?? '—',
        sub: t('dash.kpi.totalMedicines.sub', { trend: stats ? stats.totalMedicinesTrend : '—' }),
        icon: Package,
        tone: 'slate',
      },
      {
        key: 'stockoutRisks',
        label: t('dash.kpi.stockoutRisks'),
        value: stats?.criticalStockoutRisks ?? '—',
        sub: t('dash.kpi.stockoutRisks.sub'),
        icon: AlertTriangle,
        tone: 'rose',
        onClick: () => navigate('/alerts?tab=stockout'),
      },
      {
        key: 'expiryRisks',
        label: t('dash.kpi.expiryRisks'),
        value: stats?.expiryRisks ?? '—',
        sub: t('dash.kpi.expiryRisks.sub'),
        icon: Clock,
        tone: 'amber',
        onClick: () => navigate('/batches'),
      },
      {
        key: 'lowStock',
        label: t('dash.kpi.lowStock'),
        value: stats?.lowStockItems ?? '—',
        sub: t('dash.kpi.lowStock.sub'),
        icon: TrendingDown,
        tone: 'slate',
        onClick: () => navigate('/inventory?risk=low'),
      },
      forecastCard,
      {
        key: 'estSavings',
        label: t('dash.kpi.estSavings'),
        value: stats?.estimatedSavingsPkr ?? '—',
        sub: t('dash.kpi.estSavings.sub'),
        icon: Sparkles,
        tone: 'emerald',
        onClick: () => navigate('/analytics'),
      },
    ];
  }, [
    isAdmin,
    isProcurement,
    stats,
    facilities.length,
    activeAlertsCount,
    pendingOrders.length,
    pendingOrderBudget,
    openSupplierOrders,
    avgLeadTime,
    analytics,
    t,
    navigate,
  ]);

  const forecastHeading = t(`dash.forecast.heading.${roleKey}`);
  const forecastSub = t(`dash.forecast.sub.${roleKey}`);

  const alertTypeLabel = (type: Alert['type']) =>
    t(`dash.alertType.${type}`) || t('dash.alertType.LOW_STOCK');

  // ── Recommendation actions ─────────────────────────────────────
  const handleApproveConfirm = async () => {
    if (!approveModalRec) return;
    setActionLoading(true);
    try {
      await apiService.approveRecommendation(approveModalRec.id, currentUser.name);
      confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
      addToast({
        type: 'success',
        title: 'Recommendation Approved & Logged',
        message: `${approveModalRec.code} for ${approveModalRec.medicineName} authorized. Inventory balances updated.`,
      });
      setApproveModalRec(null);
      await loadData();
      await refreshCounts();
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to approve recommendation.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyModalRec) return;
    setActionLoading(true);
    try {
      await apiService.modifyRecommendation(modifyModalRec.id, modifyQty);
      addToast({
        type: 'info',
        title: 'Recommendation Adjusted',
        message: `${modifyModalRec.code} quantity updated to ${modifyQty} units.`,
      });
      setModifyModalRec(null);
      await loadData();
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to update recommendation.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (rec: Recommendation) => {
    try {
      await apiService.rejectRecommendation(rec.id);
      addToast({
        type: 'warning',
        title: 'Recommendation Rejected',
        message: `${rec.code} has been marked as rejected with reason logged.`,
      });
      await loadData();
      await refreshCounts();
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to reject recommendation.' });
    }
  };

  const recTypeLabel = (type: Recommendation['type']) =>
    type === 'ORDER'
      ? t('dash.rec.type.ORDER')
      : type === 'TRANSFER'
        ? t('dash.rec.type.TRANSFER')
        : type === 'DISCOUNT'
          ? t('dash.rec.type.DISCOUNT')
          : t('dash.rec.type.EXPEDITE');

  // ── Shared building blocks ─────────────────────────────────────
  const renderRecommendationCard = (rec: Recommendation, actions: boolean) => (
    <div
      key={rec.id}
      className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 transition-all bg-slate-50/50 hover:bg-teal-50/20"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded ${
              rec.type === 'ORDER' ? 'bg-teal-700 text-white' : 'bg-indigo-700 text-white'
            }`}
          >
            {recTypeLabel(rec.type)}
          </span>
          <span className="text-xs font-mono font-bold text-slate-500">{rec.code}</span>
        </div>
        <span className="text-xs font-extrabold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full">
          {t('dash.rec.aiConfidence', { n: rec.aiConfidence })}
        </span>
      </div>

      <div className="text-base font-extrabold text-slate-900">{rec.medicineName}</div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-2.5 text-xs">
        <div className="p-2 rounded-lg bg-white border border-slate-200/80">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">
            {t('dash.rec.recommendedAction')}
          </div>
          <div className="font-bold text-slate-900">
            {rec.type === 'ORDER'
              ? `${rec.quantity} ${rec.unit}`
              : t('dash.rec.transferPrefix', { qty: rec.quantity, unit: rec.unit })}
          </div>
        </div>

        {rec.fromFacility && rec.toFacility ? (
          <div className="p-2 rounded-lg bg-white border border-slate-200/80">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              {t('dash.rec.route')}
            </div>
            <div className="font-bold text-slate-900 truncate">
              {rec.fromFacility} → {rec.toFacility}
            </div>
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-white border border-slate-200/80">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              {t('dash.rec.estBudget')}
            </div>
            <div className="font-bold text-slate-900">Rs. {rec.estimatedCostPkr.toLocaleString()}</div>
          </div>
        )}

        <div className="p-2 rounded-lg bg-white border border-slate-200/80">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">
            {t('dash.rec.bufferImpact')}
          </div>
          <div className="font-bold text-rose-600">
            {t('dash.rec.daysStockout', { n: rec.expectedStockoutDays })}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/70">
        <strong>{t('dash.rec.reason')}:</strong> {rec.reason}
      </p>

      {actions && (
        <div className="mt-3.5 flex items-center justify-between pt-2 border-t border-slate-200/60">
          <button
            onClick={() => navigate(`/recommendations`)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            {t('dash.rec.inspect')}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setModifyModalRec(rec);
                setModifyQty(rec.quantity);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
            >
              {t('dash.rec.modify')}
            </button>
            <button
              onClick={() => handleReject(rec)}
              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50"
            >
              {t('dash.rec.reject')}
            </button>
            <button
              onClick={() => setApproveModalRec(rec)}
              className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('dash.rec.approve')}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const criticalAlertsPanel = (interactive: boolean) => (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {t('dash.alerts.title')}
            </h3>
          </div>
          <NavLink to="/alerts" className="text-xs font-bold text-teal-600 hover:text-teal-800">
            {t('dash.alerts.viewAll', { count: activeAlertsCount })}
          </NavLink>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {criticalAlerts.map((alert) => {
            const isExpiry = alert.type === 'EXPIRY';
            const badgeClass =
              alert.severity === 'CRITICAL'
                ? 'bg-rose-100 text-rose-700'
                : alert.severity === 'WARNING'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-sky-100 text-sky-800';
            const metricClass =
              alert.severity === 'CRITICAL'
                ? 'text-rose-600'
                : alert.severity === 'WARNING'
                  ? 'text-amber-700'
                  : 'text-sky-700';
            const actionClass = isExpiry
              ? 'text-amber-800 hover:text-amber-900 bg-amber-50 border-amber-200/60'
              : 'text-teal-700 hover:text-teal-900 bg-teal-50 border-teal-200/60';
            return (
              <div key={alert.id} className="py-3.5 hover:bg-slate-50/70 p-2 rounded-xl transition-all">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded ${badgeClass}`}
                  >
                    {alertTypeLabel(alert.type)}
                  </span>
                  {alert.daysRemaining != null && (
                    <span className={`text-[11px] font-bold ${metricClass}`}>
                      {isExpiry
                        ? t('dash.alerts.daysToExpiry', { n: alert.daysRemaining })
                        : t('dash.alerts.daysLeft', { n: alert.daysRemaining })}
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1.5">{alert.medicineName}</div>
                <div className="text-xs text-slate-600 mt-1">{alert.description}</div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{alert.facilityName}</span>
                  <button
                    onClick={() =>
                      navigate(isExpiry ? '/batches' : `/inventory/${alert.medicineId}`)
                    }
                    className={`text-xs font-bold inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${actionClass}`}
                  >
                    <span>{isExpiry ? t('dash.alerts.reviewBatch') : t('dash.alerts.viewDetails')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {criticalAlerts.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-400">{t('dash.alerts.empty')}</div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" /> {t('dash.alerts.legend.critical')}
          <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" /> {t('dash.alerts.legend.warning')}
          <span className="w-2 h-2 rounded-full bg-sky-500 ml-1" /> {t('dash.alerts.legend.info')}
        </span>
        <span>{t('dash.alerts.liveFrom')}</span>
      </div>
    </div>
  );

  const recommendationsPanel = () => (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {isProcurement ? t('dash.rec.queueTitle') : t('dash.rec.title')}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isProcurement
                ? t('dash.rec.queueSubtitle', { count: pendingOrders.length })
                : t('dash.rec.subtitle', { count: pendingRecs.length })}
            </p>
          </div>
          <NavLink to="/recommendations" className="text-xs font-bold text-teal-600 hover:text-teal-800">
            {t('dash.rec.fullWorkspace')}
          </NavLink>
        </div>

        <div className="space-y-4 mt-4">
          {(isProcurement ? pendingOrders : pendingRecs).slice(0, isProcurement ? 3 : 2).map((rec) =>
            renderRecommendationCard(rec, true)
          )}
          {(isProcurement ? pendingOrders : pendingRecs).length === 0 && (
            <div className="py-10 text-center text-xs text-slate-400">{t('dash.rec.empty')}</div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
        {t('dash.rec.auditTrail')}
      </div>
    </div>
  );

  const facilityPanel = () => (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
        <Building2 className="w-5 h-5 text-teal-600" />
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">{t('dash.fac.title')}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('dash.fac.subtitle')}</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100 mt-2">
        {facilities.map((f) => (
          <div key={f.id} className="py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">{f.name}</div>
              <div className="text-[11px] text-slate-400">
                {f.totalMedicines} {t('dash.fac.medicines')}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200/60">
                {f.criticalStockouts} {t('dash.fac.stockouts')}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60">
                {f.expiryRisks} {t('dash.fac.expiry')}
              </span>
              <button
                onClick={() => navigate('/facilities')}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900"
              >
                {t('dash.fac.inspect')}
              </button>
            </div>
          </div>
        ))}
        {facilities.length === 0 && (
          <div className="py-10 text-center text-xs text-slate-400">{t('common.loading')}</div>
        )}
      </div>
    </div>
  );

  const supplierPanel = () => (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
        <Truck className="w-5 h-5 text-teal-600" />
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">{t('dash.sup.title')}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('dash.sup.subtitle')}</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100 mt-2">
        {suppliers.map((s) => (
          <div key={s.id} className="py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">{s.name}</div>
              <button
                onClick={() => navigate('/suppliers')}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900"
              >
                {t('dash.sup.createPO')}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/70">
                <div className="text-slate-400 uppercase font-semibold">{t('dash.sup.leadTime')}</div>
                <div className="font-bold text-slate-900">
                  {s.averageLeadTimeDays} {t('common.days')}
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/70">
                <div className="text-slate-400 uppercase font-semibold">{t('dash.sup.reliability')}</div>
                <div className="font-bold text-slate-900">{s.reliabilityScore}%</div>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/70">
                <div className="text-slate-400 uppercase font-semibold">{t('dash.sup.openOrders')}</div>
                <div className="font-bold text-slate-900">{s.openOrders ?? 0}</div>
              </div>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && (
          <div className="py-10 text-center text-xs text-slate-400">{t('common.loading')}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Demo flow banner */}
      {featuredAlert && (
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-teal-800/40">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded">
                  {t('dash.demo.tag')}
                </span>
                <span className="text-xs text-slate-300">{t('dash.demo.section')}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 mt-1">
                {t('dash.demo.body').split('{alert}')[0]}
                <span
                  className="font-bold text-white underline decoration-teal-400 cursor-pointer"
                  onClick={() => navigate(`/inventory/${featuredAlert.medicineId}`)}
                >
                  {featuredAlert.title}
                </span>
                {t('dash.demo.body').split('{alert}')[1]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => navigate(`/inventory/${featuredAlert.medicineId}`)}
              className="flex-1 md:flex-none px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>{t('dash.demo.start', { name: featuredAlert.medicineName.split(' ')[0] })}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('dash.greeting', { name: currentUser.name })}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t(`dash.subtitle.${roleKey}`)}</p>
        </div>

        <div className="flex items-center gap-3">
          <NavLink
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs hover:shadow-xs"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>{t('dash.uploadData')}</span>
          </NavLink>

          <button
            onClick={() => setReportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20 active:scale-[0.99]"
          >
            <FileText className="w-4 h-4 text-teal-100" />
            <span>{t('dash.generateReport')}</span>
          </button>
        </div>
      </div>

      {/* Role-based KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {kpis.map((kpi) => {
          const tone = TONES[kpi.tone];
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.key}
              onClick={kpi.onClick}
              className={`bg-white p-4 rounded-2xl border ${tone.border} shadow-2xs ${
                kpi.onClick ? 'cursor-pointer hover:shadow-xs transition-all' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <Icon className={`w-4 h-4 ${tone.icon}`} />
              </div>
              <div className={`text-2xl font-black tracking-tight ${tone.value}`}>{kpi.value}</div>
              <div className={`text-[11px] font-medium mt-1 ${tone.sub}`}>{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Demand forecast */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">{forecastHeading}</h2>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/70">
                {modelLabel
                  ? t('dash.forecast.modelBadge', { model: modelLabel })
                  : t('dash.forecast.modelBadgeFallback')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{forecastSub}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 font-medium">{t('dash.forecast.medicine')}:</span>
              <select
                value={selectedMedicine}
                onChange={(e) => setSelectedMedicine(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                {selectableMedicines.length === 0 && (
                  <option value="">
                    {medicines.length === 0 ? t('common.loading') : t('dash.forecast.noMeds')}
                  </option>
                )}
                {selectableMedicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 font-medium">{t('dash.forecast.horizon')}:</span>
              <select
                value={selectedHorizon}
                onChange={(e) => setSelectedHorizon(e.target.value as any)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="7_DAYS">{t('dash.forecast.h7')}</option>
                <option value="30_DAYS">{t('dash.forecast.h30')}</option>
                <option value="90_DAYS">{t('dash.forecast.h90')}</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 font-medium">{t('dash.forecast.facility')}:</span>
              <select
                value={selectedFacility}
                onChange={(e) => handleFacilityChange(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="all">{t('dash.forecast.allFacilities')}</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastData?.points || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit="u" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '11px', fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="upperConfidence"
                stroke="transparent"
                fill="url(#confidenceGrad)"
                name={t('dash.forecast.forecast')}
              />
              <Area type="monotone" dataKey="lowerConfidence" stroke="transparent" fill="#ffffff" name=" " />
              <Line
                type="monotone"
                dataKey="historical"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#0284c7' }}
                activeDot={{ r: 6 }}
                name={t('dash.forecast.historical')}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#0d9488"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#0d9488' }}
                activeDot={{ r: 6 }}
                name={t('dash.forecast.forecast')}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <span>
              <strong>{t('dash.forecast.model')}:</strong> {modelLabel ?? t('common.loading')}
            </span>
            <span>•</span>
            <span>
              <strong>{t('dash.forecast.accuracy')}:</strong>{' '}
              {forecastData ? `${forecastData.accuracyRate}%` : '—'}
            </span>
            <span>•</span>
            <span>
              <strong>{t('dash.forecast.mape')}:</strong> {forecastData ? `${forecastData.mape}%` : '—'}
            </span>
          </div>
          <NavLink
            to={`/forecasts?med=${selectedMedicine}`}
            className="text-teal-600 hover:text-teal-800 font-bold inline-flex items-center gap-1"
          >
            <span>{t('dash.forecast.explore')}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </div>

      {/* Role-based panels */}
      {isManager && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">{criticalAlertsPanel(true)}</div>
          <div className="lg:col-span-7">{recommendationsPanel()}</div>
        </div>
      )}

      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">{facilityPanel()}</div>
          <div className="lg:col-span-6">{criticalAlertsPanel(false)}</div>
        </div>
      )}

      {isProcurement && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">{recommendationsPanel()}</div>
          <div className="lg:col-span-5">{supplierPanel()}</div>
        </div>
      )}

      {/* Approve Modal */}
      <Modal
        isOpen={Boolean(approveModalRec)}
        onClose={() => setApproveModalRec(null)}
        title={t('dash.modal.approve.title')}
        subtitle={t('dash.modal.approve.subtitle')}
      >
        {approveModalRec && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('dash.modal.approve.id')}:</span>
                <span className="font-mono font-bold text-slate-900">{approveModalRec.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('dash.modal.approve.medicine')}:</span>
                <span className="font-bold text-slate-900">{approveModalRec.medicineName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('dash.modal.approve.action')}:</span>
                <span className="font-bold text-teal-700">
                  {approveModalRec.type === 'ORDER'
                    ? `${approveModalRec.quantity} ${approveModalRec.unit}`
                    : `${approveModalRec.quantity} ${approveModalRec.unit} → ${approveModalRec.toFacility}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('dash.modal.approve.value')}:</span>
                <span className="font-bold text-slate-900">
                  Rs. {approveModalRec.estimatedCostPkr.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('dash.modal.approve.user')}:</span>
                <span className="font-bold text-slate-900">
                  {currentUser.name} ({t(`role.${currentUser.role}`)})
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500">{t('dash.modal.approve.note')}</p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApproveModalRec(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApproveConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
              >
                {actionLoading ? t('dash.modal.approve.loading') : t('dash.modal.approve.cta')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modify Modal */}
      <Modal
        isOpen={Boolean(modifyModalRec)}
        onClose={() => setModifyModalRec(null)}
        title={t('dash.modal.modify.title')}
        subtitle={t('dash.modal.modify.subtitle')}
      >
        {modifyModalRec && (
          <form onSubmit={handleModifySubmit} className="space-y-4">
            <div className="text-xs text-slate-600">
              {t('dash.modal.approve.medicine')}:{' '}
              <strong className="text-slate-900">{modifyModalRec.medicineName}</strong>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {t('dash.modal.modify.qtyLabel', { unit: modifyModalRec.unit })}
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                value={modifyQty}
                onChange={(e) => setModifyQty(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
              />
            </div>

            <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 text-xs text-teal-900">
              {t('dash.modal.modify.estCost')}:{' '}
              <strong>
                Rs.{' '}
                {Math.round(
                  modifyQty * (modifyModalRec.estimatedCostPkr / modifyModalRec.quantity)
                ).toLocaleString()}
              </strong>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModifyModalRec(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Report Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title={t('dash.modal.report.title')}
        subtitle={t('dash.modal.report.subtitle')}
      >
        <div className="space-y-3 text-xs">
          <div className="space-y-2">
            <button
              onClick={() => {
                setReportModalOpen(false);
                navigate('/reports');
              }}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-slate-900">Procurement Requisition PDF</div>
                <div className="text-slate-500 text-[11px]">Includes supplier lead times &amp; unit prices</div>
              </div>
              <ArrowRight className="w-4 h-4 text-teal-600" />
            </button>
            <button
              onClick={() => {
                setReportModalOpen(false);
                navigate('/reports');
              }}
              className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-slate-900">Batch Expiry &amp; Waste Mitigation Register</div>
                <div className="text-slate-500 text-[11px]">Excel / CSV format with 90-day horizon</div>
              </div>
              <ArrowRight className="w-4 h-4 text-teal-600" />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
