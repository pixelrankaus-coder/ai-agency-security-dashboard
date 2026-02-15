// lib/ai/analyse.ts
import type { ScanResult } from "../scanners/types";
import type { Finding } from "@/types";

const SYSTEM_PROMPT = `You are a senior security analyst writing a comprehensive security assessment report. Your audience is a non-technical website owner who needs to understand:
- What security issues were found
- How serious each issue is
- What they should do about it (in plain English)

Write your report in markdown format with these sections:

## Executive Summary
A 2-3 sentence overview of the security posture. Be direct and clear about the level of risk.

## Critical Findings (if any)
List any critical severity issues that need immediate attention. Explain what each issue means in simple terms and what action to take.

## High Priority Findings (if any)
List high severity issues that should be addressed soon. Explain impact and remediation.

## Medium Priority Findings (if any)
List medium severity issues that should be addressed during regular maintenance.

## Low Priority & Informational
Briefly mention low severity and informational findings.

## Recommendations
Provide 3-5 prioritized action items, starting with the most urgent.

## Next Steps
Suggest what to do next (e.g., schedule fixes, monitor specific areas, run follow-up scans).

Keep language clear, avoid jargon, and be specific in recommendations. If there are no serious findings, congratulate them but remind them to stay vigilant.`;

export async function analyseWithAI(
  target: string,
  results: ScanResult[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // If no API key, return structured fallback
  if (!apiKey || apiKey.trim() === "" || apiKey.startsWith("sk-ant-your-key")) {
    return generateFallbackAnalysis(target, results);
  }

  try {
    // Prepare scan data for AI
    const scanData = results.map(r => ({
      scanner: r.scanner,
      success: r.success,
      error: r.error,
      findings: r.findings,
      duration: r.duration_seconds,
    }));

    const userMessage = `Analyze this security scan for ${target}:\n\n${JSON.stringify(scanData, null, 2)}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      return generateFallbackAnalysis(target, results);
    }

    const data = await response.json();
    const analysis = data.content?.[0]?.text || "";

    if (!analysis) {
      return generateFallbackAnalysis(target, results);
    }

    return analysis;
  } catch (err) {
    console.error("AI analysis error:", err);
    return generateFallbackAnalysis(target, results);
  }
}

function generateFallbackAnalysis(target: string, results: ScanResult[]): string {
  const allFindings: Finding[] = results.flatMap(r => r.findings);

  const criticalFindings = allFindings.filter(f => f.severity === "critical");
  const highFindings = allFindings.filter(f => f.severity === "high");
  const mediumFindings = allFindings.filter(f => f.severity === "medium");
  const lowFindings = allFindings.filter(f => f.severity === "low");
  const infoFindings = allFindings.filter(f => f.severity === "info");

  let report = `# Security Scan Report for ${target}\n\n`;
  report += `*Generated on ${new Date().toISOString().split("T")[0]}*\n\n`;
  report += `---\n\n`;

  // Executive Summary
  report += `## Executive Summary\n\n`;
  if (criticalFindings.length > 0) {
    report += `⚠️ **Critical issues detected!** This website has ${criticalFindings.length} critical security ${criticalFindings.length === 1 ? "issue" : "issues"} that require immediate attention. `;
  } else if (highFindings.length > 0) {
    report += `⚠️ This website has ${highFindings.length} high-priority security ${highFindings.length === 1 ? "issue" : "issues"} that should be addressed soon. `;
  } else if (mediumFindings.length > 0) {
    report += `✓ No critical or high-priority issues found. However, there ${mediumFindings.length === 1 ? "is" : "are"} ${mediumFindings.length} medium-priority ${mediumFindings.length === 1 ? "item" : "items"} to address. `;
  } else {
    report += `✓ Good news! No critical, high, or medium-priority security issues detected. `;
  }
  report += `This scan examined ${allFindings.length} security aspects across ${results.length} different scanning tools.\n\n`;

  // Critical Findings
  if (criticalFindings.length > 0) {
    report += `## 🔴 Critical Findings\n\n`;
    report += `**Immediate action required!**\n\n`;
    criticalFindings.forEach((finding, idx) => {
      report += `### ${idx + 1}. ${finding.title}\n\n`;
      report += `**Description:** ${finding.description}\n\n`;
      report += `**What to do:** ${finding.recommendation}\n\n`;
      if (finding.affected_url) {
        report += `**Affected:** ${finding.affected_url}\n\n`;
      }
    });
  }

  // High Priority Findings
  if (highFindings.length > 0) {
    report += `## 🟠 High Priority Findings\n\n`;
    report += `**Address these soon to improve security posture.**\n\n`;
    highFindings.forEach((finding, idx) => {
      report += `### ${idx + 1}. ${finding.title}\n\n`;
      report += `${finding.description}\n\n`;
      report += `**Recommendation:** ${finding.recommendation}\n\n`;
    });
  }

  // Medium Priority Findings
  if (mediumFindings.length > 0) {
    report += `## 🟡 Medium Priority Findings\n\n`;
    mediumFindings.slice(0, 10).forEach((finding, idx) => {
      report += `- **${finding.title}**: ${finding.recommendation}\n`;
    });
    if (mediumFindings.length > 10) {
      report += `\n*... and ${mediumFindings.length - 10} more medium-priority items.*\n`;
    }
    report += `\n`;
  }

  // Low & Info
  if (lowFindings.length > 0 || infoFindings.length > 0) {
    report += `## ℹ️ Low Priority & Informational\n\n`;
    report += `Found ${lowFindings.length} low-priority and ${infoFindings.length} informational items. These are noted for awareness but don't require urgent action.\n\n`;
  }

  // Recommendations
  report += `## Recommendations\n\n`;
  if (criticalFindings.length > 0) {
    report += `1. **Immediately address all critical findings** listed above.\n`;
    report += `2. Schedule time to resolve high-priority issues within the next week.\n`;
  } else if (highFindings.length > 0) {
    report += `1. Address high-priority issues within the next 1-2 weeks.\n`;
    report += `2. Review and fix medium-priority items during regular maintenance.\n`;
  } else if (mediumFindings.length > 0) {
    report += `1. Review and address medium-priority items during your next maintenance window.\n`;
  } else {
    report += `1. Continue monitoring your site's security regularly.\n`;
    report += `2. Keep all software, plugins, and themes up to date.\n`;
  }
  report += `${criticalFindings.length + highFindings.length > 0 ? "3" : "2"}. Run follow-up scans after making changes to verify fixes.\n`;
  report += `${criticalFindings.length + highFindings.length > 0 ? "4" : "3"}. Consider implementing a web application firewall (WAF) for ongoing protection.\n\n`;

  // Next Steps
  report += `## Next Steps\n\n`;
  if (criticalFindings.length > 0 || highFindings.length > 0) {
    report += `We recommend prioritizing the critical and high-priority findings first. Once addressed, run another scan to verify the issues are resolved. If you need assistance, consult with a web security professional.\n\n`;
  } else {
    report += `Your site is in good shape! Continue regular scans (monthly or quarterly) to catch new issues early. Stay informed about security updates for your platform and plugins.\n\n`;
  }

  report += `---\n\n`;
  report += `*This report was generated automatically. For AI-powered analysis with detailed explanations, add your ANTHROPIC_API_KEY to .env.local.*`;

  return report;
}
