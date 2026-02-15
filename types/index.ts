// types/index.ts
// Re-export Supabase types for convenience
export type {
  Company,
  Profile,
  Site,
  Scan,
  Finding as FindingRecord,
  SeverityCounts,
  ScannerResult,
  FindingInput,
} from "@/lib/supabase/types";

export type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";

export type ScanStatus = "queued" | "scanning" | "analysing" | "complete" | "error";

// Legacy interface - use SeverityCounts from Supabase types instead
export interface SeverityCountsLegacy {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

// Legacy interface - deprecated, kept for backward compatibility
export interface ScanSummary {
  total_findings: number;
  severities: SeverityCountsLegacy;
  scanners_run: number;
  scanners_total: number;
}

// Finding interface for scanner results (before database storage)
export interface Finding {
  title: string;
  severity: SeverityLevel;
  description: string;
  recommendation: string;
  affected_url: string;
  evidence?: string;
  type?: string;
  name?: string;
  header?: string;
  value?: string;
  url?: string;
  path?: string;
  technologies?: string[];
  users?: string[];
  template_id?: string;
  matched_url?: string;
  tags?: string[];
  reference?: string[];
  expiry_date?: string;
  issuer?: string;
  common_name?: string;
  grade?: string;
  score?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown; // findings vary by scanner
}

// Scanner result from lib/scanners
export interface ScannerResultLegacy {
  scanner: string;
  success: boolean;
  findings_count?: number;
  findings: Finding[];
  error: string;
  duration_seconds: number;
  metadata?: Record<string, unknown>;
}

// Extended scan with results (for scan detail page)
export interface ScanDetail {
  id: string;
  site_id: string;
  company_id: string;
  started_by: string | null;
  url: string;
  scanners: string[];
  status: "queued" | "scanning" | "analysing" | "complete" | "error";
  progress: number;
  current_scanner: string | null;
  results: ScannerResultLegacy[];
  analysis: string | null;
  total_findings: number;
  severity_counts: SeverityCountsLegacy;
  grade: string | null;
  score: number | null;
  report_url: string | null;
  error: string | null;
  duration_seconds: number | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

// @deprecated - Use Site from Supabase types instead
export interface Client {
  id: string;
  name: string;
  website: string;
  notes: string;
  created_at: string;
}

export interface HealthStatus {
  status: string;
  scanners: Record<string, boolean>;
  total_scans: number;
  total_clients: number;
}
