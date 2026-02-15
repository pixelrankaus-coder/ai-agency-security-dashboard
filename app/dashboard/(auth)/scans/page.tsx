"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge, SeveritySummaryBar, ScanProgressBar, ScanProgressModal } from "@/components/security";
import { NewScanDialog } from "@/components/security/new-scan-dialog";
import { fetchScans, deleteScan } from "@/lib/api";
import { useDemoContext } from "@/lib/demo-context";
import type { Scan } from "@/types";
import { SCANNER_INFO } from "@/lib/scanner-info";
import { format } from "date-fns";
import { MoreVertical, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ScansPage() {
  const { isDemo, getMockScans } = useDemoContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "complete" | "active" | "error">("all");
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scanToDelete, setScanToDelete] = useState<Scan | null>(null);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const previousScansRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    loadScans();

    // Check for client filter query param
    const clientParam = searchParams.get("client");
    if (clientParam) {
      setClientFilter(clientParam);
    }
  }, [searchParams, isDemo]);

  // Detect completed scans and show notifications
  useEffect(() => {
    scans.forEach((scan) => {
      const previousStatus = previousScansRef.current.get(scan.id);

      // Check if scan just completed
      if (
        previousStatus &&
        (previousStatus === "scanning" || previousStatus === "analysing") &&
        scan.status === "complete"
      ) {
        // Show completion toast
        const hostname = new URL(scan.url).hostname;
        const criticalCount = scan.severity_counts?.critical || 0;
        const highCount = scan.severity_counts?.high || 0;

        const severity = criticalCount > 0 ? "critical" : highCount > 0 ? "high" : "success";
        const message = criticalCount > 0
          ? `${criticalCount} critical issue${criticalCount > 1 ? "s" : ""} found!`
          : highCount > 0
          ? `${highCount} high severity issue${highCount > 1 ? "s" : ""} found`
          : `${scan.total_findings} findings`;

        if (severity === "critical" || severity === "high") {
          toast.error(`Scan complete: ${hostname}`, {
            description: message,
            action: {
              label: "View Report",
              onClick: () => router.push(`/dashboard/scans/${scan.id}`),
            },
          });
        } else {
          toast.success(`Scan complete: ${hostname}`, {
            description: message,
            action: {
              label: "View Report",
              onClick: () => router.push(`/dashboard/scans/${scan.id}`),
            },
          });
        }
      }

      // Update previous status
      previousScansRef.current.set(scan.id, scan.status);
    });
  }, [scans, router]);

  // Auto-refresh when there are active scans (only in live mode, not demo)
  useEffect(() => {
    if (isDemo) return; // No polling in demo mode

    const hasActive = scans.some(
      (s) => s.status === "scanning" || s.status === "analysing"
    );
    if (!hasActive) return;

    const interval = setInterval(async () => {
      await loadScans();
    }, 5000); // 5 second interval

    return () => clearInterval(interval);
  }, [scans, isDemo]);

  async function loadScans() {
    if (isDemo) {
      // Use mock data in demo mode - no API calls, no console spam
      setScans(getMockScans());
      setLoading(false);
      return;
    }

    // Live mode - try API call
    try {
      const data = await fetchScans({ limit: 50 });
      setScans(data);
    } catch (error) {
      // Silent failure - demo context handles switching to demo mode
      setScans([]);
    } finally {
      setLoading(false);
    }
  }

  function handleScanAdded(newScan: Scan) {
    // Add new scan to the top of the list
    setScans([newScan, ...scans]);
  }

  function handleDeleteClick(scan: Scan, e: React.MouseEvent) {
    e.stopPropagation(); // Prevent row click navigation
    setScanToDelete(scan);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!scanToDelete) return;

    try {
      await deleteScan(scanToDelete.id);
      toast.success(`Scan for ${scanToDelete.url} has been deleted.`);
      await loadScans(); // Reload scans list
    } catch (error) {
      toast.error("Failed to delete scan. Please try again.");
    } finally {
      setDeleteDialogOpen(false);
      setScanToDelete(null);
    }
  }

  function handleScanStarted(scanId: string) {
    setActiveScanId(scanId);
    setProgressModalOpen(true);
  }

  function handleProgressModalClose() {
    setProgressModalOpen(false);
    setActiveScanId(null);
    loadScans(); // Reload scans to show updated status
  }

  const filteredScans = scans.filter((scan) => {
    // Apply status filter
    let statusMatch = true;
    if (filter === "complete") statusMatch = scan.status === "complete";
    else if (filter === "active")
      statusMatch = scan.status === "scanning" || scan.status === "analysing" || scan.status === "queued";
    else if (filter === "error") statusMatch = scan.status === "error";

    return statusMatch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Scans</h1>
          <p className="text-muted-foreground mt-1">
            Run and manage security scans for all client websites
            {clientFilter && (
              <>
                {" • "}
                <span className="font-medium">Client: {clientFilter}</span>
                <button
                  onClick={() => setClientFilter(null)}
                  className="ml-2 text-primary hover:underline"
                >
                  Clear filter
                </button>
              </>
            )}
          </p>
        </div>
        <NewScanDialog
          onScanCreated={loadScans}
          onScanAdded={handleScanAdded}
          onScanStarted={handleScanStarted}
          defaultUrl={searchParams.get("new") || undefined}
          defaultClient={searchParams.get("client") || undefined}
        />
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All ({scans.length})</TabsTrigger>
          <TabsTrigger value="complete">
            Complete (
            {scans.filter((s) => s.status === "complete").length})
          </TabsTrigger>
          <TabsTrigger value="active">
            In Progress (
            {
              scans.filter(
                (s) =>
                  s.status === "scanning" ||
                  s.status === "analysing" ||
                  s.status === "queued"
              ).length
            }
            )
          </TabsTrigger>
          <TabsTrigger value="error">
            Failed ({scans.filter((s) => s.status === "error").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {filter === "all" && "All Scans"}
                {filter === "complete" && "Completed Scans"}
                {filter === "active" && "Active Scans"}
                {filter === "error" && "Failed Scans"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scanners</TableHead>
                      <TableHead>Findings</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredScans.map((scan) => {
                    const duration = scan.completed_at
                      ? Math.round(
                          (new Date(scan.completed_at).getTime() -
                            new Date(scan.created_at).getTime()) /
                            1000
                        )
                      : null;

                    return (
                      <TableRow
                        key={scan.id}
                        className="cursor-pointer"
                        onClick={() =>
                          (window.location.href = `/dashboard/scans/${scan.id}`)
                        }
                      >
                        <TableCell className="font-medium">{scan.url}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <StatusBadge
                              status={scan.status}
                              progress={scan.progress}
                            />
                            {(scan.status === "scanning" ||
                              scan.status === "analysing") && (
                              <ScanProgressBar progress={scan.progress} />
                            )}
                            {scan.current_scanner && (
                              <p className="text-muted-foreground text-xs">
                                Running: {SCANNER_INFO[scan.current_scanner as keyof typeof SCANNER_INFO]?.label || scan.current_scanner}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {scan.scanners.slice(0, 3).map((scanner) => (
                              <Badge key={scanner} variant="outline">
                                {SCANNER_INFO[scanner as keyof typeof SCANNER_INFO]?.label || scanner}
                              </Badge>
                            ))}
                            {scan.scanners.length > 3 && (
                              <Badge variant="outline">
                                +{scan.scanners.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {scan.severity_counts ? (
                            <SeveritySummaryBar severities={scan.severity_counts} />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(scan.created_at), "dd MMM yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          {duration ? `${duration}s` : "—"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => handleDeleteClick(scan, e)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete scan
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredScans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        <div className="text-muted-foreground py-8">
                          No scans found.{" "}
                          {filter !== "all" && "Try changing the filter or "}
                          Click "New Scan" to get started.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete scan?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the scan for{" "}
              <span className="font-medium">{scanToDelete?.url}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScanProgressModal
        scanId={activeScanId}
        isOpen={progressModalOpen}
        onClose={handleProgressModalClose}
      />
    </div>
  );
}
