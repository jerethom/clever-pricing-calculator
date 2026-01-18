import { memo, useCallback, useId, useMemo } from "react";
import { Icons, NumberInput } from "@/components/ui";
import { calculateMetricCost } from "@/lib/addonCostCalculator";
import { getUsageBasedPricing } from "@/lib/addonPricingRegistry";
import { formatPrice } from "@/lib/costCalculator";
import type { UsageEstimate, UsageMetric } from "@/types";

interface UsageEstimateFormProps {
  providerId: string;
  estimates: UsageEstimate[];
  onChange: (estimates: UsageEstimate[]) => void;
}

interface MetricInputProps {
  metric: UsageMetric;
  value: number;
  onChange: (value: number) => void;
}

const MetricInput = memo(function MetricInput({
  metric,
  value,
  onChange,
}: MetricInputProps) {
  const inputId = useId();
  const cost = useMemo(
    () => calculateMetricCost(metric, value),
    [metric, value],
  );
  const hasFreeQuota = metric.freeQuota > 0;
  const freeQuotaUsed = Math.min(value, metric.freeQuota);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-base-content/80"
        >
          {metric.name}
        </label>
        <span className="text-sm font-bold text-secondary">
          {cost > 0 ? `~${formatPrice(cost)}` : "Gratuit"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <input
          id={inputId}
          type="range"
          min={metric.minValue}
          max={metric.maxValue}
          step={metric.step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="range range-secondary range-sm flex-1"
        />
        <NumberInput
          value={value}
          onChange={onChange}
          min={metric.minValue}
          max={metric.maxValue}
          step={metric.step}
          size="sm"
          suffix={metric.unit}
        />
      </div>

      {hasFreeQuota && (
        <p className="text-xs text-base-content/60">
          <Icons.Check className="w-3 h-3 inline mr-1 text-success" />
          {freeQuotaUsed} {metric.unit} gratuits inclus
          {value > metric.freeQuota && (
            <span className="ml-1">
              ({(value - metric.freeQuota).toFixed(1)} {metric.unit} factures)
            </span>
          )}
        </p>
      )}

      {metric.tiers.length > 1 && (
        <p className="text-xs text-base-content/50">
          Tarifs degressifs a partir de {metric.tiers[1]?.minThreshold}{" "}
          {metric.unit}
        </p>
      )}
    </div>
  );
});

export const UsageEstimateForm = memo(function UsageEstimateForm({
  providerId,
  estimates,
  onChange,
}: UsageEstimateFormProps) {
  const pricing = getUsageBasedPricing(providerId);

  const handleMetricChange = useCallback(
    (metricId: string, value: number) => {
      const newEstimates = estimates.map((e) =>
        e.metricId === metricId ? { ...e, value } : e,
      );
      // Si la métrique n'existe pas encore, l'ajouter
      if (!newEstimates.some((e) => e.metricId === metricId)) {
        newEstimates.push({
          metricId: metricId as UsageEstimate["metricId"],
          value,
        });
      }
      onChange(newEstimates);
    },
    [estimates, onChange],
  );

  if (!pricing) return null;

  const totalCost = pricing.metrics.reduce((sum, metric) => {
    const estimate = estimates.find((e) => e.metricId === metric.id);
    const value = estimate?.value ?? metric.defaultValue;
    return sum + calculateMetricCost(metric, value);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-base-content/70">
        <Icons.Info className="w-4 h-4 text-info" />
        <span>{pricing.pricingDescription}</span>
      </div>

      <div className="space-y-4">
        {pricing.metrics.map((metric) => {
          const estimate = estimates.find((e) => e.metricId === metric.id);
          const value = estimate?.value ?? metric.defaultValue;

          return (
            <MetricInput
              key={metric.id}
              metric={metric}
              value={value}
              onChange={(v) => handleMetricChange(metric.id, v)}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-base-300">
        <div className="flex items-center gap-2">
          <span className="badge badge-info badge-sm">Estimation</span>
          <span className="text-sm text-base-content/60">Cout mensuel</span>
        </div>
        <span className="text-lg font-bold text-secondary">
          ~{formatPrice(totalCost)}
        </span>
      </div>
    </div>
  );
});
