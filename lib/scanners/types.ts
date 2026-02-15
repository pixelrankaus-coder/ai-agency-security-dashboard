// lib/scanners/types.ts
import type { Finding } from "@/types";

export interface ScanResult {
  scanner: string;
  success: boolean;
  findings: Finding[];
  error: string;
  duration_seconds: number;
  metadata?: Record<string, unknown>;
}

export interface Scanner {
  scan(target: string): Promise<ScanResult>;
}
