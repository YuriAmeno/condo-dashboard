export interface PackageRegisterReq {
  delivery_company: string;
  store_name: string;
  resident_id: string;
  package_id: string;
}

export interface Company {
  id: string;
  name: string;
}

export interface Store {
  id: string;
  name: string;
}

export interface DailyStats {
  date: string;
  received: number;
  delivered: number;
}

export interface HourlyStats {
  hour: number;
  received: number;
  delivered: number;
}

export interface StatusStats {
  status: string;
  count: number;
  percentage: number;
}

export interface BuildingStats {
  building: string;
  name: string;
  pending: number;
  delivered: number;
  total: number;
}

export interface DeliveryHeatmapItem {
  hour: string;
  day: string;
  count: number;
}

export interface PackageTypesTrend {
  date: string;
  envelope: number;
  small: number;
  medium: number;
  large: number;
}

export interface PickupTimeByDayItem {
  day: string;
  averageTime: number;
}

export interface StorageHistoryItem {
  date: string;
  occupationPercentage: number;
}

export interface PackageAnalytics {
  dailyStats: DailyStats[];
  buildingStats: BuildingStats[];
  hourlyStats: HourlyStats[];
  statusStats: StatusStats[];
  deliveryHeatmap: DeliveryHeatmapItem[];
}