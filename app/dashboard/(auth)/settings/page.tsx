"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { checkHealth } from "@/lib/api";
import { useDemoContext } from "@/lib/demo-context";
import { HealthStatus } from "@/types";
import { SCANNER_INFO } from "@/lib/scanner-info";
import {
  CheckCircle2,
  XCircle,
  Globe,
  Shield,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPage() {
  const { isDemo, retryBackend } = useDemoContext();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const [defaultScanners, setDefaultScanners] = useState<string[]>([
    "observatory",
    "ssl",
    "crawler",
  ]);

  useEffect(() => {
    checkConnection();

    // Load saved default scanners from localStorage
    const saved = localStorage.getItem("defaultScanners");
    if (saved) {
      try {
        setDefaultScanners(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load default scanners");
      }
    }
  }, []);

  async function checkConnection() {
    setChecking(true);
    try {
      // Retry backend connection (will update demo mode status)
      await retryBackend();

      // Then check health
      const data = await checkHealth();
      setHealth(data);
    } catch (error) {
      // Silent failure
      setHealth(null);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }

  function toggleScanner(scanner: string) {
    const updated = defaultScanners.includes(scanner)
      ? defaultScanners.filter((s) => s !== scanner)
      : [...defaultScanners, scanner];

    setDefaultScanners(updated);
    localStorage.setItem("defaultScanners", JSON.stringify(updated));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Demo Mode - Backend Unavailable
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Click the refresh button below to retry connecting to the backend.
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure scanner status and preferences
        </p>
      </div>

      {/* Scanner Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Scanner Status
              </CardTitle>
              <CardDescription>
                Built-in API and scanner availability
              </CardDescription>
            </div>
            <Button onClick={checkConnection} disabled={checking} variant="outline" size="sm">
              {checking ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {isDemo ? (
                <>
                  <XCircle className="h-5 w-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-600">Demo Mode Active</p>
                    <p className="text-muted-foreground text-xs">
                      Backend API is unavailable. Using sample data for demonstration.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-600">API Connected</p>
                    <p className="text-muted-foreground text-xs">
                      Backend API is running and responsive
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* AI Analysis Status */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {process.env.NEXT_PUBLIC_HAS_ANTHROPIC_KEY ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-600">AI Analysis: Enabled</p>
                    <p className="text-muted-foreground text-xs">
                      Using Claude 4.5 Sonnet for AI-powered security reports
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-600">AI Analysis: Not Configured</p>
                    <p className="text-muted-foreground text-xs">
                      Add ANTHROPIC_API_KEY to .env.local for AI-powered analysis
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Scanner Status */}
          {health && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Available Scanners</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(health.scanners).map(([scanner, available]) => {
                  const info = SCANNER_INFO[scanner as keyof typeof SCANNER_INFO];
                  return (
                    <div
                      key={scanner}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      {available ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {info?.label || scanner}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {info?.desc || "Security scanner"}
                        </p>
                      </div>
                      <Badge variant={available ? "default" : "secondary"}>
                        {available ? "Ready" : "N/A"}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {health.total_scans !== undefined && (
                <div className="mt-4 rounded-lg bg-muted p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total scans run:</span>
                    <span className="font-semibold">{health.total_scans}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-muted-foreground">Total clients:</span>
                    <span className="font-semibold">{health.total_clients}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default Scanners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Default Scanners
          </CardTitle>
          <CardDescription>
            Select which scanners to enable by default for new scans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(SCANNER_INFO).map(([key, info]) => (
              <div key={key} className="flex items-start space-x-3">
                <Checkbox
                  id={`default-${key}`}
                  checked={defaultScanners.includes(key)}
                  onCheckedChange={() => toggleScanner(key)}
                />
                <div className="flex-1">
                  <label
                    htmlFor={`default-${key}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {info.label}
                  </label>
                  <p className="text-muted-foreground text-xs">{info.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-4 text-xs">
            These preferences are saved in your browser
          </p>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About Ai Agency</CardTitle>
          <CardDescription>
            Security scanner dashboard powered by industry-standard tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Version</p>
            <p className="text-muted-foreground text-sm">1.0.0</p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Scanner Services</p>
            <div className="space-y-2">
              <a
                href="https://observatory.mozilla.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-1 text-sm hover:underline"
              >
                Mozilla Observatory - Security Headers
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://safebrowsing.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-1 text-sm hover:underline"
              >
                Google Safe Browsing - Malware Detection
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">AI Analysis</p>
            <p className="text-muted-foreground text-sm">
              Powered by Claude 4.5 Sonnet from Anthropic
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
