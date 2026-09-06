import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  Activity,
  Package,
  CheckCircle2,
  Filter,
  UserCheck,
  BellOff,
  ArrowRight,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { Alert, AlertType, AlertSeverity } from '../types';
import { Badge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';

export const AlertsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast, refreshCounts } = useApp();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [facilityFilter, setFacilityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Assign modal
  const [assignAlert, setAssignAlert] = useState<Alert | null>(null);
  const [assigneeName, setAssigneeName] = useState('Dr. Bilal (Pharmacy Head)');

  const fetchAlerts = async () => {
    const list = await apiService.getAlerts();
    setAlerts(list);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkReviewed = async (alertId: string) => {
    await apiService.resolveAlert(alertId);
    addToast({
      type: 'success',
      title: 'Alert Marked Reviewed',
      message: 'Status updated and incident logged.',
    });
    await fetchAlerts();
    await refreshCounts();
  };

  const handleSnooze = (alert: Alert) => {
    addToast({
      type: 'info',
      title: 'Alert Snoozed',
      message: `${alert.medicineName} notifications suppressed for 48 hours.`,
    });
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignAlert) return;
    addToast({
      type: 'success',
      title: 'Alert Assigned',
      message: `${assignAlert.medicineName} alert assigned to ${assigneeName}.`,
    });
    setAssignAlert(null);
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesTab =
      activeTab === 'ALL' ||
      (activeTab === 'stockout' && a.type === 'STOCKOUT') ||
      (activeTab === 'expiry' && a.type === 'EXPIRY') ||
      (activeTab === 'anomaly' && a.type === 'ANOMALY') ||
      (activeTab === 'low_stock' && a.type === 'LOW_STOCK');

    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesFacility = facilityFilter === 'ALL' || a.facilityName === facilityFilter;
    const matchesSearch =
      a.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSeverity && matchesFacility && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Alerts & Risk Monitor
            </h1>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
              {alerts.filter((a) => a.status === 'ACTIVE').length} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time notifications for imminent stockouts, expiring batches, and consumption anomalies.
          </p>
        </div>

        <button
          onClick={async () => {
            for (const a of alerts) {
              await apiService.resolveAlert(a.id);
            }
            addToast({
              type: 'info',
              message: 'All current alerts marked as reviewed.',
            });
            await fetchAlerts();
            await refreshCounts();
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs self-start sm:self-auto"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Mark All as Reviewed</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Alerts' },
          { id: 'stockout', label: 'Stockout Risks' },
          { id: 'expiry', label: 'Expiry Risks' },
          { id: 'anomaly', label: 'Surge Anomalies' },
          { id: 'low_stock', label: 'Low Stock' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts by medicine..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>

          <select
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700"
          >
            <option value="ALL">All Facilities</option>
            <option value="Main Hospital">Main Hospital</option>
            <option value="Facility A">Facility A</option>
            <option value="Facility B">Facility B</option>
          </select>
        </div>
      </div>

      {/* Alerts Cards List (Prompt Section 12) */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';
          const isWarning = alert.severity === 'WARNING';

          return (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border transition-all bg-white shadow-2xs ${
                isCritical
                  ? 'border-rose-200 hover:border-rose-400'
                  : isWarning
                  ? 'border-amber-200 hover:border-amber-400'
                  : 'border-slate-200 hover:border-teal-400'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      isCritical
                        ? 'bg-rose-100 text-rose-700'
                        : isWarning
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {alert.type}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {alert.facilityName}
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  Detected: <span className="font-semibold text-slate-600">{alert.detectedAt}</span>
                </div>
              </div>

              <div className="mt-3.5">
                <h3 className="text-base font-black text-slate-900">{alert.medicineName}</h3>
                <p className="text-xs text-slate-600 font-medium mt-1">{alert.title}</p>
              </div>

              {/* Impact & Recommended Action Cards */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                    Expected Clinical / Operational Impact
                  </div>
                  <div className="font-semibold text-slate-800">{alert.expectedImpact}</div>
                </div>

                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200/70">
                  <div className="text-[10px] uppercase font-bold text-teal-700 mb-0.5">
                    AI Recommended Countermeasure
                  </div>
                  <div className="font-semibold text-teal-950">{alert.recommendedAction}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleMarkReviewed(alert.id)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{alert.status === 'ACTIVE' ? 'Mark as Reviewed' : 'Reviewed'}</span>
                  </button>

                  <button
                    onClick={() => setAssignAlert(alert)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Assign Staff</span>
                  </button>

                  <button
                    onClick={() => handleSnooze(alert)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <BellOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Snooze</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (alert.type === 'EXPIRY') {
                      navigate('/batches');
                    } else if (alert.medicineId) {
                      navigate(`/inventory/${alert.medicineId}`);
                    } else {
                      navigate('/recommendations');
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5"
                >
                  <span>Resolve & View Recommendation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No active alerts in this category.
          </div>
        )}
      </div>

      {/* Assign Alert Modal */}
      <Modal
        isOpen={Boolean(assignAlert)}
        onClose={() => setAssignAlert(null)}
        title="Assign Alert Incident"
        subtitle="Route this inventory risk to a designated pharmacist or staff member."
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Select Pharmacy / Procurement Assignee
            </label>
            <select
              value={assigneeName}
              onChange={(e) => setAssigneeName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
            >
              <option value="Dr. Bilal (Pharmacy Head)">Dr. Bilal (Pharmacy Head)</option>
              <option value="Fatima Noor (Procurement Officer)">
                Fatima Noor (Procurement Officer)
              </option>
              <option value="Zubair Khan (Store Supervisor)">
                Zubair Khan (Store Supervisor)
              </option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAssignAlert(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-xs"
            >
              Assign & Notify
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
