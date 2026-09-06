import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Package,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { Medicine, RiskLevel } from '../types';
import { RiskBadge, Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useApp } from '../context/AppContext';

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useApp();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [facilityFilter, setFacilityFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState(searchParams.get('risk') || 'ALL');

  // Sorting
  const [sortField, setSortField] = useState<keyof Medicine>('daysRemaining');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Add Medicine Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    genericName: '',
    category: 'Antibiotics',
    facilityName: 'Main Hospital',
    currentStock: 200,
    dailyConsumption: 12,
    safetyStock: 50,
    unitPricePkr: 350,
  });

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState({
    category: true,
    facility: true,
    dailyConsumption: true,
    safetyStock: true,
    stockoutRisk: true,
    expiryRisk: true,
  });
  const [colMenuOpen, setColMenuOpen] = useState(false);

  useEffect(() => {
    apiService.getMedicines().then(setMedicines);
  }, []);

  const handleSort = (field: keyof Medicine) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and Sort logic
  const filteredMedicines = useMemo(() => {
    return medicines
      .filter((m) => {
        const matchesSearch =
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.genericName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
        const matchesFacility = facilityFilter === 'ALL' || m.facilityName === facilityFilter;
        const matchesRisk =
          riskFilter === 'ALL' ||
          (riskFilter === 'critical' && (m.stockoutRisk === 'CRITICAL' || m.status === 'Critical')) ||
          (riskFilter === 'low' && m.currentStock <= m.safetyStock) ||
          m.stockoutRisk === riskFilter;

        return matchesSearch && matchesCategory && matchesFacility && matchesRisk;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return 0;
      });
  }, [medicines, searchQuery, categoryFilter, facilityFilter, riskFilter, sortField, sortDirection]);

  // Paginated records
  const totalPages = Math.ceil(filteredMedicines.length / pageSize) || 1;
  const paginatedMedicines = filteredMedicines.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      'Medicine',
      'Generic Name',
      'Category',
      'Facility',
      'Current Stock',
      'Daily Consumption',
      'Days Remaining',
      'Safety Stock',
      'Stockout Risk',
      'Expiry Risk',
      'Status',
    ];
    const rows = filteredMedicines.map((m) => [
      `"${m.name}"`,
      `"${m.genericName}"`,
      m.category,
      m.facilityName,
      m.currentStock,
      m.dailyConsumption,
      m.daysRemaining,
      m.safetyStock,
      m.stockoutRisk,
      m.expiryRisk,
      m.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MedStock_AI_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Export Generated',
      message: `${filteredMedicines.length} inventory records exported to CSV.`,
    });
  };

  // Add Medicine submit
  const handleAddMedicineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const days = Math.round(newMed.currentStock / (newMed.dailyConsumption || 1));
    const created: Medicine = {
      id: `med-${Date.now()}`,
      name: newMed.name,
      genericName: newMed.genericName || newMed.name,
      category: newMed.category as any,
      facilityId: 'fac-main',
      facilityName: newMed.facilityName,
      currentStock: Number(newMed.currentStock),
      unit: 'packs',
      dailyConsumption: Number(newMed.dailyConsumption),
      daysRemaining: days,
      safetyStock: Number(newMed.safetyStock),
      reorderPoint: Number(newMed.safetyStock) * 1.5,
      unitPricePkr: Number(newMed.unitPricePkr),
      stockoutRisk: days < 14 ? 'HIGH' : 'LOW',
      expiryRisk: 'LOW',
      demandTrend: 'STABLE',
      supplierLeadTimeDays: 7,
      status: days < 14 ? 'Warning' : 'Healthy',
      description: 'Newly registered inventory catalog item.',
      stockMovement: {
        opening: newMed.currentStock,
        received: newMed.currentStock,
        issued: 0,
        closing: newMed.currentStock,
        period: 'September 2026',
      },
      aiRiskReasons: ['Newly introduced stock buffer under baseline telemetry.'],
    };

    setMedicines((prev) => [created, ...prev]);
    setAddModalOpen(false);
    addToast({
      type: 'success',
      title: 'Medicine Added',
      message: `${created.name} registered into ${created.facilityName}.`,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Medicine Inventory
            </h1>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {filteredMedicines.length} total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage current stock, consumption telemetry and real-time availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Upload CSV/Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by brand name or active molecule..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all text-slate-900"
            />
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Diabetes">Diabetes</option>
              <option value="Antibiotics">Antibiotics</option>
              <option value="Analgesics">Analgesics</option>
              <option value="Respiratory">Respiratory</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Gastrointestinal">Gastrointestinal</option>
            </select>

            {/* Facility Filter */}
            <select
              value={facilityFilter}
              onChange={(e) => {
                setFacilityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">All Facilities</option>
              <option value="Main Hospital">Main Hospital</option>
              <option value="Facility A">Facility A</option>
              <option value="Facility B">Facility B</option>
              <option value="Clinic C">Clinic C</option>
            </select>

            {/* Risk Status Filter */}
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="critical">Critical Stockout</option>
              <option value="CRITICAL">Risk: Critical</option>
              <option value="HIGH">Risk: High</option>
              <option value="LOW">Risk: Low/Safe</option>
            </select>

            {/* Column Visibility Selector */}
            <div className="relative">
              <button
                onClick={() => setColMenuOpen(!colMenuOpen)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Columns</span>
              </button>

              {colMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-20 text-xs space-y-1">
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.category}
                      onChange={(e) =>
                        setVisibleColumns({ ...visibleColumns, category: e.target.checked })
                      }
                      className="rounded text-teal-600 focus:ring-0"
                    />
                    <span>Category</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.facility}
                      onChange={(e) =>
                        setVisibleColumns({ ...visibleColumns, facility: e.target.checked })
                      }
                      className="rounded text-teal-600 focus:ring-0"
                    />
                    <span>Facility</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.dailyConsumption}
                      onChange={(e) =>
                        setVisibleColumns({
                          ...visibleColumns,
                          dailyConsumption: e.target.checked,
                        })
                      }
                      className="rounded text-teal-600 focus:ring-0"
                    />
                    <span>Daily Consumption</span>
                  </label>
                  <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.safetyStock}
                      onChange={(e) =>
                        setVisibleColumns({ ...visibleColumns, safetyStock: e.target.checked })
                      }
                      className="rounded text-teal-600 focus:ring-0"
                    />
                    <span>Safety Stock</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Professional Data Table (Prompt Section 9) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Medicine</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                {visibleColumns.category && (
                  <th className="py-3.5 px-3">Category</th>
                )}
                {visibleColumns.facility && (
                  <th className="py-3.5 px-3">Facility</th>
                )}
                <th
                  onClick={() => handleSort('currentStock')}
                  className="py-3.5 px-3 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Current Stock</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                {visibleColumns.dailyConsumption && (
                  <th className="py-3.5 px-3">Daily Consumption</th>
                )}
                <th
                  onClick={() => handleSort('daysRemaining')}
                  className="py-3.5 px-3 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Days Remaining</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                {visibleColumns.safetyStock && (
                  <th className="py-3.5 px-3">Safety Stock</th>
                )}
                <th className="py-3.5 px-3">Stockout Risk</th>
                <th className="py-3.5 px-3">Expiry Risk</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedMedicines.map((m) => {
                const isCritical = m.stockoutRisk === 'CRITICAL' || m.status === 'Critical';

                return (
                  <tr
                    key={m.id}
                    onClick={() => navigate(`/inventory/${m.id}`)}
                    className={`hover:bg-teal-50/40 transition-colors cursor-pointer ${
                      isCritical ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {m.genericName}
                      </div>
                    </td>

                    {visibleColumns.category && (
                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {m.category}
                        </span>
                      </td>
                    )}

                    {visibleColumns.facility && (
                      <td className="py-3.5 px-3 text-slate-600 font-normal">
                        {m.facilityName}
                      </td>
                    )}

                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-900">{m.currentStock}</span>{' '}
                      <span className="text-[11px] text-slate-400">{m.unit}</span>
                    </td>

                    {visibleColumns.dailyConsumption && (
                      <td className="py-3.5 px-3 text-slate-600 font-mono">
                        {m.dailyConsumption}/day
                      </td>
                    )}

                    <td className="py-3.5 px-3">
                      <span
                        className={`font-bold ${
                          m.daysRemaining <= 11
                            ? 'text-rose-600'
                            : m.daysRemaining <= 20
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {m.daysRemaining} days
                      </span>
                    </td>

                    {visibleColumns.safetyStock && (
                      <td className="py-3.5 px-3 text-slate-500 font-mono">
                        {m.safetyStock}
                      </td>
                    )}

                    <td className="py-3.5 px-3">
                      <RiskBadge level={m.stockoutRisk} size="sm" />
                    </td>

                    <td className="py-3.5 px-3">
                      <RiskBadge level={m.expiryRisk} size="sm" />
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          m.status === 'Critical'
                            ? 'bg-rose-100 text-rose-700'
                            : m.status === 'Warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/inventory/${m.id}`);
                        }}
                        className="p-1.5 rounded-lg text-teal-700 hover:bg-teal-50 transition-colors inline-flex items-center gap-1 font-bold text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {paginatedMedicines.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No medicines match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing{' '}
            <span className="font-bold text-slate-900">
              {filteredMedicines.length ? (currentPage - 1) * pageSize + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-900">
              {Math.min(currentPage * pageSize, filteredMedicines.length)}
            </span>{' '}
            of <span className="font-bold text-slate-900">{filteredMedicines.length}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Medicine Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Medicine Record"
        subtitle="Introduce a new medicine item into the facility catalog."
      >
        <form onSubmit={handleAddMedicineSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Medicine Brand Name
            </label>
            <input
              type="text"
              required
              value={newMed.name}
              onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
              placeholder="e.g. Ciprofloxacin 500mg"
              className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Generic Molecule Name
            </label>
            <input
              type="text"
              value={newMed.genericName}
              onChange={(e) => setNewMed({ ...newMed, genericName: e.target.value })}
              placeholder="e.g. Ciprofloxacin Hydrochloride"
              className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Category
              </label>
              <select
                value={newMed.category}
                onChange={(e) => setNewMed({ ...newMed, category: e.target.value })}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
              >
                <option value="Antibiotics">Antibiotics</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Analgesics">Analgesics</option>
                <option value="Respiratory">Respiratory</option>
                <option value="Cardiovascular">Cardiovascular</option>
                <option value="Gastrointestinal">Gastrointestinal</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Facility
              </label>
              <select
                value={newMed.facilityName}
                onChange={(e) => setNewMed({ ...newMed, facilityName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
              >
                <option value="Main Hospital">Main Hospital</option>
                <option value="Facility A">Facility A</option>
                <option value="Facility B">Facility B</option>
                <option value="Clinic C">Clinic C</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Initial Stock
              </label>
              <input
                type="number"
                required
                min="0"
                value={newMed.currentStock}
                onChange={(e) => setNewMed({ ...newMed, currentStock: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Daily Burn Rate
              </label>
              <input
                type="number"
                required
                min="1"
                value={newMed.dailyConsumption}
                onChange={(e) =>
                  setNewMed({ ...newMed, dailyConsumption: Number(e.target.value) })
                }
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Safety Stock
              </label>
              <input
                type="number"
                required
                min="0"
                value={newMed.safetyStock}
                onChange={(e) => setNewMed({ ...newMed, safetyStock: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-xs"
            >
              Save Medicine
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
