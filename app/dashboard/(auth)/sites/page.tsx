"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AddSiteDialog } from "@/components/security/add-site-dialog";
import { SeveritySummaryBar } from "@/components/security";
import { fetchSites, deleteSite, fetchScans } from "@/lib/api";
import type { Site, Scan } from "@/types";
import {
  MoreVertical,
  Globe,
  Trash2,
  Search,
  ExternalLink,
  Scan as ScanIcon,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SitesPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [sitesData, scansData] = await Promise.all([
        fetchSites(),
        fetchScans({ limit: 100 }),
      ]);
      setSites(sitesData);
      setScans(scansData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleSiteAdded(newSite: Site) {
    setSites([newSite, ...sites]);
  }

  async function handleDelete() {
    if (!siteToDelete) return;

    try {
      await deleteSite(siteToDelete.id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete site:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSiteToDelete(null);
    }
  }

  function getSiteStats(site: Site) {
    const siteScans = scans.filter((scan) => scan.site_id === site.id);
    const latestScan = siteScans[0];
    return {
      totalScans: siteScans.length,
      latestScan,
    };
  }

  function getSiteInitials(site: Site): string {
    if (site.name) {
      return site.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    // Use first letter of domain
    const domain = site.url.replace(/^https?:\/\//, "").split("/")[0];
    return domain.slice(0, 2).toUpperCase();
  }

  function getSiteColor(index: number): string {
    const colors = [
      "from-blue-400 to-blue-600",
      "from-purple-400 to-purple-600",
      "from-pink-400 to-pink-600",
      "from-green-400 to-green-600",
      "from-yellow-400 to-yellow-600",
      "from-red-400 to-red-600",
      "from-indigo-400 to-indigo-600",
      "from-teal-400 to-teal-600",
    ];
    return colors[index % colors.length];
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sites</h1>
          <p className="text-muted-foreground mt-1">
            Manage websites and monitor their security scans
          </p>
        </div>
        <AddSiteDialog
          onSiteCreated={loadData}
          onSiteAdded={handleSiteAdded}
        />
      </div>

      {sites.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No sites yet</h2>
            <p className="text-muted-foreground mt-2 mb-6">
              Add your first website to start monitoring its security.
            </p>
            <AddSiteDialog
              onSiteCreated={loadData}
              onSiteAdded={handleSiteAdded}
            />
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site, index) => {
            const stats = getSiteStats(site);
            const initials = getSiteInitials(site);
            const color = getSiteColor(index);
            const displayUrl = site.url.replace(/^https?:\/\//, "");

            return (
              <Card
                key={site.id}
                className="group relative overflow-hidden transition-shadow hover:shadow-lg"
              >
                <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setSiteToDelete(site);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Site
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} text-white text-lg font-bold`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-bold">
                        {site.name || displayUrl}
                      </h3>
                      <a
                        href={site.url.startsWith("http") ? site.url : `https://${site.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary group/link mt-1 flex items-center gap-1 text-sm hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="h-3 w-3" />
                        <span className="truncate">{displayUrl}</span>
                        <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover/link:opacity-100" />
                      </a>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {site.notes && (
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {site.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-4 border-t pt-3 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">
                        Total Scans
                      </div>
                      <div className="font-semibold">{stats.totalScans}</div>
                    </div>
                    {site.last_scan_at && (
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Last Scan
                        </div>
                        <div className="font-semibold">
                          {format(new Date(site.last_scan_at), "dd MMM yyyy")}
                        </div>
                      </div>
                    )}
                    {site.last_scan_grade && (
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Grade
                        </div>
                        <div className="font-semibold">
                          {site.last_scan_grade}
                        </div>
                      </div>
                    )}
                  </div>

                  {site.last_scan_findings && (
                    <div className="border-t pt-3">
                      <SeveritySummaryBar severities={site.last_scan_findings} />
                    </div>
                  )}

                  <div className="flex gap-2 border-t pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link
                        href={`/dashboard/scans?site_id=${encodeURIComponent(site.id)}`}
                      >
                        <Search className="mr-1 h-3 w-3" />
                        View Scans
                      </Link>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/dashboard/scans?scan_site=${site.id}`}>
                        <ScanIcon className="mr-1 h-3 w-3" />
                        Scan Now
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Site?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {siteToDelete?.name ||
                  siteToDelete?.url.replace(/^https?:\/\//, "")}
              </strong>
              ? This will also delete all associated scans. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
