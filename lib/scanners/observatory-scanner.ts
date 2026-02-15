// lib/scanners/observatory-scanner.ts
import type { Finding } from "@/types";
import type { ScanResult, Scanner } from "./types";

interface ObservatoryResponse {
  scan_id: number;
  grade: string;
  score: number;
  tests_passed: number;
  tests_failed: number;
  tests_quantity: number;
  state: string;
  error?: string;
}

export const observatoryScanner: Scanner = {
  async scan(target: string): Promise<ScanResult> {
    const findings: Finding[] = [];
    let success = false;
    let error = "";
    let grade = "";

    try {
      // Extract hostname from URL
      let hostname = target;
      try {
        const url = new URL(target.startsWith("http") ? target : `https://${target}`);
        hostname = url.hostname;
      } catch {
        hostname = target.replace(/^https?:\/\//, "").split("/")[0];
      }

      // Start scan
      const scanResponse = await fetch(
        `https://http-observatory.security.mozilla.org/api/v1/analyze?host=${encodeURIComponent(hostname)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!scanResponse.ok) {
        throw new Error(`Observatory API returned ${scanResponse.status}`);
      }

      const scanData: ObservatoryResponse = await scanResponse.json();

      if (scanData.error) {
        throw new Error(scanData.error);
      }

      // Poll for results (max 30 seconds)
      let attempts = 0;
      let result: ObservatoryResponse | null = null;

      while (attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const resultResponse = await fetch(
          `https://http-observatory.security.mozilla.org/api/v1/analyze?host=${encodeURIComponent(hostname)}`
        );

        if (!resultResponse.ok) {
          throw new Error(`Observatory API returned ${resultResponse.status}`);
        }

        result = await resultResponse.json();

        if (result && result.state === "FINISHED") {
          break;
        }

        if (result && result.state === "FAILED") {
          throw new Error("Observatory scan failed");
        }

        attempts++;
      }

      if (!result || result.state !== "FINISHED") {
        throw new Error("Observatory scan timed out");
      }

      grade = result.grade;

      // Grade-based findings
      if (result.grade === "F") {
        findings.push({
          title: "Poor Security Headers",
          severity: "critical",
          description: `Mozilla Observatory grade: ${result.grade} (Score: ${result.score}/100). ${result.tests_failed} of ${result.tests_quantity} security tests failed.`,
          recommendation: "Implement recommended security headers to improve your score.",
          affected_url: target,
          evidence: `Grade: ${result.grade}, Score: ${result.score}/100`,
        });
      } else if (result.grade === "D" || result.grade === "E") {
        findings.push({
          title: "Weak Security Headers",
          severity: "high",
          description: `Mozilla Observatory grade: ${result.grade} (Score: ${result.score}/100). ${result.tests_failed} of ${result.tests_quantity} security tests failed.`,
          recommendation: "Review and implement missing security headers.",
          affected_url: target,
          evidence: `Grade: ${result.grade}, Score: ${result.score}/100`,
        });
      } else if (result.grade === "C") {
        findings.push({
          title: "Moderate Security Headers",
          severity: "medium",
          description: `Mozilla Observatory grade: ${result.grade} (Score: ${result.score}/100). ${result.tests_failed} of ${result.tests_quantity} security tests failed.`,
          recommendation: "Consider adding additional security headers to reach grade B or higher.",
          affected_url: target,
          evidence: `Grade: ${result.grade}, Score: ${result.score}/100`,
        });
      } else if (result.grade === "B") {
        findings.push({
          title: "Good Security Headers",
          severity: "low",
          description: `Mozilla Observatory grade: ${result.grade} (Score: ${result.score}/100). Only ${result.tests_failed} tests failed.`,
          recommendation: "Good job! Consider addressing the remaining issues to reach grade A.",
          affected_url: target,
          evidence: `Grade: ${result.grade}, Score: ${result.score}/100`,
        });
      } else if (result.grade === "A" || result.grade === "A+") {
        findings.push({
          title: "Excellent Security Headers",
          severity: "info",
          description: `Mozilla Observatory grade: ${result.grade} (Score: ${result.score}/100). ${result.tests_passed} of ${result.tests_quantity} tests passed.`,
          recommendation: "Excellent! Security headers are properly configured.",
          affected_url: target,
          evidence: `Grade: ${result.grade}, Score: ${result.score}/100`,
        });
      }

      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);

      findings.push({
        title: "Observatory Scan Error",
        severity: "medium",
        description: `Unable to complete Mozilla Observatory scan: ${error}`,
        recommendation: "The site may not be publicly accessible or the Observatory service may be unavailable.",
        affected_url: target,
        evidence: error,
      });
    }

    return {
      scanner: "observatory",
      success,
      findings,
      error,
      duration_seconds: 0,
      metadata: { grade },
    };
  },
};
