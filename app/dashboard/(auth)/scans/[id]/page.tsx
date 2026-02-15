"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  StatusBadge,
  SeveritySummaryBar,
  FindingRow,
  ScanProgressBar,
} from "@/components/security";
import { fetchScan } from "@/lib/api";
import { useDemoContext } from "@/lib/demo-context";
import type { ScanDetail } from "@/types";
import { SCANNER_INFO } from "@/lib/scanner-info";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronLeft, Download, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

export default function ScanDetailPage() {
  const { isDemo, getMockScans } = useDemoContext();
  const params = useParams();
  const id = params?.id as string;
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [markdownError, setMarkdownError] = useState(false);

  useEffect(() => {
    loadScan();
  }, [id, isDemo]);

  // Auto-refresh for active scans (only in live mode)
  useEffect(() => {
    if (isDemo) return; // No polling in demo mode
    if (!scan) return;
    if (scan.status !== "scanning" && scan.status !== "analysing") return;

    const interval = setInterval(async () => {
      await loadScan();
    }, 5000); // 5 second interval

    return () => clearInterval(interval);
  }, [scan, isDemo]);

  async function loadScan() {
    if (isDemo) {
      // Use mock data in demo mode
      const mockScans = getMockScans();
      const mockScan = mockScans.find((s) => s.id === id);
      if (mockScan) {
        // Convert to ScanDetail with additional fields
        setScan({
          ...mockScan,
          scanner_results: [],
          findings: [],
          ai_analysis: "This is a demo scan. In live mode, you would see real security analysis here.",
        } as ScanDetail);
      } else {
        setScan(null);
      }
      setLoading(false);
      return;
    }

    // Live mode - try API call
    try {
      const data = await fetchScan(id);
      setScan(data);
    } catch (error) {
      // Silent failure - demo context handles switching to demo mode
      setScan(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Scan not found</h2>
          <p className="text-muted-foreground mt-2">
            The scan you're looking for doesn't exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/scans">Back to Scans</Link>
          </Button>
        </div>
      </div>
    );
  }

  const duration = scan.completed_at
    ? Math.round(
        (new Date(scan.completed_at).getTime() -
          new Date(scan.created_at).getTime()) /
          1000
      )
    : null;

  const worstSeverity = scan.severity_counts
    ? (["critical", "high", "medium", "low", "info"] as const).find(
        (severity) => (scan.severity_counts[severity] || 0) > 0
      ) || "info"
    : "info";

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Demo Mode - Using Sample Data
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Backend is unavailable. Showing sample data for demonstration.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/scans">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Scans
          </Link>
        </Button>
      </div>

      {/* Header Section */}
      <Card className="border-2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <StatusBadge status={scan.status} progress={scan.progress} />
                {scan.current_scanner && (
                  <Badge variant="outline">
                    Running:{" "}
                    {SCANNER_INFO[scan.current_scanner as keyof typeof SCANNER_INFO]?.label ||
                      scan.current_scanner}
                  </Badge>
                )}
              </div>

              <h1 className="break-all text-2xl font-bold lg:text-3xl">{scan.url}</h1>

              <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(new Date(scan.created_at), "dd MMM yyyy, HH:mm")}
                  </span>
                </div>
                {duration && <span>Duration: {duration}s</span>}
                {scan.scanners && (
                  <span>{scan.scanners.length} scanners</span>
                )}
              </div>

              {(scan.status === "scanning" || scan.status === "analysing") && (
                <ScanProgressBar progress={scan.progress} />
              )}
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              {/* Score Circle */}
              {scan.total_findings !== undefined && (
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 ${
                      worstSeverity === "critical"
                        ? "border-red-600 bg-red-50 text-red-600"
                        : worstSeverity === "high"
                          ? "border-orange-600 bg-orange-50 text-orange-600"
                          : worstSeverity === "medium"
                            ? "border-yellow-600 bg-yellow-50 text-yellow-600"
                            : "border-blue-600 bg-blue-50 text-blue-600"
                    }`}
                  >
                    <div className="text-2xl font-bold">
                      {scan.total_findings}
                    </div>
                    <div className="text-xs">findings</div>
                  </div>
                </div>
              )}

              {scan.severity_counts && (
                <SeveritySummaryBar severities={scan.severity_counts} />
              )}

              {scan.report_url && (
                <Button
                  onClick={() => {
                    if (isDemo) {
                      toast.info("Report download available when backend is connected");
                    } else {
                      window.open(scan.report_url, "_blank");
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Section */}
      {scan.analysis && (
        <Card>
          <CardHeader>
            <CardTitle>AI Security Analysis</CardTitle>
            <p className="text-muted-foreground text-sm">
              Plain-English summary of findings and recommendations
            </p>
          </CardHeader>
          <CardContent>
            {markdownError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>Error rendering analysis.</strong> The raw content is shown below:
                <pre className="mt-2 whitespace-pre-wrap">{scan.analysis}</pre>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {scan.analysis}
                </ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scanner Results Section */}
      {scan.results && scan.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scanner Results</CardTitle>
            <p className="text-muted-foreground text-sm">
              Detailed findings from each security scanner
            </p>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {scan.results.map((result, idx) => {
                const scannerInfo =
                  SCANNER_INFO[result.scanner as keyof typeof SCANNER_INFO];

                return (
                  <AccordionItem key={idx} value={`scanner-${idx}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-1 items-center justify-between pr-4">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">
                            {scannerInfo?.label || result.scanner}
                          </span>
                          {result.success ? (
                            <Badge
                              variant="outline"
                              className="border-green-200 bg-green-50 text-green-700"
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Success
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-red-200 bg-red-50 text-red-700"
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Failed
                            </Badge>
                          )}
                          <span className="text-muted-foreground text-sm">
                            {result.findings.length} findings
                          </span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {result.duration_seconds.toFixed(1)}s
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-3">
                        {result.error && (
                          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                            <strong>Error:</strong> {result.error}
                          </div>
                        )}
                        {result.findings.length > 0 ? (
                          result.findings.map((finding, fidx) => (
                            <FindingRow key={fidx} finding={finding} />
                          ))
                        ) : (
                          <div className="flex items-center justify-center gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                            <CheckCircle2 className="h-4 w-4" />
                            No issues found - this scanner completed successfully
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
