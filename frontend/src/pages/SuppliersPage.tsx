import React, { useState, useEffect } from 'react';
import {
  Truck,
  Clock,
  ShieldCheck,
  Star,
  ShoppingBag,
  Phone,
  Mail,
  ArrowRight,
  ExternalLink,
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
import { Supplier } from '../types';
import { Modal } from '../components/common/Modal';
import { useApp } from '../context/AppContext';

export const SuppliersPage: React.FC = () => {
  const { addToast } = useApp();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orderModalSupplier, setOrderModalSupplier] = useState<Supplier | null>(null);
  const [poMedicine, setPoMedicine] = useState('Insulin (Regular Human)');
  const [poQty, setPoQty] = useState(300);

  useEffect(() => {
    apiService.getSuppliers().then(setSuppliers);
  }, []);

  const performanceData = suppliers.map((s) => ({
    name: s.name.split(' ')[0],
    leadTime: s.averageLeadTimeDays,
    reliability: s.reliabilityScore,
  }));

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderModalSupplier) return;
    addToast({
      type: 'success',
      title: 'Purchase Order Dispatched',
      message: `PO for ${poQty} units sent to ${orderModalSupplier.name} via electronic EDI.`,
    });
    setOrderModalSupplier(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Suppliers & Procurement Lead Times
          </h1>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
            Verified Vendors
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Vendor delivery reliability, historical lead times, and active purchase orders.
        </p>
      </div>

      {/* Supplier Cards (Prompt Section 15) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-400 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{s.name}</h3>
                    <div className="text-[11px] text-slate-400">{s.contactPerson}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{s.rating}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Avg Lead Time:
                  </span>
                  <span className="font-bold text-slate-900">{s.averageLeadTimeDays} days</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Reliability Score:
                  </span>
                  <span className="font-bold text-emerald-700">{s.reliabilityScore}%</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-slate-400" /> Open Orders:
                  </span>
                  <span className="font-bold text-slate-900">{s.openOrdersCount} active</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Last Delivery:</span>
                  <span className="font-mono text-slate-700">{s.lastDeliveryDate}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{s.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{s.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => setOrderModalSupplier(s)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Create Purchase Order</span>
                <ArrowRight className="w-3 h-3 text-teal-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Supplier Performance Comparison Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Vendor Lead Time vs. Delivery Reliability
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lower lead times paired with 90%+ reliability deliver the highest inventory safety buffer.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">Quarterly Assessment</span>
        </div>

        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
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
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '16px', fontSize: '11px' }} />
              <Bar dataKey="leadTime" fill="#f59e0b" name="Avg Lead Time (Days)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="reliability" fill="#0d9488" name="Reliability Score (%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Purchase Order Modal */}
      <Modal
        isOpen={Boolean(orderModalSupplier)}
        onClose={() => setOrderModalSupplier(null)}
        title="Create Purchase Order"
        subtitle={orderModalSupplier ? `Supplier: ${orderModalSupplier.name}` : ''}
      >
        <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Select Medicine Catalog Item
            </label>
            <select
              value={poMedicine}
              onChange={(e) => setPoMedicine(e.target.value)}
              className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-900"
            >
              <option value="Insulin (Regular Human)">Insulin (Regular Human 100IU/ml)</option>
              <option value="Amoxicillin 500mg">Amoxicillin 500mg Capsules</option>
              <option value="Ceftriaxone 1g">Ceftriaxone 1g Injection</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Order Quantity
            </label>
            <input
              type="number"
              min="10"
              value={poQty}
              onChange={(e) => setPoQty(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-900"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
            Expected Delivery: Within <strong>{orderModalSupplier?.averageLeadTimeDays} business days</strong>.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setOrderModalSupplier(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-xs"
            >
              Dispatch PO
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
