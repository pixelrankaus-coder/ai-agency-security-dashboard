// lib/supabase/types.ts
// TypeScript types matching the Supabase schema

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  notes: string;
  subscription_plan: "trial" | "basic" | "pro" | "enterprise";
  subscription_status: "active" | "past_due" | "cancelled" | "trialing";
  scans_per_month: number;
  scans_used_this_month: number;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  company_id: string | null;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: "super_admin" | "company_admin" | "company_viewer";
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  company_id: string;
  url: string;
  name: string | null;
  notes: string;
  last_scan_id: string | null;
  last_scan_at: string | null;
  last_scan_grade: string | null;
  last_scan_score: number | null;
  last_scan_findings: SeverityCounts;
  scan_schedule: "manual" | "weekly" | "monthly";
  default_scanners: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Scan {
  id: string;
  site_id: string;
  company_id: string;
  started_by: string | null;
  scan_source: "manual" | "scheduled" | "plugin" | null;
  url: string;
  scanners: string[];
  status: "queued" | "scanning" | "analysing" | "complete" | "error";
  progress: number;
  current_scanner: string | null;
  results: ScannerResult[];
  analysis: string | null;
  total_findings: number;
  severity_counts: SeverityCounts;
  grade: string | null;
  score: number | null;
  report_url: string | null;
  error: string | null;
  duration_seconds: number | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface Finding {
  id: string;
  scan_id: string;
  site_id: string;
  company_id: string;
  scanner: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  type: string;
  description: string;
  recommendation: string | null;
  metadata: Record<string, unknown>;
  status: "open" | "acknowledged" | "fixed" | "false_positive";
  fixed_at: string | null;
  created_at: string;
}

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface ScannerResult {
  scanner: string;
  success: boolean;
  findings: FindingInput[];
  error: string;
  duration_seconds: number;
  grade?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

// Used when creating findings (before they have IDs)
export interface FindingInput {
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  description: string;
  recommendation?: string;
  url?: string;
  path?: string;
  header?: string;
  value?: string;
  technologies?: string[];
  metadata?: Record<string, unknown>;
}
