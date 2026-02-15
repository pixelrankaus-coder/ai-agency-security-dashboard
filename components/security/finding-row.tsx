// components/security/finding-row.tsx
"use client";

import { Finding } from "@/types";
import { SeverityBadge } from "./severity-badge";
import { SEVERITY_CONFIG } from "@/lib/severity";
import { cn } from "@/lib/utils";

interface FindingRowProps {
  finding: Finding;
  className?: string;
}

export function FindingRow({ finding, className }: FindingRowProps) {
  const config = SEVERITY_CONFIG[finding.severity];

  // Build the main description
  const description =
    finding.description || finding.name || "Security finding detected";

  // Build additional details
  const details: string[] = [];
  if (finding.header) details.push(`Header: ${finding.header}`);
  if (finding.value) details.push(`Value: ${finding.value}`);
  if (finding.path) details.push(`Path: ${finding.path}`);
  if (finding.url) details.push(`URL: ${finding.url}`);
  if (finding.matched_url) details.push(`Matched: ${finding.matched_url}`);
  if (finding.technologies)
    details.push(`Technologies: ${finding.technologies.join(", ")}`);
  if (finding.users) details.push(`Users: ${finding.users.join(", ")}`);
  if (finding.template_id) details.push(`Template: ${finding.template_id}`);
  if (finding.tags) details.push(`Tags: ${finding.tags.join(", ")}`);

  return (
    <div
      className={cn(
        "rounded-lg border-l-4 p-4",
        config.bg,
        config.border,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-start gap-2">
            <SeverityBadge severity={finding.severity} showIcon={true} />
            <p className="flex-1 text-sm font-medium text-gray-900">
              {description}
            </p>
          </div>

          {details.length > 0 && (
            <div className="space-y-1 text-xs text-gray-600">
              {details.map((detail, idx) => (
                <p key={idx} className="font-mono">
                  {detail}
                </p>
              ))}
            </div>
          )}

          {finding.recommendation && (
            <div className="mt-2 rounded-md bg-white/50 p-2 text-xs text-gray-700">
              <span className="font-semibold">Recommendation:</span>{" "}
              {finding.recommendation}
            </div>
          )}

          {finding.reference && finding.reference.length > 0 && (
            <div className="mt-2 space-y-1">
              <span className="text-xs font-semibold text-gray-700">
                References:
              </span>
              {finding.reference.map((ref, idx) => (
                <a
                  key={idx}
                  href={ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-blue-600 hover:underline"
                >
                  {ref}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
