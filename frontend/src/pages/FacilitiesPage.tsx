import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Package,
  AlertTriangle,
  Clock,
  Coins,
  ChevronRight,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { apiService } from '../services/apiService';
import { Facility } from '../types';
import { Modal } from '../components/common/Modal';

export const FacilitiesPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  useEffect(() => {
    apiService.getFacilities().then(setFacilities);
  }, []);

  const comparisonData = facilities.map((f) => ({
    name: f.name,
    medicines: f.totalMedicines,
    stockouts: f.criticalStockouts,
    expiryRisks: f.expiryRisks,
    capacity: f.capacityUtilizationPercent,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Healthcare Facilities
          </h1>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
            4 Connected Locations
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Multi-facility inventory distribution, bed capacities, and regional risk concentration.
        </p>
      </div>

      {/* Facility Cards (Prompt Section 14) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {facilities.map((fac) => (
          <div
            key={fac.id}
            onClick={() => setSelectedFacility(fac)}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{fac.name}</h3>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{fac.location}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {fac.type}
                </span>
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-slate-400" /> Total Medicines:
                  </span>
                  <span className="font-bold text-slate-900">{fac.totalMedicines}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Critical Stockouts:
                  </span>
                  <span
                    className={`font-bold ${
                      fac.criticalStockouts > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {fac.criticalStockouts}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> Expiry Risks:
                  </span>
                  <span
                    className={`font-bold ${
                      fac.expiryRisks > 0 ? 'text-amber-600' : 'text-emerald-700'
                    }`}
                  >
                    {fac.expiryRisks}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-teal-600" /> Inventory Value:
                  </span>
                  <span className="font-bold text-teal-900">
                    Rs. {(fac.inventoryValuePkr / 1000000).toFixed(1)}M
                  </span>
                </div>

                {/* Capacity Bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Capacity Utilization</span>
                    <span className="font-bold text-slate-800">
                      {fac.capacityUtilizationPercent}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${fac.capacityUtilizationPercent}%` }}
                      className={`h-full rounded-full ${
                        fac.capacityUtilizationPercent > 85 ? 'bg-amber-500' : 'bg-teal-600'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-teal-700 font-bold group-hover:text-teal-900">
              <span>Inspect Facility Roster</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Facility Comparison Chart (Prompt Section 14) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Cross-Facility Comparative Analysis
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison of catalog volume, stockout incidents, and near-expiry batches.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">Telemetry: Consolidated</span>
        </div>

        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  borderRadius: '10px',
                  fontSize: '11px',
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '11px' }}
              />
              <Bar dataKey="medicines" fill="#0284c7" name="Total Medicines" radius={[4, 4, 0, 0]} />
              <Bar dataKey="stockouts" fill="#f43f5e" name="Critical Stockouts" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expiryRisks" fill="#f59e0b" name="Expiry Risks" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Facility Detail Modal */}
      <Modal
        isOpen={Boolean(selectedFacility)}
        onClose={() => setSelectedFacility(null)}
        title={selectedFacility ? selectedFacility.name : ''}
        subtitle={selectedFacility ? `${selectedFacility.type} • ${selectedFacility.location}` : ''}
      >
        {selectedFacility && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400">Total Bed Capacity:</div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {selectedFacility.bedCapacity} Beds
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400">Contact Telephone:</div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {selectedFacility.contactPhone}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-teal-50 rounded-xl border border-teal-200 text-teal-900 space-y-1">
              <div className="font-bold">Inter-Facility Supply Protocol</div>
              <div>
                Facility can send stock transfers to nearby clinics within 2 hours of approval.
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedFacility(null)}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700"
              >
                Close View
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
