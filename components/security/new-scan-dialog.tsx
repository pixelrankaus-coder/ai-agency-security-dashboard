"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusIcon, Loader2 } from "lucide-react";
import { startScan, fetchSites, createSite } from "@/lib/api";
import { useDemoContext } from "@/lib/demo-context";
import type { Site, Scan } from "@/types";
import { SCANNER_INFO } from "@/lib/scanner-info";

interface NewScanDialogProps {
  onScanCreated?: () => void;
  onScanAdded?: (scan: Scan) => void;
  onScanStarted?: (scanId: string) => void;
  defaultUrl?: string;
  defaultClient?: string;
}

export function NewScanDialog({ onScanCreated, onScanAdded, onScanStarted, defaultUrl, defaultClient }: NewScanDialogProps) {
  const { isDemo } = useDemoContext();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [clientName, setClientName] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedScanners, setSelectedScanners] = useState<string[]>([
    "observatory",
    "ssl",
    "crawler",
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      loadSites();
      // Pre-fill form if defaults provided
      if (defaultUrl) setUrl(defaultUrl);
      if (defaultClient) setClientName(defaultClient);
    }
  }, [open, defaultUrl, defaultClient]);

  async function loadSites() {
    if (isDemo) {
      // In demo mode, no API call needed
      setSites([]);
      return;
    }

    try {
      const data = await fetchSites();
      setSites(data);
    } catch (err) {
      // Silent failure
      setSites([]);
    }
  }

  async function handleSubmit() {
    if (!url.trim()) {
      setError("URL is required");
      return;
    }

    // Clean and normalize URL
    let cleanUrl = url.trim();

    // Fix common mistakes: remove duplicate protocols
    cleanUrl = cleanUrl.replace(/^https?:\/\/https?:\/\//i, "https://");

    // Add https:// if no protocol
    if (!cleanUrl.match(/^https?:\/\//i)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    // Validate URL
    try {
      const urlObj = new URL(cleanUrl);
      if (!urlObj.protocol.startsWith("http")) {
        setError("URL must start with http:// or https://");
        return;
      }
      // Use the cleaned URL
      cleanUrl = urlObj.href;
    } catch {
      setError("Please enter a valid URL (e.g., example.com or https://example.com)");
      return;
    }

    setLoading(true);
    setError("");

    if (isDemo) {
      // Demo mode - create a mock scan and add it to the list
      const mockScan: Scan = {
        id: `demo-${Date.now()}`,
        site_id: "demo-site",
        company_id: "demo-company",
        started_by: null,
        url: cleanUrl,
        scanners: selectedScanners,
        status: "queued",
        progress: 0,
        current_scanner: null,
        results: [],
        analysis: null,
        total_findings: 0,
        severity_counts: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
        },
        grade: null,
        score: null,
        report_url: null,
        error: null,
        duration_seconds: null,
        created_at: new Date().toISOString(),
        completed_at: null,
        updated_at: new Date().toISOString(),
      };

      // Reset and close
      setOpen(false);
      setUrl("");
      setClientName("");
      setSelectedScanners(["observatory", "ssl", "crawler"]);
      setLoading(false);

      // Show toast notification
      const hostname = new URL(cleanUrl).hostname;
      toast.info(`Demo Mode - Scan queued for ${hostname}`, {
        description: "This is a demo scan. Connect backend for real scanning.",
      });

      // Notify parent components
      onScanAdded?.(mockScan);
      onScanCreated?.();
      return;
    }

    // Live mode
    try {
      // Find or create site for this URL
      let site = sites.find((s) => s.url === cleanUrl);
      if (!site) {
        // Create new site
        site = await createSite({
          url: cleanUrl,
          name: clientName || undefined,
        });
      }

      if (!site) {
        setError("Failed to create site");
        setLoading(false);
        return;
      }

      // Start scan with site_id
      const result = await startScan({
        site_id: site.id,
        scanners: selectedScanners.length > 0 ? selectedScanners : undefined,
      });

      // Success - reset and close
      setOpen(false);
      setUrl("");
      setClientName("");
      setSelectedScanners(["observatory", "ssl", "crawler"]);
      setLoading(false);

      // Show toast notification
      const hostname = new URL(cleanUrl).hostname;
      toast.success(`Scan started for ${hostname}`, {
        description: "You'll be notified when it completes",
        action: {
          label: "View Progress",
          onClick: () => router.push(`/dashboard/scans/${result.id}`),
        },
      });

      onScanCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start scan");
      setLoading(false);
    }
  }

  function toggleScanner(scanner: string) {
    setSelectedScanners((prev) =>
      prev.includes(scanner)
        ? prev.filter((s) => s !== scanner)
        : [...prev, scanner]
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Scan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start New Security Scan</DialogTitle>
          <DialogDescription>
            Enter the website URL and select the security scanners to run.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="url">Website URL *</Label>
            <Input
              id="url"
              placeholder="example.com or https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <p className="text-muted-foreground text-xs">
              Enter a domain name or full URL (https:// will be added if needed)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site">Site (Optional)</Label>
            <Select value={clientName || undefined} onValueChange={setClientName} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="No site (optional)" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.name || site.url}>
                    {site.name || site.url}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Scanners</Label>
            <div className="space-y-3 rounded-md border p-3">
              {Object.entries(SCANNER_INFO).map(([key, info]) => (
                <div key={key} className="flex items-start space-x-3">
                  <Checkbox
                    id={key}
                    checked={selectedScanners.includes(key)}
                    onCheckedChange={() => toggleScanner(key)}
                    disabled={loading}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {info.label}
                    </label>
                    <p className="text-muted-foreground text-xs">{info.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Scan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
