// lib/scanner-info.ts

export const SCANNER_INFO = {
  observatory: {
    label: "Mozilla Observatory",
    icon: "ShieldCheck",
    desc: "Security headers grade (A+ to F)",
    description: "Analyzes HTTP security headers using Mozilla's Observatory service",
  },
  ssl: {
    label: "SSL/TLS",
    icon: "Lock",
    desc: "Certificates & encryption",
    description: "Checks SSL certificate validity, expiry, and TLS version",
  },
  crawler: {
    label: "Site Crawler",
    icon: "Globe",
    desc: "Exposed files & tech detection",
    description: "Scans for exposed sensitive files and detects technologies",
  },
  safe_browsing: {
    label: "Safe Browsing",
    icon: "Search",
    desc: "Google malware & phishing detection",
    description: "Checks site against Google Safe Browsing database",
  },
} as const;
