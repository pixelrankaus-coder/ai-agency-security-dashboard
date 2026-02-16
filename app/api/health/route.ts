// app/api/health/route.ts
import { NextResponse } from "next/server";
import { getScans, getSites } from "@/lib/db";

export async function GET() {
  try {
    const scans = await getScans();
    const sites = await getSites();

    const hasSafeBrowsingKey = !!process.env.GOOGLE_SAFE_BROWSING_API_KEY;

    return NextResponse.json({
      status: "ok",
      scanners: {
        observatory: true, // External API, always available
        ssl: true, // Built-in, always available
        crawler: true, // Built-in, always available
        safe_browsing: hasSafeBrowsingKey, // Requires API key
      },
      total_scans: scans.length,
      total_clients: sites.length,
    });
  } catch (error: any) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error?.message || "Health check failed",
        scanners: {
          observatory: true,
          ssl: true,
          crawler: true,
          safe_browsing: !!process.env.GOOGLE_SAFE_BROWSING_API_KEY,
        },
        total_scans: 0,
        total_clients: 0,
      },
      { status: 500 }
    );
  }
}
