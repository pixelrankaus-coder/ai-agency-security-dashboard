// components/security/status-badge.tsx
"use client";

import { ScanStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: ScanStatus;
  progress?: number;
  className?: string;
}

export function StatusBadge({ status, progress, className }: StatusBadgeProps) {
  const config = {
    complete: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
      label: "Complete",
      showDot: false,
    },
    scanning: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-200",
      label: progress !== undefined ? `Scanning ${progress}%` : "Scanning",
      showDot: true,
    },
    analysing: {
      bg: "bg-amber-100",
      text: "text-amber-800",
      border: "border-amber-200",
      label: "AI Analysing...",
      showDot: true,
    },
    queued: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
      label: "Queued",
      showDot: false,
    },
    error: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
      label: "Error",
      showDot: false,
    },
  }[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      {config.showDot && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
}
