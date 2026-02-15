// components/security/severity-badge.tsx
"use client";

import { SeverityLevel } from "@/types";
import { SEVERITY_CONFIG } from "@/lib/severity";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: SeverityLevel;
  count?: number;
  showIcon?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function SeverityBadge({
  severity,
  count,
  showIcon = true,
  size = "md",
  className,
}: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      {showIcon && <span className={size === "sm" ? "text-[8px]" : "text-[10px]"}>{config.icon}</span>}
      <span className="capitalize">{severity}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-0.5 font-semibold">({count})</span>
      )}
    </span>
  );
}
