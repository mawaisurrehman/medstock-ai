import type {
  Medicine,
  Batch,
  Alert,
  Recommendation,
  Facility,
  Supplier,
  DashboardStats,
  MedicineForecast,
  AIMessage,
  ReportTemplate,
  User,
  NotificationItem,
} from '../types';
import { apiClient, setAuthToken, getAuthToken, getApiBaseUrl, ApiError } from '../api/client';

// ── Shared service result types ────────────────────────────────────

export interface UploadResult {
  success: boolean;
  recordsCount: number;
  medicinesCount: number;
  facilitiesCount: number;
  warnings: string[];
  generatedAlerts: number;
  generatedRecommendations: number;
}

export interface AnalyticsSnapshot {
  overview: {
    totalMedicines: number;
    criticalAlerts: number;
    warnings: number;
    activeRecommendations: number;
  };
  stockouts: { total: number; critical: number; resolved: number };
  expiry: { total: number; critical: number };
  savings: {
    estimatedExpiryPrevention: number;
    estimatedEmergencyPurchaseReduction: number;
    totalEstimatedSavings: number;
  };
  forecastAccuracy: { mae: number; mape: number; confidence: number };
  emergencyPurchases: { total: number; prevented: number; estimatedCostAvoided: number };
}

// ── Response mappers (backend JSON → frontend TypeScript types) ────

function mapMedicine(raw: Record<string, unknown>): Medicine {
  const sm = raw.stockMovement as Record<string, unknown> | undefined;
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    genericName: String(raw.genericName ?? ''),
    category: (raw.category as Medicine['category']) ?? 'Antibiotics',
    facilityId: String(raw.facilityId ?? ''),
    facilityName: String(raw.facilityName ?? ''),
    currentStock: Number(raw.currentStock ?? 0),
    unit: String(raw.unit ?? 'units'),
    dailyConsumption: Number(raw.dailyConsumption ?? 0),
    daysRemaining: Number(raw.daysRemaining ?? 0),
    safetyStock: Number(raw.safetyStock ?? 0),
    reorderPoint: Number(raw.reorderPoint ?? 0),
    unitPricePkr: Number(raw.unitPricePkr ?? 0),
    stockoutRisk: (raw.stockoutRisk as Medicine['stockoutRisk']) ?? 'LOW',
    expiryRisk: (raw.expiryRisk as Medicine['expiryRisk']) ?? 'LOW',
    demandTrend: (raw.demandTrend as Medicine['demandTrend']) ?? 'STABLE',
    supplierLeadTimeDays: Number(raw.supplierLeadTimeDays ?? 7),
    status: (raw.status as Medicine['status']) ?? 'Healthy',
    description: String(raw.description ?? ''),
    stockMovement: {
      opening: Number(sm?.opening ?? 0),
      received: Number(sm?.received ?? 0),
      issued: Number(sm?.issued ?? 0),
      closing: Number(sm?.closing ?? 0),
      period: String(sm?.period ?? 'Last 7 days'),
    },
    aiRiskReasons: Array.isArray(raw.aiRiskReasons) ? (raw.aiRiskReasons as string[]) : [],
  };
}

