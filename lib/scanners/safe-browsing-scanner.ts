// lib/scanners/safe-browsing-scanner.ts
import type { Finding } from "@/types";
import type { ScanResult, Scanner } from "./types";

interface SafeBrowsingRequest {
  client: {
    clientId: string;
    clientVersion: string;
  };
  threatInfo: {
    threatTypes: string[];
    platformTypes: string[];
    threatEntryTypes: string[];
    threatEntries: Array<{ url: string }>;
  };
}

interface SafeBrowsingResponse {
  matches?: Array<{
    threatType: string;
    platformType: string;
    threat: { url: string };
    cacheDuration: string;
    threatEntryType: string;
  }>;
}

export const safeBrowsingScanner: Scanner = {
  async scan(target: string): Promise<ScanResult> {
    const findings: Finding[] = [];
    let success = false;
    let error = "";

    try {
      const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

      if (!apiKey) {
        throw new Error("Google Safe Browsing API key not configured");
      }

      // Normalize URL
      let cleanUrl = target;
      try {
        const url = new URL(target.startsWith("http") ? target : `https://${target}`);
        cleanUrl = url.href;
      } catch {
        cleanUrl = target.startsWith("http") ? target : `https://${target}`;
      }

      const requestBody: SafeBrowsingRequest = {
        client: {
          clientId: "secscan-dashboard",
          clientVersion: "1.0.0",
        },
        threatInfo: {
          threatTypes: [
            "MALWARE",
            "SOCIAL_ENGINEERING",
            "UNWANTED_SOFTWARE",
            "POTENTIALLY_HARMFUL_APPLICATION",
          ],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url: cleanUrl }],
        },
      };

      const response = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Safe Browsing API error: ${response.status} - ${errorText}`);
      }

      const data: SafeBrowsingResponse = await response.json();

      if (data.matches && data.matches.length > 0) {
        // Found threats
        for (const match of data.matches) {
          const severity = match.threatType === "MALWARE" ? "critical" : "high";
          findings.push({
            title: `Safe Browsing Threat Detected: ${match.threatType}`,
            severity,
            description: `Google Safe Browsing has flagged this site as ${match.threatType.replace(/_/g, " ").toLowerCase()}.`,
            recommendation: "Investigate and remove malicious content immediately. Your site may be compromised.",
            affected_url: target,
            evidence: `Threat type: ${match.threatType}, Platform: ${match.platformType}`,
          });
        }
      } else {
        // No threats found
        findings.push({
          title: "No Safe Browsing Threats Detected",
          severity: "info",
          description: "Google Safe Browsing did not find any known malware, phishing, or harmful applications on this site.",
          recommendation: "Continue monitoring your site for security threats.",
          affected_url: target,
          evidence: "Clean scan - no matches found",
        });
      }

      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);

      if (error.includes("API key not configured")) {
        findings.push({
          title: "Safe Browsing Not Configured",
          severity: "info",
          description: "Google Safe Browsing API key is not configured. Add GOOGLE_SAFE_BROWSING_API_KEY to .env.local to enable this scanner.",
          recommendation: "Get an API key from Google Cloud Console and add it to your environment variables.",
          affected_url: target,
          evidence: error,
        });
      } else {
        findings.push({
          title: "Safe Browsing Scan Error",
          severity: "medium",
          description: `Unable to complete Google Safe Browsing scan: ${error}`,
          recommendation: "Check your API key and network connectivity.",
          affected_url: target,
          evidence: error,
        });
      }
    }

    return {
      scanner: "safe_browsing",
      success,
      findings,
      error,
      duration_seconds: 0,
    };
  },
};
