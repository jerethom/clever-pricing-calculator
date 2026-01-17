import { memo, useMemo } from "react";
import { formatPrice } from "@/lib/costCalculator";

interface PriceRangeProps {
  min: number;
  estimated: number;
  max: number;
  size?: "sm" | "md" | "lg";
  showBar?: boolean;
  compact?: boolean;
  allowSingle?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    label: "text-xs",
    value: "text-sm font-medium",
    estimatedValue: "text-base font-bold",
    bar: "h-1",
    dot: "w-2 h-2",
    arrow: "text-xs",
    gap: "gap-2",
    padding: "py-2",
  },
  md: {
    label: "text-xs",
    value: "text-base font-medium",
    estimatedValue: "text-lg font-bold",
    bar: "h-1.5",
    dot: "w-2.5 h-2.5",
    arrow: "text-sm",
    gap: "gap-3",
    padding: "py-3",
  },
  lg: {
    label: "text-sm",
    value: "text-lg font-medium",
    estimatedValue: "text-2xl font-bold",
    bar: "h-2",
    dot: "w-3 h-3",
    arrow: "text-base",
    gap: "gap-4",
    padding: "py-4",
  },
};

export const PriceRange = memo(function PriceRange({
  min,
  estimated,
  max,
  size = "md",
  showBar = true,
  compact = false,
  allowSingle = false,
  className = "",
}: PriceRangeProps) {
  const config = sizeConfig[size];

  const position = useMemo(() => {
    if (max === min) return 50;
    return ((estimated - min) / (max - min)) * 100;
  }, [min, estimated, max]);

  if (min === max) {
    if (!allowSingle) {
      return null;
    }

    if (compact) {
      return (
        <div className={`flex items-center gap-1.5 tabular-nums ${className}`}>
          <span className="text-primary font-semibold">
            {formatPrice(estimated)}
          </span>
          <span className="text-base-content/50 text-xs">(fixe)</span>
        </div>
      );
    }

    return (
      <div className={className}>
        <div className="text-center">
          <div className={`${config.label} text-primary mb-0.5`}>Estimé</div>
          <div className={`${config.estimatedValue} text-primary tabular-nums`}>
            {formatPrice(estimated)}
          </div>
          <div className="text-xs text-base-content/50 mt-1">Prix fixe</div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 tabular-nums ${className}`}>
        <span className="text-success">{formatPrice(min)}</span>
        <span className="text-base-content/30">-</span>
        <span className="text-primary font-semibold">
          {formatPrice(estimated)}
        </span>
        <span className="text-base-content/30">-</span>
        <span className="text-warning">{formatPrice(max)}</span>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className={`flex items-center justify-between ${config.gap}`}>
        <div className="text-center flex-1">
          <div className={`${config.label} text-success mb-0.5`}>Min</div>
          <div className={`${config.value} text-success tabular-nums`}>
            {formatPrice(min)}
          </div>
        </div>

        <div className={`${config.arrow} text-base-content/30`}>&rarr;</div>

        <div className="text-center flex-1">
          <div className={`${config.label} text-primary mb-0.5`}>Estime</div>
          <div className={`${config.estimatedValue} text-primary tabular-nums`}>
            {formatPrice(estimated)}
          </div>
        </div>

        <div className={`${config.arrow} text-base-content/30`}>&larr;</div>

        <div className="text-center flex-1">
          <div className={`${config.label} text-warning mb-0.5`}>Max</div>
          <div className={`${config.value} text-warning tabular-nums`}>
            {formatPrice(max)}
          </div>
        </div>
      </div>

      {showBar && (
        <div className="mt-2 relative">
          <div
            className={`${config.bar} bg-gradient-to-r from-success via-warning to-error rounded-full`}
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 ${config.dot} bg-primary border-2 border-primary-content rounded-full shadow-sm transition-all duration-300`}
            style={{
              left: `calc(${position}% - ${size === "lg" ? "6px" : size === "md" ? "5px" : "4px"})`,
            }}
          />
        </div>
      )}
    </div>
  );
});