function mapAlert(raw: Record<string, unknown>): Alert {
  const statusMap: Record<string, Alert['status']> = {
    OPEN: 'ACTIVE',
    ACTIVE: 'ACTIVE',
    REVIEWED: 'REVIEWED',
    SNOOZED: 'SNOOZED',
    RESOLVED: 'RESOLVED',
  };
  const severityMap: Record<string, Alert['severity']> = {
    CRITICAL: 'CRITICAL',
    HIGH: 'WARNING',
    WARNING: 'WARNING',
    MEDIUM: 'INFO',
    LOW: 'INFO',
    INFO: 'INFO',
    SAFE: 'SAFE',
  };
  return {
    id: String(raw.id ?? ''),
    type: (raw.type as Alert['type']) ?? 'STOCKOUT',
    severity: severityMap[String(raw.severity ?? '')] ?? 'INFO',
    medicineId: String(raw.medicineId ?? ''),
    medicineName: String(raw.medicineName ?? ''),
    facilityId: String(raw.facilityId ?? ''),
    facilityName: String(raw.facilityName ?? ''),
    detectedAt: String(raw.detectedAt ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    expectedImpact: String(raw.expectedImpact ?? ''),
    recommendedAction: String(raw.recommendedAction ?? ''),
    status: statusMap[String(raw.status ?? '')] ?? 'ACTIVE',
    daysRemaining: raw.daysRemaining != null ? Number(raw.daysRemaining) : undefined,
    assignedTo: raw.assignedTo ? String(raw.assignedTo) : undefined,
    recommendationId: raw.recommendationId ? String(raw.recommendationId) : undefined,
  };
}

function mapRecommendation(raw: Record<string, unknown>): Recommendation {
  const factors = Array.isArray(raw.factors)
    ? (raw.factors as Record<string, unknown>[]).map((f) => ({
        name: String(f.name ?? ''),
        percentage: Number(f.percentage ?? 0),
        description: String(f.description ?? ''),
      }))
    : [];
  return {
    id: String(raw.id ?? ''),
    code: String(raw.code ?? ''),
    type: (raw.type as Recommendation['type']) ?? 'ORDER',
    medicineId: String(raw.medicineId ?? ''),
    medicineName: String(raw.medicineName ?? ''),
    category: String(raw.category ?? ''),
    actionText: String(raw.actionText ?? ''),
    quantity: Number(raw.quantity ?? 0),
    unit: String(raw.unit ?? 'units'),
    fromFacility: raw.fromFacility ? String(raw.fromFacility) : undefined,
    toFacility: raw.toFacility ? String(raw.toFacility) : undefined,
    recommendedDate: String(raw.recommendedDate ?? ''),
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    expectedStockoutDays: Number(raw.expectedStockoutDays ?? 0),
    estimatedCostPkr: Number(raw.estimatedCostPkr ?? 0),
    reason: String(raw.reason ?? ''),
    aiConfidence: Number(raw.aiConfidence ?? 0),
    status: (raw.status as Recommendation['status']) ?? 'PENDING',
    factors,
    createdDate: String(raw.createdDate ?? ''),
    approvedBy: raw.approvedBy ? String(raw.approvedBy) : undefined,
    approvedAt: raw.approvedAt ? String(raw.approvedAt) : undefined,
  };
}

function mapFacility(raw: Record<string, unknown>): Facility {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    type: (raw.type as Facility['type']) ?? 'Main Hospital',
    location: String(raw.location ?? ''),
    totalMedicines: Number(raw.totalMedicines ?? 0),
    criticalStockouts: Number(raw.criticalStockouts ?? 0),
    expiryRisks: Number(raw.expiryRisks ?? 0),
    inventoryValuePkr: Number(raw.inventoryValuePkr ?? 0),
    contactPerson: String(raw.contactPerson ?? ''),
    phone: String(raw.phone ?? ''),
    bedCapacity: raw.bedCapacity ? Number(raw.bedCapacity) : undefined,
    capacityUtilization: Number(raw.capacityUtilization ?? 0),
    capacityUtilizationPercent: raw.capacityUtilizationPercent
      ? Number(raw.capacityUtilizationPercent)
      : undefined,
  };
}

function mapSupplier(raw: Record<string, unknown>): Supplier {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    contactEmail: String(raw.contactEmail ?? ''),
    phone: String(raw.phone ?? ''),
    city: String(raw.city ?? ''),
    medicinesSupplied: Number(raw.medicinesSupplied ?? 0),
    averageLeadTimeDays: Number(raw.averageLeadTimeDays ?? 7),
    reliabilityScore: Number(raw.reliabilityScore ?? 0),
    openOrders: Number(raw.openOrders ?? 0),
    lastDelivery: String(raw.lastDelivery ?? ''),
    qualityRating: Number(raw.qualityRating ?? 0),
    status: (raw.status as Supplier['status']) ?? 'Active',
  };
}

