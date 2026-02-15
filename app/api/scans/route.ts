// app/api/scans/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getScans,
  getScan,
  createScan,
  updateScan,
  getSite,
  updateSite,
  getOrCreateDefaultCompany,
  createFindings,
} from "@/lib/db";
import { runScanners } from "@/lib/scanners";
import { analyseWithAI } from "@/lib/ai/analyse";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const companyId = searchParams.get("company_id") || undefined;
    const siteId = searchParams.get("site_id") || undefined;

    const scans = await getScans(companyId, siteId, limit);
    return NextResponse.json(scans);
  } catch (error) {
    console.error("Error fetching scans:", error);
    return NextResponse.json(
      { error: "Failed to fetch scans" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { site_id, scanners, skip_ai } = body;

    if (!site_id) {
      return NextResponse.json(
        { error: "site_id is required" },
        { status: 400 }
      );
    }

    // Get site to verify it exists and get company_id
    const site = await getSite(site_id);
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const selectedScanners =
      scanners && scanners.length > 0
        ? scanners
        : site.default_scanners || ["observatory", "ssl", "crawler"];

    // Create scan record
    const scan = await createScan({
      site_id: site.id,
      company_id: site.company_id,
      url: site.url,
      scanners: selectedScanners,
      status: "scanning",
      progress: 0,
      current_scanner: null,
      results: [],
      analysis: null,
      total_findings: 0,
      severity_counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      grade: null,
      score: null,
      report_url: null,
      error: null,
      duration_seconds: null,
    });

    // Start scanning in the background (fire and forget)
    runScanInBackground(scan.id, site.url, selectedScanners, skip_ai || false);

    // Return immediately
    return NextResponse.json(
      { id: scan.id, status: "scanning" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating scan:", err);
    return NextResponse.json(
      { error: "Failed to create scan" },
      { status: 500 }
    );
  }
}

// Background scan runner
async function runScanInBackground(
  scanId: string,
  url: string,
  scannerNames: string[],
  skipAI: boolean
) {
  const startTime = Date.now();

  try {
    // Run scanners sequentially, updating progress
    const scanResults = await runScanners(url, scannerNames);

    // Get scan to update
    let scan = await getScan(scanId);
    if (!scan) return;

    // Transform ScanResult[] to ScannerResult[] - ensure type field is present
    const results = scanResults.map((result) => ({
      ...result,
      findings: result.findings.map((finding) => ({
        type: finding.type || "general",
        severity: finding.severity,
        description: finding.description,
        recommendation: finding.recommendation,
        url: finding.affected_url,
        path: finding.path,
        header: finding.header,
        value: finding.value,
        technologies: finding.technologies,
        metadata: finding.evidence
          ? { ...finding, evidence: finding.evidence }
          : finding,
      })),
    }));

    // Update with results
    await updateScan(scanId, {
      results,
      progress: 90,
      status: "analysing",
      current_scanner: null,
    });

    // Calculate summary
    const allFindings = scanResults.flatMap((r) => r.findings);
    const severity_counts = {
      critical: allFindings.filter((f) => f.severity === "critical").length,
      high: allFindings.filter((f) => f.severity === "high").length,
      medium: allFindings.filter((f) => f.severity === "medium").length,
      low: allFindings.filter((f) => f.severity === "low").length,
      info: allFindings.filter((f) => f.severity === "info").length,
    };

    // Extract grade/score from observatory scanner if available
    const observatoryResult = results.find((r) => r.scanner === "observatory");
    const grade = observatoryResult?.grade || null;
    const score = observatoryResult?.score || null;

    // Run AI analysis if not skipped
    let analysis: string | null = null;
    if (!skipAI) {
      try {
        analysis = await analyseWithAI(url, results);
      } catch (err) {
        console.error("AI analysis failed:", err);
        analysis = "AI analysis failed. See results below for details.";
      }
    }

    const duration_seconds = (Date.now() - startTime) / 1000;

    // Mark as complete
    scan = await updateScan(scanId, {
      status: "complete",
      progress: 100,
      completed_at: new Date().toISOString(),
      total_findings: allFindings.length,
      severity_counts,
      grade,
      score,
      analysis,
      duration_seconds,
    });

    // Create individual finding records for advanced querying
    const findingRecords = allFindings.map((finding) => ({
      scan_id: scanId,
      site_id: scan.site_id,
      company_id: scan.company_id,
      scanner: results.find((r) => r.findings.includes(finding))?.scanner || "",
      severity: finding.severity,
      type: finding.type || "unknown",
      description: finding.description,
      recommendation: finding.recommendation || null,
      metadata: finding.metadata || {},
      status: "open" as const,
    }));

    if (findingRecords.length > 0) {
      await createFindings(findingRecords);
    }

    // Update site's last_scan_* fields
    await updateSite(scan.site_id, {
      last_scan_id: scanId,
      last_scan_at: new Date().toISOString(),
      last_scan_grade: grade,
      last_scan_score: score,
      last_scan_findings: severity_counts,
    });
  } catch (err) {
    console.error("Scan error:", err);

    try {
      await updateScan(scanId, {
        status: "error",
        error: err instanceof Error ? err.message : String(err),
        completed_at: new Date().toISOString(),
        duration_seconds: (Date.now() - startTime) / 1000,
      });
    } catch (updateErr) {
      console.error("Failed to update scan with error:", updateErr);
    }
  }
}
