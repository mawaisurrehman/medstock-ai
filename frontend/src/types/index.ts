export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'SAFE';

export type AlertType = 'STOCKOUT' | 'EXPIRY' | 'ANOMALY' | 'LOW_STOCK';

export type RecommendationAction = 'ORDER' | 'TRANSFER' | 'DISCOUNT' | 'EXPEDITE';

export type RecommendationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export type HorizonType = '7_DAYS' | '30_DAYS' | '90_DAYS';

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: 'Diabetes' | 'Antibiotics' | 'Analgesics' | 'Cardiovascular' | 'Respiratory' | 'Gastrointestinal';
  facilityId: string;
  facilityName: string;
  currentStock: number;
  unit: string;
  dailyConsumption: number;
  daysRemaining: number;
  safetyStock: number;
  reorderPoint: number;
  unitPricePkr: number;
  stockoutRisk: RiskLevel;
  expiryRisk: RiskLevel;
  demandTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  supplierLeadTimeDays: number;
  status: 'Critical' | 'Warning' | 'Healthy' | 'Overstocked';
  description: string;
  stockMovement: {
    opening: number;
    received: number;
    issued: number;
    closing: number;
    period: string;
  };
  aiRiskReasons: string[];
}

export interface Batch {
  batchId: string;
  medicineId: string;
  medicineName: string;
  facilityId: string;
  facilityName: string;
  quantity: number;
  unit: string;
  mfgDate: string;
  manufactureDate?: string;
  expiryDate: string;
  daysToExpiry: number;
  consumptionRate: number; // units/day
  dailyConsumptionRate?: number;
  expiryRisk: RiskLevel;
  status: 'Expired' | '0-30 days' | '31-60 days' | '61-90 days' | '90+ days';
  recommendedAction: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SAFE';
  medicineId: string;
  medicineName: string;
  facilityId: string;
  facilityName: string;
  detectedAt: string;
  title: string;
  description: string;
  expectedImpact: string;
  recommendedAction: string;
  status: 'ACTIVE' | 'REVIEWED' | 'SNOOZED' | 'RESOLVED';
  daysRemaining?: number;
  assignedTo?: string;
  recommendationId?: string;
}

export interface RecommendationFactor {
  name: string;
  percentage: number; // 0 - 100 weight
  description: string;
}

export interface Recommendation {
  id: string;
  code: string; // e.g. #REC-1024
  type: RecommendationAction;
  medicineId: string;
  medicineName: string;
  category: string;
  actionText: string;
  quantity: number;
  unit: string;
  fromFacility?: string;
  toFacility?: string;
  recommendedDate: string;
  createdAt?: string;
  expectedStockoutDays: number;
  estimatedCostPkr: number;
  reason: string;
  aiConfidence: number; // e.g. 91%
  status: RecommendationStatus;
  factors: RecommendationFactor[];
  createdDate: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ForecastPoint {
  date: string;
  historical?: number | null;
  forecast?: number | null;
  upperConfidence?: number | null;
  lowerConfidence?: number | null;
}

export interface MedicineForecast {
  medicineId: string;
  medicineName: string;
  facilityId: string;
  horizon: HorizonType;
  forecast7Day: number;
  forecast30Day: number;
  forecast90Day: number;
  points: ForecastPoint[];
  modelName: string;
  accuracyRate: number;
  mae: number;
  mape: number;
  lastUpdated: string;
}

export interface Facility {
  id: string;
  name: string;
  type: 'Main Hospital' | 'Secondary Facility' | 'Specialized Center' | 'Community Clinic';
  location: string;
  totalMedicines: number;
  criticalStockouts: number;
  expiryRisks: number;
  inventoryValuePkr: number;
  contactPerson: string;
  phone: string;
  contactPhone?: string;
  bedCapacity?: number;
  capacityUtilization: number;
  capacityUtilizationPercent?: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  email?: string;
  phone: string;
  city: string;
  medicinesSupplied: number;
  averageLeadTimeDays: number;
  reliabilityScore: number; // 0 - 100%
  openOrders: number;
  openOrdersCount?: number;
  lastDelivery: string;
  lastDeliveryDate?: string;
  qualityRating: number; // out of 5
  rating?: number;
  contactPerson?: string;
  status: 'Active' | 'Under Review' | 'Preferred';
}

export interface AssistantMessage {
  id: string;
  sender: 'USER' | 'BOT';
  text: string;
  urduText?: string;
  timestamp: string;
  actions?: {
    label: string;
    actionType: 'NAVIGATE' | 'MODAL';
    payload: string;
  }[];
}

export interface DashboardStats {
  totalMedicines: number;
  totalMedicinesTrend: number; // +8%
  criticalStockoutRisks: number;
  expiryRisks: number;
  lowStockItems: number;
  forecastAccuracy: number;
  mape: number;
  estimatedSavingsPkr: string; // "Rs. 2.4M"
}

export interface NotificationItem {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
  link?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Store Manager' | 'Procurement Specialist';
  facility: string;
  avatarUrl?: string;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  urduText?: string;
  timestamp: string;
  quickActions?: { label: string; action: string }[];
  confidence?: number;
  dataPoints?: { label: string; value: string }[];
}

export interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  category: 'Procurement' | 'Inventory' | 'Expiry' | 'Forecast' | 'Executive';
  frequency: string;
  lastGenerated: string;
  format: 'PDF' | 'Excel' | 'CSV';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
}