function mapBatch(raw: Record<string, unknown>): Batch {
  return {
    batchId: String(raw.batchId ?? ''),
    medicineId: String(raw.medicineId ?? ''),
    medicineName: String(raw.medicineName ?? ''),
    facilityId: String(raw.facilityId ?? ''),
    facilityName: String(raw.facilityName ?? ''),
    quantity: Number(raw.quantity ?? 0),
    unit: String(raw.unit ?? 'units'),
    mfgDate: String(raw.mfgDate ?? ''),
    manufactureDate: raw.manufactureDate ? String(raw.manufactureDate) : undefined,
    expiryDate: String(raw.expiryDate ?? ''),
    daysToExpiry: Number(raw.daysToExpiry ?? 0),
    consumptionRate: Number(raw.consumptionRate ?? 0),
    dailyConsumptionRate: raw.dailyConsumptionRate
      ? Number(raw.dailyConsumptionRate)
      : undefined,
    expiryRisk: (raw.expiryRisk as Batch['expiryRisk']) ?? 'LOW',
    status: (raw.status as Batch['status']) ?? '90+ days',
    recommendedAction: String(raw.recommendedAction ?? ''),
  };
}

function mapNotification(raw: Record<string, unknown>): NotificationItem {
  return {
    id: String(raw.id ?? ''),
    severity: (raw.severity as NotificationItem['severity']) ?? 'INFO',
    title: String(raw.title ?? ''),
    message: String(raw.message ?? ''),
    timeAgo: String(raw.timeAgo ?? ''),
    read: Boolean(raw.read ?? false),
    link: raw.link ? String(raw.link) : undefined,
  };
}

// ── Auth ───────────────────────────────────────────────────────────

export async function loginApi(
  email: string,
  password: string
): Promise<{ accessToken: string; user: User }> {
  const resp = await apiClient.post<{
    accessToken: string;
    tokenType: string;
    user: { id: string; name: string; email: string; role: string; facility: string };
  }>('/auth/login', { email, password });

  // Store JWT token
  setAuthToken(resp.accessToken);

  // Map backend role names to frontend role names
  const roleMap: Record<string, User['role']> = {
    ADMIN: 'Admin',
    STORE_MANAGER: 'Store Manager',
    PROCUREMENT_OFFICER: 'Procurement Specialist',
    HOSPITAL_ADMIN: 'Admin',
  };

  const user: User = {
    id: resp.user.id,
    name: resp.user.name,
    email: resp.user.email,
    role: roleMap[resp.user.role] ?? 'Store Manager',
    facility: resp.user.facility ?? '',
  };

  return { accessToken: resp.accessToken, user };
}

// ── Service (backend API only) ─────────────────────────────────────

