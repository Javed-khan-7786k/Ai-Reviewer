import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateString;
  }
}

export function getAiScoreTier(score: number | null | undefined): {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
} {
  if (score === null || score === undefined) {
    return {
      label: "Pending",
      color: "#94a3b8",
      bgClass: "bg-slate-100",
      textClass: "text-slate-600",
      borderClass: "border-slate-300",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    };
  }

  if (score <= 20) {
    return {
      label: "Human",
      color: "#10b981",
      bgClass: "bg-emerald-50",
      textClass: "text-emerald-700",
      borderClass: "border-emerald-500",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }
  if (score <= 50) {
    return {
      label: "Mixed",
      color: "#f59e0b",
      bgClass: "bg-amber-50",
      textClass: "text-amber-700",
      borderClass: "border-amber-500",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }
  if (score <= 80) {
    return {
      label: "High AI",
      color: "#f97316",
      bgClass: "bg-orange-50",
      textClass: "text-orange-700",
      borderClass: "border-orange-500",
      badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    };
  }
  return {
    label: "Very Likely AI",
    color: "#ef4444",
    bgClass: "bg-rose-50",
    textClass: "text-rose-700",
    borderClass: "border-rose-500",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  };
}
