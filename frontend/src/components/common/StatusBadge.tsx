import React from "react";
import { CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";

interface StatusBadgeProps {
  label?: string;
  variant?: "success" | "warning" | "info" | "danger" | "neutral";
  status?: string;
}

const variantStyles: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/10",
  warning: "bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-500/10",
  info: "bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-500/10",
  danger: "bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-500/10",
  neutral: "bg-slate-50 text-slate-400 border-slate-100",
};

const statusVariantMap: Record<string, string> = {
  paid: "success",
  completed: "success",
  passed: "success",
  active: "success",
  partial: "info",
  pending: "warning",
  absent: "warning",
  "in-progress": "warning",
  inactive: "neutral",
  waived: "neutral",
  failed: "danger",
};

const getVariant = (status: string): string => {
  const lower = status.toLowerCase();
  return statusVariantMap[lower] ?? "neutral";
};

const formatLabel = (status: string): string => {
  if (status === "in-progress") return "In Progress";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant, status }) => {
  const resolvedVariant = status ? getVariant(status) : (variant ?? "neutral");
  const resolvedLabel = label ?? (status ? formatLabel(status) : "");

  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border inline-block ${variantStyles[resolvedVariant]}`}>
      {resolvedLabel}
    </span>
  );
};

export const getStatusBadge = (status: string | null | undefined): React.ReactNode => {
  if (!status) return null;

  const variant = getVariant(status);
  const label = formatLabel(status);

  const baseClass = variantStyles[variant]
    .replace(" shadow-sm shadow-emerald-500/10", "")
    .replace(" shadow-sm shadow-amber-500/10", "")
    .replace(" shadow-sm shadow-blue-500/10", "")
    .replace(" shadow-sm shadow-rose-500/10", "");
  const badgeClass = `inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${baseClass}`;

  const iconClass = "w-3 h-3";

  switch (status) {
    case "paid":
    case "completed":
    case "passed":
    case "active":
      return (
        <span className={badgeClass}>
          <CheckCircle className={iconClass} />
          {label}
        </span>
      );
    case "failed":
      return (
        <span className={badgeClass}>
          <XCircle className={iconClass} />
          {label}
        </span>
      );
    case "partial":
    case "pending":
    case "in-progress":
    case "absent":
    case "inactive":
      return (
        <span className={badgeClass}>
          <AlertTriangle className={iconClass} />
          {label}
        </span>
      );
    default:
      return (
        <span className={badgeClass}>
          <Clock className={iconClass} />
          {label}
        </span>
      );
  }
};

export default StatusBadge;
