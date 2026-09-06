import React, { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Globe,
  Sliders,
  Cpu,
  Save,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SettingsPage: React.FC = () => {
  const { currentUser, language, setLanguage, addToast } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'thresholds' | 'model'>('profile');

  // Form states
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [facility, setFacility] = useState('Main Hospital');

  // Thresholds
  const [stockoutDays, setStockoutDays] = useState(14);
  const [expiryDays, setExpiryDays] = useState(60);
  const [safetyBufferPercent, setSafetyBufferPercent] = useState(20);

  // Notifications
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsUrgent, setSmsUrgent] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);

  // Model
  const [selectedModel, setSelectedModel] = useState('SARIMAX + LightGBM (Hybrid)');
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Hospital inventory operational parameters updated successfully.',
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Settings & Operational Controls
          </h1>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
            Hospital Admin
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure clinical safety thresholds, notification channels, AI model parameters, and local language.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'profile', label: 'User Profile', icon: User },
          { id: 'thresholds', label: 'Alert Thresholds', icon: Sliders },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'model', label: 'AI Model Configuration', icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Settings Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100">
                Hospital Staff Identity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Assigned Role
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.role}
                    className="w-full p-2.5 bg-slate-100 rounded-xl border border-slate-200 font-bold text-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Primary Facility
                  </label>
                  <select
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-900"
                  >
                    <option value="Main Hospital">Main Hospital</option>
                    <option value="Facility A">Facility A</option>
                    <option value="Facility B">Facility B</option>
                    <option value="Clinic C">Clinic C</option>
                  </select>
                </div>
              </div>

              {/* Language Preference */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block font-bold text-slate-700 uppercase mb-2">
                  System Language Preference
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      language === 'en'
                        ? 'bg-teal-50 border-teal-500 text-teal-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    English (US/UK)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('ur')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-urdu border transition-all ${
                      language === 'ur'
                        ? 'bg-teal-50 border-teal-500 text-teal-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    اردو (Urdu)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Thresholds Tab (Prompt Section 21) */}
          {activeTab === 'thresholds' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100">
                Clinical Safety & Risk Thresholds
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Critical Stockout Threshold
                  </label>
                  <div className="text-xs text-slate-500 mb-2">
                    Flag medicine if remaining runway is below:
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="3"
                      max="30"
                      value={stockoutDays}
                      onChange={(e) => setStockoutDays(Number(e.target.value))}
                      className="w-20 p-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900"
                    />
                    <span className="font-bold text-slate-700">Days</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Batch Expiry Notice Window
                  </label>
                  <div className="text-xs text-slate-500 mb-2">
                    Trigger FEFO transfer alerts when expiry is within:
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="15"
                      max="180"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(Number(e.target.value))}
                      className="w-20 p-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900"
                    />
                    <span className="font-bold text-slate-700">Days</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Safety Stock Buffer
                  </label>
                  <div className="text-xs text-slate-500 mb-2">
                    Recommended safety buffer over average lead-time burn:
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={safetyBufferPercent}
                      onChange={(e) => setSafetyBufferPercent(Number(e.target.value))}
                      className="w-20 p-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900"
                    />
                    <span className="font-bold text-slate-700">%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100">
                Alert Dispatch Channels
              </h3>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <div className="font-bold text-slate-900">Email Notifications</div>
                    <div className="text-slate-500 text-[11px]">
                      Send real-time alerts for critical stockout risks to registered hospital email
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <div className="font-bold text-slate-900">Urgent SMS Alerts</div>
                    <div className="text-slate-500 text-[11px]">
                      Instant SMS dispatch for medicines with less than 48 hours buffer remaining
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsUrgent}
                    onChange={(e) => setSmsUrgent(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <div>
                    <div className="font-bold text-slate-900">Daily Morning Digest</div>
                    <div className="text-slate-500 text-[11px]">
                      Summary email sent at 08:00 PKT with daily consumption forecasts and supplier deliveries
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={dailyDigest}
                    onChange={(e) => setDailyDigest(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Model Configuration Tab (Prompt Section 21) */}
          {activeTab === 'model' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100">
                Machine Learning Model Parameters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Active Forecasting Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-900"
                  >
                    <option value="SARIMAX + LightGBM (Hybrid)">
                      SARIMAX + LightGBM (Hybrid) — Default Recommended
                    </option>
                    <option value="Prophet Time-Series">Prophet Time-Series</option>
                    <option value="ARIMA Baseline">ARIMA Baseline</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    AI Recommendation Confidence Cutoff
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="75"
                      max="98"
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                      className="flex-1 accent-teal-600"
                    />
                    <span className="font-bold text-teal-800 text-sm">{confidenceThreshold}%</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Actions below this score will be flagged for secondary human verification.
                  </div>
                </div>
              </div>

              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-teal-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Model Safety Protocol Active</span>
                </div>
                <div className="text-slate-600">
                  Model retrains automatically on Sunday at 00:00 PKT incorporating the latest 7-day dispensing transactions.
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
