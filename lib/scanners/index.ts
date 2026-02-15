// lib/scanners/index.ts
import type { ScanResult, Scanner } from "./types";
import { observatoryScanner } from "./observatory-scanner";
import { sslScanner } from "./ssl-scanner";
import { crawlerScanner } from "./crawler-scanner";
import { safeBrowsingScanner } from "./safe-browsing-scanner";

const SCANNER_MAP: Record<string, Scanner> = {
  observatory: observatoryScanner,
  ssl: sslScanner,
  crawler: crawlerScanner,
  safe_browsing: safeBrowsingScanner,
};

export const DEFAULT_SCANNERS = ["observatory", "ssl", "crawler"];

export async function runScanners(
  target: string,
  scannerNames: string[]
): Promise<ScanResult[]> {
  const results: ScanResult[] = [];

  for (const name of scannerNames) {
    const scanner = SCANNER_MAP[name];
    if (!scanner) {
      console.warn(`Scanner '${name}' not found, skipping`);
      continue;
    }

    const start = Date.now();
    try {
      const result = await scanner.scan(target);
      result.duration_seconds = (Date.now() - start) / 1000;
      results.push(result);
    } catch (err) {
      results.push({
        scanner: name,
        success: false,
        findings: [],
        error: String(err),
        duration_seconds: (Date.now() - start) / 1000,
      });
    }
  }

  return results;
}

export { SCANNER_MAP };
