import { memo } from "react";
import { formatHourlyPrice, formatPrice } from "@/lib/costCalculator";
import type { RuntimeCostDetail, ScalingProfile } from "@/types";

const HOURS_PER_WEEK = 168;

interface ProfileCostItemProps {
  profile: ScalingProfile;
  cost: RuntimeCostDetail;
}

export const ProfileCostItem = memo(function ProfileCostItem({
  profile,
  cost,
}: ProfileCostItemProps) {
  const profileHours = cost.scalingHoursByProfile?.[profile.id] ?? 0;
  const profileCost = cost.scalingCostByProfile?.[profile.id] ?? 0;
  const displayHours = profileHours > 0 ? profileHours : HOURS_PER_WEEK;

  return (
    <div className="flex justify-between items-start">
      <div className="flex-1 min-w-0">
        <span className="font-medium">{profile.name}</span>
        <span className="text-base-content/60 text-xs block">
          {profile.minInstances}-{profile.maxInstances} inst. (
          {profile.minFlavorName}-{profile.maxFlavorName})
        </span>
        <span className="text-base-content/50 text-xs">
          {displayHours}h/sem
        </span>
      </div>
      <span className="font-mono tabular-nums text-right">
        {formatPrice(profileCost)}
      </span>
    </div>
  );
});

interface FixedConfigItemProps {
  instances: number;
  flavorName: string;
  hourlyPrice: number;
  monthlyCost: number;
}

export const FixedConfigItem = memo(function FixedConfigItem({
  instances,
  flavorName,
  hourlyPrice,
  monthlyCost,
}: FixedConfigItemProps) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <span className="font-medium">Configuration fixe</span>
        <span className="text-base-content/60 text-xs block">
          {instances} inst. x {flavorName} x {formatHourlyPrice(hourlyPrice)}
        </span>
      </div>
      <span className="font-mono tabular-nums">{formatPrice(monthlyCost)}</span>
    </div>
  );
});

interface CostGaugeProps {
  minCost: number;
  maxCost: number;
  position: number;
  className?: string;
}

export const CostGauge = memo(function CostGauge({
  minCost,
  maxCost,
  position,
  className = "",
}: CostGaugeProps) {
  return (
    <div className={className}>
      <div className="flex justify-between text-xs text-base-content/60 mb-1">
        <span>{formatPrice(minCost)}</span>
        <span>{formatPrice(maxCost)}</span>
      </div>
      <div className="h-2 bg-base-300 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${Math.min(100, position)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="text-base-content/50">Base seule</span>
        <span className="text-base-content/50">Scaling max</span>
      </div>
    </div>
  );
});

interface CostTotalProps {
  total: number;
}

export const CostTotal = memo(function CostTotal({ total }: CostTotalProps) {
  return (
    <div className="border-t border-base-300 pt-2">
      <div className="flex justify-between items-center font-medium">
        <span>Total estime</span>
        <span className="font-mono tabular-nums text-primary">
          {formatPrice(total)}
        </span>
      </div>
    </div>
  );
});
