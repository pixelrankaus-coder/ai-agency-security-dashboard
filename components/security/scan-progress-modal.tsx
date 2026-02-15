"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  Minimize2,
  Maximize2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { SCANNER_INFO } from "@/lib/scanner-info";
import { SeverityBadge } from "./severity-badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { SeverityLevel } from "@/types";

interface ScanProgressModalProps {
  scanId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ScannerResult {
  scanner: string;
  status: "waiting" | "running" | "complete" | "failed";
  findings: Array<{
    id?: string;
    severity: SeverityLevel;
    description: string;
    timestamp?: string;
  }>;
  error?: string;
  duration?: number;
  grade?: string;
}

interface ScanDetail {
  id: string;
  url: string;
  client_name?: string;
  status: "queued" | "scanning" | "analysing" | "complete" | "error";
  created_at: string;
  completed_at?: string;
  progress: number;
  current_scanner?: string;
  scanners: string[];
  results?: ScannerResult[];
  summary?: {
    total_findings: number;
    severities: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    };
  };
  error?: string;
}

export function ScanProgressModal({
  scanId,
  isOpen,
  onClose,
}: ScanProgressModalProps) {
  const router = useRouter();
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [shownFindingIds, setShownFindingIds] = useState<Set<string>>(new Set());
  const [allFindings, setAllFindings] = useState<Array<{
    id: string;
    timestamp: string;
    severity: SeverityLevel;
    description: string;
    isNew: boolean;
  }>>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasPlayedSound = useRef(false);

  // Poll for scan updates every 2 seconds
  useEffect(() => {
    if (!isOpen || !scanId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/scans/${scanId}`);
        if (!res.ok) return;
        const data: ScanDetail = await res.json();
        setScan(data);

        // Extract all findings from results
        if (data.results) {
          const newFindings: typeof allFindings = [];
          data.results.forEach((result) => {
            if (result.findings) {
              result.findings.forEach((finding, idx) => {
                const findingId = finding.id || `${result.scanner}-${idx}-${finding.description}`;
                const isNew = !shownFindingIds.has(findingId);

                newFindings.push({
                  id: findingId,
                  timestamp: finding.timestamp || new Date().toISOString(),
                  severity: finding.severity,
                  description: finding.description,
                  isNew,
                });

                if (isNew) {
                  setShownFindingIds(prev => new Set([...prev, findingId]));
                }
              });
            }
          });

          // Sort by timestamp descending (newest first)
          newFindings.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          setAllFindings(newFindings);
        }

        // Play sound when complete
        if (
          (data.status === "complete" || data.status === "error") &&
          !hasPlayedSound.current &&
          isOpen &&
          !isMinimized
        ) {
          playCompletionSound();
          hasPlayedSound.current = true;
        }
      } catch (error) {
        console.error("Failed to poll scan:", error);
      }
    };

    // Poll immediately and then every 2 seconds
    poll();
    const interval = setInterval(poll, 2000);

    return () => clearInterval(interval);
  }, [isOpen, scanId, isMinimized, shownFindingIds]);

  // Auto-scroll findings feed to bottom when new findings appear
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = 0; // Scroll to top (newest first)
      }
    }
  }, [allFindings.length]);

  // Reset state when modal opens with new scan
  useEffect(() => {
    if (isOpen && scanId) {
      setShownFindingIds(new Set());
      setAllFindings([]);
      hasPlayedSound.current = false;
      setIsMinimized(false);
    }
  }, [isOpen, scanId]);

  function playCompletionSound() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.1;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Silently fail if audio not supported
    }
  }

  function getElapsedSeconds(): number {
    if (!scan) return 0;
    const start = new Date(scan.created_at).getTime();
    const end = scan.completed_at
      ? new Date(scan.completed_at).getTime()
      : Date.now();
    return Math.floor((end - start) / 1000);
  }

  function formatElapsed(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function getScannerStatus(scannerName: string): ScannerResult["status"] {
    if (!scan?.results) {
      return scan?.current_scanner === scannerName ? "running" : "waiting";
    }

    const result = scan.results.find(r => r.scanner === scannerName);
    if (result) {
      return result.status;
    }

    if (scan.current_scanner === scannerName) {
      return "running";
    }

    // Check if this scanner comes before the current one
    const currentIndex = scan.scanners.indexOf(scan.current_scanner || "");
    const thisIndex = scan.scanners.indexOf(scannerName);

    return thisIndex < currentIndex ? "complete" : "waiting";
  }

  function getScannerResult(scannerName: string): ScannerResult | undefined {
    return scan?.results?.find(r => r.scanner === scannerName);
  }

  function getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case "critical": return "border-red-500 bg-red-500/10";
      case "high": return "border-orange-500 bg-orange-500/10";
      case "medium": return "border-yellow-500 bg-yellow-500/10";
      case "low": return "border-blue-500 bg-blue-500/10";
      default: return "border-gray-500 bg-gray-500/10";
    }
  }

  function getWorstSeverity(findings: ScannerResult["findings"]): string {
    const order = ["critical", "high", "medium", "low", "info"];
    for (const sev of order) {
      if (findings.some(f => f.severity.toLowerCase() === sev)) {
        return sev;
      }
    }
    return "info";
  }

  function handleViewReport() {
    router.push(`/dashboard/scans/${scanId}`);
    onClose();
  }

  if (!scan) return null;

  const elapsed = getElapsedSeconds();
  const isComplete = scan.status === "complete" || scan.status === "error";
  const isError = scan.status === "error";

  // Minimized widget
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 shadow-lg border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className={cn(
                  "h-4 w-4",
                  isComplete ? "text-green-500" : "animate-spin text-blue-500"
                )} />
                <span className="font-medium text-sm">
                  {isComplete ? "Scan Complete" : "Scanning..."}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsMinimized(false)}
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground truncate">{scan.url}</p>
              <Progress value={scan.progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {scan.progress}% • {formatElapsed(elapsed)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl flex items-center gap-2">
                {isComplete ? (
                  isError ? (
                    <XCircle className="h-6 w-6 text-red-500" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  )
                ) : (
                  <Shield className="h-6 w-6 text-blue-500" />
                )}
                {isComplete
                  ? isError
                    ? "Scan Failed"
                    : "Scan Complete"
                  : `Scanning ${scan.url}`}
              </DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {scan.client_name && (
                  <>
                    <span>Client: {scan.client_name}</span>
                    <span>•</span>
                  </>
                )}
                <span>Started {format(new Date(scan.created_at), "h:mm a")}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Elapsed: {formatElapsed(elapsed)}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Progress
              value={scan.progress}
              className={cn(
                "h-3",
                isComplete && !isError && "bg-green-100",
                isError && "bg-red-100"
              )}
            />
            {!isComplete && scan.current_scanner && (
              <p className="text-sm text-muted-foreground">
                Running: {SCANNER_INFO[scan.current_scanner as keyof typeof SCANNER_INFO]?.label || scan.current_scanner} (
                {scan.scanners.indexOf(scan.current_scanner) + 1} of {scan.scanners.length})
              </p>
            )}
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {/* Scanner Status Cards */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Scanner Progress</h3>
                {scan.scanners.map((scannerName) => {
                  const status = getScannerStatus(scannerName);
                  const result = getScannerResult(scannerName);
                  const info = SCANNER_INFO[scannerName as keyof typeof SCANNER_INFO];
                  const findingsCount = result?.findings?.length || 0;
                  const worstSeverity = result?.findings ? getWorstSeverity(result.findings) : "";

                  return (
                    <Card
                      key={scannerName}
                      className={cn(
                        "border-l-4 transition-all",
                        status === "running" && "border-l-blue-500 bg-blue-500/5",
                        status === "complete" && worstSeverity && getSeverityColor(worstSeverity),
                        status === "complete" && !worstSeverity && "border-l-green-500 bg-green-500/5",
                        status === "failed" && "border-l-red-500 bg-red-500/5",
                        status === "waiting" && "border-l-gray-300"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1">
                              {status === "waiting" && <Circle className="h-4 w-4 text-muted-foreground" />}
                              {status === "running" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                              {status === "complete" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              {status === "failed" && <XCircle className="h-4 w-4 text-red-500" />}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{info?.label || scannerName}</h4>
                                {result?.grade && (
                                  <Badge variant="outline">Grade: {result.grade}</Badge>
                                )}
                                {status === "complete" && findingsCount > 0 && (
                                  <Badge variant="secondary">{findingsCount} findings</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{info?.description}</p>
                              {status === "running" && (
                                <div className="mt-2">
                                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 animate-pulse" style={{ width: "60%" }} />
                                  </div>
                                </div>
                              )}
                              {status === "failed" && result?.error && (
                                <p className="text-xs text-red-600 mt-1">{result.error}</p>
                              )}
                              {status === "complete" && result?.findings && result.findings.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {result.findings.slice(0, 3).map((finding, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-xs">
                                      <SeverityBadge severity={finding.severity} size="sm" />
                                      <span className="text-muted-foreground">{finding.description}</span>
                                    </div>
                                  ))}
                                  {result.findings.length > 3 && (
                                    <p className="text-xs text-muted-foreground pl-6">
                                      +{result.findings.length - 3} more
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {status === "complete" && result?.duration && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {result.duration.toFixed(1)}s
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Live Findings Feed */}
              {allFindings.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Live Findings</h3>
                    <p className="text-xs text-muted-foreground">
                      {allFindings.length} findings ({scan.summary?.severities.critical || 0} critical,{" "}
                      {scan.summary?.severities.high || 0} high, {scan.summary?.severities.medium || 0} medium)
                    </p>
                  </div>
                  <Card>
                    <CardContent className="p-4">
                      <div ref={scrollAreaRef}>
                        <ScrollArea className="h-48">
                          <div className="space-y-2">
                            {allFindings.map((finding, idx) => (
                              <div
                                key={finding.id}
                                className={cn(
                                  "flex items-start gap-3 text-sm p-2 rounded-md transition-all duration-500",
                                  finding.isNew && (finding.severity.toLowerCase() === "critical" || finding.severity.toLowerCase() === "high")
                                    && "bg-red-500/10 animate-pulse"
                                )}
                                style={{
                                  animation: finding.isNew ? "fadeIn 0.3s ease-in" : "none"
                                }}
                              >
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {format(new Date(finding.timestamp), "HH:mm:ss")}
                                </span>
                                <SeverityBadge severity={finding.severity} size="sm" />
                                <span className="flex-1">{finding.description}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Completion Summary */}
              {isComplete && !isError && scan.summary && (
                <div className="space-y-3">
                  <Separator />
                  <Card className="border-green-500 bg-green-500/5">
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                        <div>
                          <h3 className="text-xl font-bold">Scan Complete</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Total Findings: {scan.summary.total_findings}
                          </p>
                        </div>

                        <div className="flex items-center justify-center gap-4 flex-wrap">
                          {scan.summary.severities.critical > 0 && (
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-500">{scan.summary.severities.critical}</div>
                              <div className="text-xs text-muted-foreground">Critical</div>
                            </div>
                          )}
                          {scan.summary.severities.high > 0 && (
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-500">{scan.summary.severities.high}</div>
                              <div className="text-xs text-muted-foreground">High</div>
                            </div>
                          )}
                          {scan.summary.severities.medium > 0 && (
                            <div className="text-center">
                              <div className="text-2xl font-bold text-yellow-500">{scan.summary.severities.medium}</div>
                              <div className="text-xs text-muted-foreground">Medium</div>
                            </div>
                          )}
                          {scan.summary.severities.low > 0 && (
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-500">{scan.summary.severities.low}</div>
                              <div className="text-xs text-muted-foreground">Low</div>
                            </div>
                          )}
                          {scan.summary.severities.info > 0 && (
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-500">{scan.summary.severities.info}</div>
                              <div className="text-xs text-muted-foreground">Info</div>
                            </div>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          <p>Duration: {formatElapsed(elapsed)}</p>
                          <p>Scanners: {scan.scanners.length}/{scan.scanners.length} successful</p>
                        </div>

                        <div className="flex gap-3 justify-center pt-2">
                          <Button onClick={handleViewReport} className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            View Full Report
                          </Button>
                          <Button variant="outline" onClick={onClose}>
                            Close
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Error Summary */}
              {isError && (
                <div className="space-y-3">
                  <Separator />
                  <Card className="border-red-500 bg-red-500/5">
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                        <div>
                          <h3 className="text-xl font-bold">Scan Failed</h3>
                          {scan.error && (
                            <p className="text-sm text-muted-foreground mt-2">{scan.error}</p>
                          )}
                        </div>

                        <div className="flex gap-3 justify-center pt-2">
                          <Button variant="outline" onClick={onClose}>
                            Close
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