export const apiService = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const raw = await apiClient.get<Record<string, unknown>>('/dashboard');
    return {
      totalMedicines: Number(raw.totalMedicines ?? 0),
      totalMedicinesTrend: Number(raw.totalMedicinesTrend ?? 0),
      criticalStockoutRisks: Number(raw.criticalStockoutRisks ?? 0),
      expiryRisks: Number(raw.expiryRisks ?? 0),
      lowStockItems: Number(raw.lowStockItems ?? 0),
      forecastAccuracy: Number(raw.forecastAccuracy ?? 0),
      mape: Number(raw.mape ?? 0),
      estimatedSavingsPkr: String(raw.estimatedSavingsPkr ?? 'Rs. 0'),
    };
  },

  // Medicines
  getMedicines: async (): Promise<Medicine[]> => {
    const raw = await apiClient.get<
      { items?: Record<string, unknown>[] } | Record<string, unknown>[]
    >('/medicines');
    const items = Array.isArray(raw) ? raw : (raw.items ?? []);
    return items.map(mapMedicine);
  },

  getMedicine: async (id: string): Promise<Medicine | null> => {
    try {
      const raw = await apiClient.get<Record<string, unknown>>(`/medicines/${id}`);
      return mapMedicine(raw);
    } catch (err) {
      if ((err as { status?: number }).status === 404) return null;
      throw err;
    }
  },

  // Forecasts
  getForecast: async (
    id: string,
    horizon: '7_DAYS' | '30_DAYS' | '90_DAYS' = '30_DAYS'
  ): Promise<MedicineForecast> => {
    const raw = await apiClient.get<Record<string, unknown>>(
      `/forecasts/${id}?horizon=${horizon}`
    );
    const points = Array.isArray(raw.points)
      ? (raw.points as Record<string, unknown>[]).map((p) => ({
          date: String(p.date ?? ''),
          historical: p.historical != null ? Number(p.historical) : null,
          forecast: p.forecast != null ? Number(p.forecast) : null,
          upperConfidence: p.upperConfidence != null ? Number(p.upperConfidence) : null,
          lowerConfidence: p.lowerConfidence != null ? Number(p.lowerConfidence) : null,
        }))
      : [];
    return {
      medicineId: String(raw.medicineId ?? id),
      medicineName: String(raw.medicineName ?? ''),
      facilityId: String(raw.facilityId ?? ''),
      horizon,
      forecast7Day: Number(raw.forecast7Day ?? 0),
      forecast30Day: Number(raw.forecast30Day ?? 0),
      forecast90Day: Number(raw.forecast90Day ?? 0),
      points,
      modelName: String(raw.modelName ?? 'moving_average'),
      accuracyRate: Number(raw.accuracyRate ?? 0),
      mae: Number(raw.mae ?? 0),
      mape: Number(raw.mape ?? 0),
      lastUpdated: String(raw.lastUpdated ?? ''),
    };
  },

  // Alerts
  getAlerts: async (): Promise<Alert[]> => {
    const raw = await apiClient.get<Record<string, unknown>[]>('/alerts');
    return raw.map(mapAlert);
  },

  updateAlertStatus: async (
    id: string,
    status: 'ACTIVE' | 'REVIEWED' | 'SNOOZED' | 'RESOLVED'
  ): Promise<Alert> => {
    const endpoint =
      status === 'RESOLVED'
        ? `/alerts/${id}/resolve`
        : status === 'SNOOZED'
          ? `/alerts/${id}/snooze`
          : `/alerts/${id}/review`;
    const raw = await apiClient.patch<Record<string, unknown>>(endpoint);
    return mapAlert(raw);
  },

  resolveAlert: async (id: string): Promise<Alert> => {
    return apiService.updateAlertStatus(id, 'RESOLVED');
  },

  // Recommendations
  getRecommendations: async (): Promise<Recommendation[]> => {
    const raw = await apiClient.get<Record<string, unknown>[]>('/recommendations');
    return raw.map(mapRecommendation);
  },

  approveRecommendation: async (
    id: string,
    _approvedBy = 'Store Manager'
  ): Promise<Recommendation> => {
    const raw = await apiClient.post<Record<string, unknown>>(`/recommendations/${id}/approve`);
    return mapRecommendation(raw);
  },

  rejectRecommendation: async (id: string, reason?: string): Promise<Recommendation> => {
    const raw = await apiClient.post<Record<string, unknown>>(`/recommendations/${id}/reject`, {
      reason: reason ?? 'Rejected by user',
    });
    return mapRecommendation(raw);
  },

  modifyRecommendation: async (id: string, newQuantity: number): Promise<Recommendation> => {
    const raw = await apiClient.post<Record<string, unknown>>(`/recommendations/${id}/modify`, {
      newQuantity,
    });
    return mapRecommendation(raw);
  },

  // Upload
  uploadInventory: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const raw = await apiClient.upload<Record<string, unknown>>('/uploads/inventory', formData);
    return {
      success: Boolean(raw.success ?? true),
      recordsCount: Number(raw.recordsCount ?? 0),
      medicinesCount: Number(raw.medicinesCount ?? 0),
      facilitiesCount: Number(raw.facilitiesCount ?? 0),
      warnings: Array.isArray(raw.warnings) ? (raw.warnings as string[]) : [],
      generatedAlerts: Number(raw.generatedAlerts ?? 0),
      generatedRecommendations: Number(raw.generatedRecommendations ?? 0),
    };
  },

  // Analytics (aggregated backend metrics)
  getAnalytics: async (): Promise<AnalyticsSnapshot> => {
    const [overview, stockouts, expiry, savings, forecastAccuracy, emergencyPurchases] =
      await Promise.all([
        apiClient.get<Record<string, unknown>>('/analytics/overview'),
        apiClient.get<Record<string, unknown>>('/analytics/stockouts'),
        apiClient.get<Record<string, unknown>>('/analytics/expiry'),
        apiClient.get<Record<string, unknown>>('/analytics/savings'),
        apiClient.get<Record<string, unknown>>('/analytics/forecast-accuracy'),
        apiClient.get<Record<string, unknown>>('/analytics/emergency-purchases'),
      ]);
    const num = (v: unknown): number => Number(v ?? 0);
    return {
      overview: {
        totalMedicines: num(overview.totalMedicines),
        criticalAlerts: num(overview.criticalAlerts),
        warnings: num(overview.warnings),
        activeRecommendations: num(overview.activeRecommendations),
      },
      stockouts: {
        total: num(stockouts.total),
        critical: num(stockouts.critical),
        resolved: num(stockouts.resolved),
      },
      expiry: { total: num(expiry.total), critical: num(expiry.critical) },
      savings: {
        estimatedExpiryPrevention: num(savings.estimatedExpiryPrevention),
        estimatedEmergencyPurchaseReduction: num(savings.estimatedEmergencyPurchaseReduction),
        totalEstimatedSavings: num(savings.totalEstimatedSavings),
      },
      forecastAccuracy: {
        mae: num(forecastAccuracy.mae),
        mape: num(forecastAccuracy.mape),
        confidence: num(forecastAccuracy.confidence),
      },
      emergencyPurchases: {
        total: num(emergencyPurchases.total),
        prevented: num(emergencyPurchases.prevented),
        estimatedCostAvoided: num(emergencyPurchases.estimatedCostAvoided),
      },
    };
  },

  // Batches
  getBatches: async (): Promise<Batch[]> => {
    const raw = await apiClient.get<Record<string, unknown>[]>('/batches');
    return raw.map(mapBatch);
  },

  // Facilities
  getFacilities: async (): Promise<Facility[]> => {
    const raw = await apiClient.get<Record<string, unknown>[]>('/facilities');
    return raw.map(mapFacility);
  },

  // Suppliers
  getSuppliers: async (): Promise<Supplier[]> => {
    const raw = await apiClient.get<Record<string, unknown>[]>('/suppliers');
    return raw.map(mapSupplier);
  },

  // Notifications
  getNotifications: async (): Promise<NotificationItem[]> => {
    const raw = await apiClient.get<Record<string, unknown>[]>('/notifications');
    return raw.map(mapNotification);
  },

  markAllNotificationsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },

  // Reports
  getReports: async (): Promise<ReportTemplate[]> => {
    const raw = await apiClient.get<Record<string, unknown>[]>('/reports');
    return raw.map((r) => ({
      id: String(r.id ?? ''),
      title: String(r.title ?? ''),
      description: String(r.description ?? ''),
      category: (r.category as ReportTemplate['category']) ?? 'Procurement',
      frequency: String(r.frequency ?? ''),
      lastGenerated: String(r.lastGenerated ?? ''),
      format: (r.format as ReportTemplate['format']) ?? 'PDF',
    }));
  },

  // AI Assistant
  sendAssistantMessage: async (query: string, isUrdu = false): Promise<AIMessage> => {
    const raw = await apiClient.post<Record<string, unknown>>('/assistant/chat', {
      message: query,
      language: isUrdu ? 'Urdu' : 'English',
    });
    return {
      id: String(raw.id ?? `msg-${Date.now()}`),
      sender: 'assistant',
      text: String(raw.text ?? ''),
      urduText: raw.urduText ? String(raw.urduText) : undefined,
      timestamp: String(raw.timestamp ?? 'Just now'),
      quickActions: Array.isArray(raw.quickActions)
        ? (raw.quickActions as { label: string; action: string }[])
        : undefined,
      confidence: raw.confidence != null ? Number(raw.confidence) : undefined,
      dataPoints: Array.isArray(raw.dataPoints)
        ? (raw.dataPoints as { label: string; value: string }[])
        : undefined,
    };
  },

  // Report generation (PDF download from backend, JWT-authenticated)
  generateReport: async (
    type: string
  ): Promise<{
    id: string;
    downloadUrl: string;
    fileName: string;
    generatedAt: string;
  }> => {
    const token = getAuthToken();
    const res = await fetch(`${getApiBaseUrl()}/reports/procurement`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new ApiError(res.status, `HTTP error ${res.status}`);
    }
    const blob = await res.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const fileName = `MedStock_AI_${type.replace(/\s+/g, '_')}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 10_000);
    return {
      id: `rep-${Date.now()}`,
      downloadUrl,
      fileName,
      generatedAt: new Date().toLocaleString(),
    };
  },

  // Clear local caches (no mock reset — data lives in the backend)
  resetDemoData: (): void => {
    localStorage.removeItem('medstock_recommendations_v1');
    localStorage.removeItem('medstock_alerts_v1');
    localStorage.removeItem('medstock_medicines_v1');
    localStorage.removeItem('medstock_stats_v1');
  },
};
