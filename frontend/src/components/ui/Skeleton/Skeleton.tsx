import { memo } from "react";

export type SkeletonShape = "rectangle" | "circle" | "text";

export interface SkeletonProps {
  /** Forme du skeleton */
  shape?: SkeletonShape;
  /** Largeur (CSS value ou Tailwind class) */
  width?: string;
  /** Hauteur (CSS value ou Tailwind class) */
  height?: string;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant Skeleton de base avec animation pulse.
 * Utilisé comme placeholder pendant le chargement des composants.
 */
export const Skeleton = memo(function Skeleton({
  shape = "rectangle",
  width,
  height,
  className = "",
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-base-300";

  const shapeClasses: Record<SkeletonShape, string> = {
    rectangle: "rounded-lg",
    circle: "rounded-full",
    text: "rounded h-4",
  };

  // Gestion des dimensions
  const style: React.CSSProperties = {};
  let dimensionClasses = "";

  if (width) {
    if (width.startsWith("w-")) {
      dimensionClasses += ` ${width}`;
    } else {
      style.width = width;
    }
  }

  if (height) {
    if (height.startsWith("h-")) {
      dimensionClasses += ` ${height}`;
    } else {
      style.height = height;
    }
  }

  return (
    <div
      className={`${baseClasses} ${shapeClasses[shape]}${dimensionClasses} ${className}`}
      style={Object.keys(style).length > 0 ? style : undefined}
      aria-hidden="true"
    />
  );
});
