"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Scan, Client, HealthStatus, Site } from "@/types";

interface DemoContextType {
  isDemo: boolean;
  setIsDemo: (value: boolean) => void;
  retryBackend: () => Promise<void>;
  getMockScans: () => Scan[];
  getMockClients: () => Client[];
  getMockSites: () => Site[];
  getMockHealth: () => HealthStatus;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

// Mock data generators
function generateMockScans(): Scan[] {
  return [
    {
      id: "demo-1",
      url: "https://example.com",
      status: "completed",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 82800000).toISOString(),
      completed_at: new Date(Date.now() - 82800000).toISOString(),
      total_findings: 12,
      severity_counts: {
        critical: 2,
        high: 3,
        medium: 4,
        low: 2,
        info: 1,
      },
      grade: "C",
      score: 65,
      progress: 100,
    },
    {
      id: "demo-2",
      url: "https://secure-site.com",
      status: "completed",
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 169200000).toISOString(),
      completed_at: new Date(Date.now() - 169200000).toISOString(),
      total_findings: 3,
      severity_counts: {
        critical: 0,
        high: 0,
        medium: 1,
        low: 2,
        info: 0,
      },
      grade: "A",
      score: 92,
      progress: 100,
    },
    {
      id: "demo-3",
      url: "https://client-website.com",
      status: "scanning",
      created_at: new Date(Date.now() - 300000).toISOString(),
      updated_at: new Date(Date.now() - 60000).toISOString(),
      total_findings: 0,
      progress: 45,
    },
  ];
}

function generateMockClients(): Client[] {
  return [
    {
      id: "client-1",
      name: "Acme Corp",
      website: "https://acmecorp.com",
      contact_email: "security@acmecorp.com",
      scan_count: 5,
      last_scan_date: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 2592000000).toISOString(),
    },
    {
      id: "client-2",
      name: "TechStart Inc",
      website: "https://techstart.io",
      contact_email: "admin@techstart.io",
      scan_count: 3,
      last_scan_date: new Date(Date.now() - 172800000).toISOString(),
      created_at: new Date(Date.now() - 5184000000).toISOString(),
    },
  ];
}

function generateMockSites(): Site[] {
  return [
    {
      id: "site-1",
      company_id: "demo-company",
      url: "https://example.com",
      name: "Example Website",
      notes: "",
      last_scan_id: "demo-1",
      last_scan_at: new Date(Date.now() - 86400000).toISOString(),
      last_scan_grade: "C",
      last_scan_score: 65,
      last_scan_findings: {
        critical: 2,
        high: 3,
        medium: 4,
        low: 2,
        info: 1,
      },
      scan_schedule: "weekly" as const,
      default_scanners: ["ssl", "headers", "wappalyzer"],
      is_active: true,
      created_at: new Date(Date.now() - 2592000000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "site-2",
      company_id: "demo-company",
      url: "https://secure-site.com",
      name: "Secure Site",
      notes: "",
      last_scan_id: "demo-2",
      last_scan_at: new Date(Date.now() - 172800000).toISOString(),
      last_scan_grade: "A",
      last_scan_score: 92,
      last_scan_findings: {
        critical: 0,
        high: 0,
        medium: 1,
        low: 2,
        info: 0,
      },
      scan_schedule: "monthly" as const,
      default_scanners: ["ssl", "headers"],
      is_active: true,
      created_at: new Date(Date.now() - 5184000000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ];
}

function generateMockHealth(): HealthStatus {
  return {
    status: "healthy",
    version: "demo-mode",
    total_scans: 8,
    active_scans: 1,
  };
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Check backend once on mount
  useEffect(() => {
    checkBackendOnce();
  }, []);

  async function checkBackendOnce() {
    if (hasChecked) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.log("⚠️  No API URL configured - using demo mode");
        setIsDemo(true);
        setHasChecked(true);
        return;
      }

      const response = await fetch(`${apiUrl}/health`, {
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        throw new Error("Backend not healthy");
      }

      // Backend is available
      setIsDemo(false);
      setHasChecked(true);
    } catch (error) {
      // Single log message on initial failure only
      console.log("⚠️  Backend unavailable - using demo mode with sample data");
      setIsDemo(true);
      setHasChecked(true);
    }
  }

  async function retryBackend() {
    setHasChecked(false);
    await checkBackendOnce();
  }

  const value: DemoContextType = {
    isDemo,
    setIsDemo,
    retryBackend,
    getMockScans: generateMockScans,
    getMockClients: generateMockClients,
    getMockSites: generateMockSites,
    getMockHealth: generateMockHealth,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoContext() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemoContext must be used within a DemoProvider");
  }
  return context;
}
