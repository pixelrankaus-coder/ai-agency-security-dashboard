// lib/scanners/crawler-scanner.ts
import type { Finding, SeverityLevel } from "@/types";
import type { ScanResult, Scanner } from "./types";

const SENSITIVE_PATHS: Array<{ path: string; severity: SeverityLevel; name: string }> = [
  { path: "/.env", severity: "critical", name: "Environment File" },
  { path: "/.git/config", severity: "critical", name: "Git Config" },
  { path: "/.git/HEAD", severity: "critical", name: "Git HEAD" },
  { path: "/wp-admin/", severity: "high", name: "WordPress Admin" },
  { path: "/wp-login.php", severity: "high", name: "WordPress Login" },
  { path: "/wp-config.php.bak", severity: "critical", name: "WordPress Config Backup" },
  { path: "/wp-content/debug.log", severity: "medium", name: "WordPress Debug Log" },
  { path: "/xmlrpc.php", severity: "medium", name: "XML-RPC Endpoint" },
  { path: "/phpmyadmin/", severity: "high", name: "phpMyAdmin" },
  { path: "/adminer.php", severity: "high", name: "Adminer" },
  { path: "/server-status", severity: "high", name: "Apache Server Status" },
  { path: "/server-info", severity: "high", name: "Apache Server Info" },
  { path: "/info.php", severity: "high", name: "PHP Info" },
  { path: "/phpinfo.php", severity: "high", name: "PHP Info" },
  { path: "/api/", severity: "medium", name: "API Endpoint" },
  { path: "/graphql", severity: "medium", name: "GraphQL Endpoint" },
  { path: "/swagger.json", severity: "medium", name: "Swagger API Doc" },
  { path: "/openapi.json", severity: "medium", name: "OpenAPI Spec" },
  { path: "/composer.json", severity: "low", name: "Composer Config" },
  { path: "/package.json", severity: "low", name: "NPM Package Config" },
  { path: "/backup/", severity: "medium", name: "Backup Directory" },
  { path: "/backups/", severity: "medium", name: "Backups Directory" },
  { path: "/db/", severity: "medium", name: "Database Directory" },
  { path: "/robots.txt", severity: "info", name: "Robots.txt" },
  { path: "/sitemap.xml", severity: "info", name: "Sitemap" },
  { path: "/.well-known/security.txt", severity: "info", name: "Security.txt" },
];

