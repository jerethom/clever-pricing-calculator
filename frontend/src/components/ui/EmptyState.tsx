import { memo, type ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
  link?: {
    label: string;
    href: string;
  };
  colorClass?: string;
}

export const EmptyState = memo(function EmptyState({
  icon,
  title,
  description,
  action,
  link,
  colorClass = "primary",
}: EmptyStateProps) {
  const variantClass = action?.variant ?? colorClass;

  return (
    <div
      className={`card bg-base-100 border border-dashed border-base-300 hover:border-${colorClass}/30 transition-colors`}
    >
      <div className="card-body items-center text-center py-16">
        <div className="relative mb-4">
          <div
            className={`absolute inset-0 bg-${colorClass}/10 rounded-full blur-xl animate-pulse`}
          />
          <div className="relative bg-base-200 p-6 rounded-full">{icon}</div>
        </div>

        <h3 className="text-lg font-semibold text-base-content">{title}</h3>

        {description && (
          <p className="text-base-content/60 max-w-md">{description}</p>
        )}

        {action && (
          <div className="card-actions mt-6">
            <button
              type="button"
              className={`btn btn-${variantClass} gap-2`}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          </div>
        )}

        {link && (
          <p className="text-xs text-base-content/40 mt-4">
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-hover"
            >
              {link.label}
            </a>
          </p>
        )}
      </div>
    </div>
  );
});
