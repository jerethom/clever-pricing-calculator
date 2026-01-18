export type UsageMetricType =
  | "storage_gb"
  | "bandwidth_gb"
  | "users"
  | "io_operations";

export interface PricingTier {
  minThreshold: number;
  maxThreshold: number | null;
  pricePerUnit: number;
}

export interface UsageMetric {
  id: UsageMetricType;
  name: string;
  unit: string;
  freeQuota: number;
  tiers: PricingTier[];
  defaultValue: number;
  minValue: number;
  maxValue: number;
  step: number;
}

export interface UsageEstimate {
  metricId: UsageMetricType;
  value: number;
}

export interface UsageBasedPricing {
  providerId: string;
  metrics: UsageMetric[];
  pricingDescription: string;
}

export interface UsageMetricCostDetail {
  metricId: UsageMetricType;
  metricName: string;
  value: number;
  unit: string;
  cost: number;
  freeQuotaApplied: number;
}