const TECH_SIGNATURES = [
  { pattern: /wp-content|wp-includes/i, name: "WordPress", type: "CMS" },
  { pattern: /woocommerce/i, name: "WooCommerce", type: "E-commerce" },
  { pattern: /__NEXT_DATA__|next\.js/i, name: "Next.js", type: "Framework" },
  { pattern: /_nuxt|nuxt\.js/i, name: "Nuxt.js", type: "Framework" },
  { pattern: /__react|react\.js/i, name: "React", type: "Library" },
  { pattern: /vue\.js|__vue/i, name: "Vue.js", type: "Framework" },
  { pattern: /jquery\.js|jquery\.min\.js/i, name: "jQuery", type: "Library" },
  { pattern: /bootstrap\.css|bootstrap\.min\.css/i, name: "Bootstrap", type: "CSS Framework" },
  { pattern: /tailwindcss|tailwind\.min\.css/i, name: "Tailwind CSS", type: "CSS Framework" },
  { pattern: /x-powered-by.*php/i, name: "PHP", type: "Backend" },
  { pattern: /laravel/i, name: "Laravel", type: "Framework" },
  { pattern: /cloudflare/i, name: "Cloudflare", type: "CDN" },
  { pattern: /nginx/i, name: "Nginx", type: "Web Server" },
  { pattern: /apache/i, name: "Apache", type: "Web Server" },
  { pattern: /google-analytics|gtag\.js|ga\.js/i, name: "Google Analytics", type: "Analytics" },
  { pattern: /googletagmanager|gtm\.js/i, name: "Google Tag Manager", type: "Analytics" },
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const crawlerScanner: Scanner = {
  async scan(target: string): Promise<ScanResult> {
    const findings: Finding[] = [];
    let success = false;
    let error = "";

    try {
      // Ensure target has protocol
      const baseUrl = target.startsWith("http") ? target : `https://${target}`;
      const isHttps = baseUrl.startsWith("https://");

      // Fetch homepage
      const response = await fetch(baseUrl, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "Ai Agency-Security-Scanner/1.0",
        },
      });

      const body = await response.text();
      const headers = response.headers;

      // Technology detection
      const detectedTech: string[] = [];
      const bodyAndHeaders = body + " " + Array.from(headers.entries()).map(([k, v]) => `${k}: ${v}`).join(" ");

      for (const sig of TECH_SIGNATURES) {
        if (sig.pattern.test(bodyAndHeaders)) {
          detectedTech.push(`${sig.name} (${sig.type})`);
        }
      }

      if (detectedTech.length > 0) {
        findings.push({
          title: "Technology Stack Detected",
          severity: "info",
          description: `Identified technologies in use: ${detectedTech.join(", ")}`,
          recommendation: "Keep all software up to date and monitor for security vulnerabilities.",
          affected_url: baseUrl,
          evidence: detectedTech.join(", "),
        });
      }

      // Sensitive path checks (rate limited)
      const accessiblePaths: Array<{ path: string; severity: string; name: string; status: number }> = [];

      for (let i = 0; i < SENSITIVE_PATHS.length; i++) {
        const item = SENSITIVE_PATHS[i];
        await delay(200); // 200ms delay between requests

        try {
          const pathUrl = new URL(item.path, baseUrl).toString();
          const pathResponse = await fetch(pathUrl, {
            method: "HEAD",
            redirect: "manual",
            headers: {
              "User-Agent": "Ai Agency-Security-Scanner/1.0",
            },
          });

          // Track paths that exist (200 = exposed, 403 = blocked, 401 = needs auth)
          if (pathResponse.status === 200 || pathResponse.status === 401 || pathResponse.status === 403) {
            accessiblePaths.push({ ...item, path: pathUrl, status: pathResponse.status });
          }
        } catch {
          // Ignore errors (path not accessible)
        }
      }

      // Report accessible sensitive paths
      for (const item of accessiblePaths) {
        let description = "";
        let recommendation = "";
        let severity: SeverityLevel;
        let title = "";

        // 403 = Properly blocked (GOOD security) - downgrade to low severity
        if (item.status === 403) {
          severity = "low";
          title = `Detected: ${item.name}`;
          description = `Sensitive path '${item.name}' exists but is properly blocked (403 Forbidden) at ${item.path}`;
          recommendation = "Good! This file/directory is protected. Consider configuring your server to return 404 instead of 403 to avoid revealing file existence.";
        }
        // 200 = Exposed and accessible (BAD security) - use original severity
        else if (item.status === 200) {
          severity = item.severity as SeverityLevel;
          title = `Exposed: ${item.name}`;
          description = `Sensitive path '${item.name}' is publicly accessible at ${item.path}`;

          if (item.severity === "critical") {
            recommendation = "URGENT: Immediately restrict access to this file/directory. It should never be publicly accessible.";
          } else if (item.severity === "high") {
            recommendation = "Restrict access to this path using authentication and IP whitelisting.";
          } else if (item.severity === "medium") {
            recommendation = "Consider restricting access or disabling this feature if not needed.";
          } else {
            recommendation = "Review if this information should be publicly accessible.";
          }
        }
        // 401 = Needs authentication (authentication is working) - medium severity
        else {
          severity = "medium";
          title = `Auth Required: ${item.name}`;
          description = `Sensitive path '${item.name}' requires authentication (401) at ${item.path}`;
          recommendation = "Authentication is in place, but verify it's using strong credentials and secure protocols.";
        }

        findings.push({
          title,
          severity,
          description,
          recommendation,
          affected_url: item.path,
          evidence: `HTTP ${item.status}`,
        });
      }

      // Mixed content check (only for HTTPS sites)
      if (isHttps) {
        const mixedContentRegex = /<(?:img|script|link|iframe)[^>]*(?:src|href)=["']http:\/\/[^"']*["']/gi;
        const mixedContentMatches = body.match(mixedContentRegex);

        if (mixedContentMatches && mixedContentMatches.length > 0) {
          findings.push({
            title: "Mixed Content Detected",
            severity: "medium",
            description: `Found ${mixedContentMatches.length} HTTP resources loaded on an HTTPS page. This can cause security warnings and broken content.`,
            recommendation: "Update all resource URLs to use HTTPS, or use protocol-relative URLs (//example.com/...).",
            affected_url: baseUrl,
            evidence: mixedContentMatches.slice(0, 3).join(", "),
          });
        }
      }

      // Form action check (looking for forms submitting to HTTP)
      const httpFormRegex = /<form[^>]*action=["']http:\/\/[^"']*["']/gi;
      const httpFormMatches = body.match(httpFormRegex);

      if (httpFormMatches && httpFormMatches.length > 0) {
        findings.push({
          title: "Insecure Form Submission",
          severity: "high",
          description: `Found ${httpFormMatches.length} forms submitting data over unencrypted HTTP connections.`,
          recommendation: "Update all form actions to use HTTPS to protect user data in transit.",
          affected_url: baseUrl,
          evidence: httpFormMatches.slice(0, 3).join(", "),
        });
      }

      // If no findings, add positive note
      if (findings.length === 0) {
        findings.push({
          title: "Crawler Scan Completed",
          severity: "info",
          description: "No sensitive paths, mixed content, or insecure forms detected.",
          recommendation: "Continue monitoring and perform regular security audits.",
          affected_url: baseUrl,
          evidence: "All checks passed",
        });
      }

      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      findings.push({
        title: "Crawler Scan Error",
        severity: "medium",
        description: `Failed to crawl target: ${error}`,
        recommendation: "Verify the target URL is accessible and returns valid HTML.",
        affected_url: target,
        evidence: error,
      });
    }

    return {
      scanner: "crawler",
      success,
      findings,
      error,
      duration_seconds: 0,
    };
  },
};
