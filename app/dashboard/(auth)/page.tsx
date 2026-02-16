"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Zap, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, SeveritySummaryBar } from "@/components/security";
import { fetchScans, checkHealth } from "@/lib/api";
import type { Scan, HealthStatus } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    try {
      const [scansData, healthData] = await Promise.all([
        fetchScans({ limit: 10 }),
        checkHealth(),
      ]);
      setScans(scansData);
      setHealth(healthData);
    } catch (error) {
      setScans([]);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  // Calculate stats
  const totalScans = health?.total_scans || scans.length;
  const activeScans = scans.filter(
    (s) => s.status === "scanning" || s.status === "analysing"
  ).length;
  const totalFindings = scans.reduce(
    (sum, scan) => sum + (scan.total_findings || 0),
    0
  );
  const criticalIssues = scans.reduce(
    (sum, scan) => sum + (scan.severity_counts?.critical || 0),
    0
  );

  // Chart data
  const chartData = [
    {
      name: "Critical",
      count: scans.reduce(
        (sum, s) => sum + (s.severity_counts?.critical || 0),
        0
      ),
      fill: "#dc2626",
    },
    {
      name: "High",
      count: scans.reduce((sum, s) => sum + (s.severity_counts?.high || 0), 0),
      fill: "#ea580c",
    },
    {
      name: "Medium",
      count: scans.reduce(
        (sum, s) => sum + (s.severity_counts?.medium || 0),
        0
      ),
      fill: "#ca8a04",
    },
    {
      name: "Low",
      count: scans.reduce((sum, s) => sum + (s.severity_counts?.low || 0), 0),
      fill: "#2563eb",
    },
    {
      name: "Info",
      count: scans.reduce((sum, s) => sum + (s.severity_counts?.info || 0), 0),
      fill: "#6b7280",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor security scans across all client websites
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Shield className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScans}</div>
            <p className="text-muted-foreground text-xs">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Scans</CardTitle>
            <Zap
              className={`h-4 w-4 ${activeScans > 0 ? "animate-pulse text-blue-600" : "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeScans}</div>
            <p className="text-muted-foreground text-xs">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Findings</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFindings}</div>
            <p className="text-muted-foreground text-xs">Across all scans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <XCircle
              className={`h-4 w-4 ${criticalIssues > 0 ? "text-red-600" : "text-muted-foreground"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${criticalIssues > 0 ? "text-red-600" : ""}`}
            >
              {criticalIssues}
            </div>
            <p className="text-muted-foreground text-xs">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Security Overview Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Security Overview</CardTitle>
            <p className="text-muted-foreground text-sm">
              Findings by severity across all scans
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Scans */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
            <p className="text-muted-foreground text-sm">Latest security scans</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scans.slice(0, 5).map((scan) => (
                <Link
                  key={scan.id}
                  href={`/dashboard/scans/${scan.id}`}
                  className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{scan.url}</p>
                        <StatusBadge status={scan.status} progress={scan.progress} />
                      </div>
                      {scan.severity_counts && (
                        <div className="mt-2">
                          <SeveritySummaryBar severities={scan.severity_counts} />
                        </div>
                      )}
                    </div>
                    <div className="text-muted-foreground text-right text-xs">
                      {format(new Date(scan.created_at), "dd MMM yyyy")}
                    </div>
                  </div>
                </Link>
              ))}
              {scans.length === 0 && (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  No scans yet. Start your first scan from the Scans page.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Recent Scans Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Recent Scans</CardTitle>
            <Link
              href="/dashboard/scans"
              className="text-primary text-sm font-medium hover:underline"
            >
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Findings</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {scans.slice(0, 10).map((scan) => (
                <TableRow
                  key={scan.id}
                  className="cursor-pointer"
                  onClick={() => (window.location.href = `/dashboard/scans/${scan.id}`)}
                >
                  <TableCell className="font-medium">{scan.url}</TableCell>
                  <TableCell>
                    <StatusBadge status={scan.status} progress={scan.progress} />
                  </TableCell>
                  <TableCell>
                    {scan.severity_counts ? (
                      <SeveritySummaryBar severities={scan.severity_counts} />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(scan.created_at), "dd MMM yyyy")}</TableCell>
                </TableRow>
              ))}
              {scans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <div className="text-muted-foreground py-8">
                      No scans found. Get started by running your first security scan.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
