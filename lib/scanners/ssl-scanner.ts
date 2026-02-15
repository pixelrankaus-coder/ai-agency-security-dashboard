// lib/scanners/ssl-scanner.ts
import * as tls from "tls";
import type { Finding } from "@/types";
import type { ScanResult, Scanner } from "./types";

export const sslScanner: Scanner = {
  async scan(target: string): Promise<ScanResult> {
    const findings: Finding[] = [];
    let success = false;
    let error = "";

    try {
      // Extract hostname from URL if needed
      let hostname = target;
      try {
        const url = new URL(target.startsWith("http") ? target : `https://${target}`);
        hostname = url.hostname;
      } catch {
        hostname = target.replace(/^https?:\/\//, "").split("/")[0];
      }

      // Connect to target on port 443
      const socket = await new Promise<tls.TLSSocket>((resolve, reject) => {
        const s = tls.connect(
          { host: hostname, port: 443, servername: hostname, rejectUnauthorized: false },
          () => resolve(s)
        );
        s.on("error", reject);
        s.setTimeout(10000);
        s.on("timeout", () => {
          s.destroy();
          reject(new Error("Connection timeout"));
        });
      });

      const cert = socket.getPeerCertificate(true);
      const protocol = socket.getProtocol();

      socket.end();

      if (!cert || Object.keys(cert).length === 0) {
        throw new Error("No certificate found");
      }

      // Check certificate expiry
      const validTo = new Date(cert.valid_to);
      const now = new Date();
      const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        findings.push({
          title: "SSL Certificate Expired",
          severity: "critical",
          description: `The SSL certificate expired ${Math.abs(daysUntilExpiry)} days ago on ${validTo.toISOString().split("T")[0]}.`,
          recommendation: "Renew the SSL certificate immediately to avoid browser warnings and security risks.",
          affected_url: target,
          evidence: `Expiry date: ${cert.valid_to}`,
        });
      } else if (daysUntilExpiry <= 30) {
        findings.push({
          title: "SSL Certificate Expiring Soon",
          severity: "high",
          description: `The SSL certificate will expire in ${daysUntilExpiry} days on ${validTo.toISOString().split("T")[0]}.`,
          recommendation: "Renew the SSL certificate before it expires to avoid service disruption.",
          affected_url: target,
          evidence: `Expiry date: ${cert.valid_to}`,
        });
      } else {
        findings.push({
          title: "SSL Certificate Valid",
          severity: "info",
          description: `The SSL certificate is valid for ${daysUntilExpiry} more days (expires ${validTo.toISOString().split("T")[0]}).`,
          recommendation: "No action needed.",
          affected_url: target,
          evidence: `Expiry date: ${cert.valid_to}`,
        });
      }

      // Check TLS version
      if (protocol) {
        if (protocol === "TLSv1" || protocol === "TLSv1.1") {
          findings.push({
            title: "Outdated TLS Version",
            severity: "high",
            description: `The server is using ${protocol}, which is deprecated and considered insecure.`,
            recommendation: "Upgrade to TLS 1.2 or TLS 1.3.",
            affected_url: target,
            evidence: `Protocol: ${protocol}`,
          });
        } else {
          findings.push({
            title: "TLS Version Check",
            severity: "info",
            description: `The server is using ${protocol}, which is secure.`,
            recommendation: "No action needed.",
            affected_url: target,
            evidence: `Protocol: ${protocol}`,
          });
        }
      }

      // Check if certificate hostname matches target
      const certSubject = cert.subject?.CN || "";
      const certAltNames = cert.subjectaltname
        ? cert.subjectaltname.split(",").map((s: string) => s.trim().replace("DNS:", ""))
        : [];

      const hostnameMatch = certSubject === hostname || certAltNames.includes(hostname);

      if (!hostnameMatch) {
        findings.push({
          title: "SSL Certificate Hostname Mismatch",
          severity: "high",
          description: `The certificate is issued for '${certSubject}' but the site is accessed via '${hostname}'.`,
          recommendation: "Obtain a certificate that matches the domain name or add it to the Subject Alternative Names (SAN).",
          affected_url: target,
          evidence: `Certificate CN: ${certSubject}, SANs: ${certAltNames.join(", ")}`,
        });
      }

      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);

      // Common SSL errors
      if (error.includes("ECONNREFUSED") || error.includes("ENOTFOUND")) {
        findings.push({
          title: "SSL Connection Failed",
          severity: "critical",
          description: "Unable to establish SSL connection to the target. The server may be down or not accepting HTTPS connections on port 443.",
          recommendation: "Verify the server is running and accessible, and that port 443 is open.",
          affected_url: target,
          evidence: error,
        });
      } else if (error.includes("CERT_HAS_EXPIRED")) {
        findings.push({
          title: "SSL Certificate Expired",
          severity: "critical",
          description: "The SSL certificate has expired.",
          recommendation: "Renew the SSL certificate immediately.",
          affected_url: target,
          evidence: error,
        });
      } else {
        findings.push({
          title: "SSL Scan Error",
          severity: "medium",
          description: `SSL scan encountered an error: ${error}`,
          recommendation: "Investigate the SSL configuration of the target server.",
          affected_url: target,
          evidence: error,
        });
      }
    }

    return {
      scanner: "ssl",
      success,
      findings,
      error,
      duration_seconds: 0,
    };
  },
};
