// components/security/severity-summary-bar.tsx
"use client";

import { SeverityCounts } from "@/types";
import { SeverityBadge } from "./severity-badge";
import { CheckCircle2 } from "lucide-react";

interface SeveritySummaryBarProps {
  severities: SeverityCounts;
  className?: string;
}

export function SeveritySummaryBar({
  severities,
  className,
}: SeveritySummaryBarProps) {
  const totalFindings = Object.values(severities).reduce(
    (sum, count) => sum + count,
    0
  );

  if (totalFindings === 0) {
    return (
      <div className={className}>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800">
          <CheckCircle2 className="h-3 w-3" />
          No issues
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {severities.critical > 0 && (
        <SeverityBadge severity="critical" count={severities.critical} />
      )}
      {severities.high > 0 && (
        <SeverityBadge severity="high" count={severities.high} />
      )}
      {severities.medium > 0 && (
        <SeverityBadge severity="medium" count={severities.medium} />
      )}
      {severities.low > 0 && (
        <SeverityBadge severity="low" count={severities.low} />
      )}
      {severities.info > 0 && (
        <SeverityBadge severity="info" count={severities.info} />
      )}
    </div>
  );
}
