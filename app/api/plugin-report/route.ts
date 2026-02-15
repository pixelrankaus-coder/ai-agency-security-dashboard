import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Verify Bearer token
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const apiKey = auth.replace("Bearer ", "");

  // Parse request body
  const body = await request.json();
  const {
    site_key,
    site_url,
    site_name,
    wp_version,
    php_version,
    plugin_version,
    timestamp,
    scanners,
    findings,
    summary,
  } = body;

  if (!site_key || !findings) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const supabase = await createServerClient();

  // Find or create the site
  let { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("plugin_site_key", site_key)
    .single();

  // If no match by key, try matching by URL
  if (!site) {
    const cleanUrl = site_url?.replace(/\/$/, "").replace(/^https?:\/\//, "") || "";
    const { data: urlMatch } = await supabase
      .from("sites")
      .select("*")
      .or(`url.ilike.%${cleanUrl}%`)
      .single();

    if (urlMatch) {
      // Link this site to the plugin by saving the site_key
      await supabase
        .from("sites")
        .update({ plugin_site_key: site_key })
        .eq("id", urlMatch.id);
      site = urlMatch;
    } else {
      // Create new site
      const { data: newSite, error: createError } = await supabase
        .from("sites")
        .insert({
          url: site_url || "",
          name: site_name || new URL(site_url || "").hostname,
          plugin_site_key: site_key,
        })
        .select()
        .single();

      if (createError || !newSite) {
        return NextResponse.json(
          { error: "Failed to create site" },
          { status: 500 }
        );
      }
      site = newSite;
    }
  }

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // Create scan record
  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .insert({
      site_id: site.id,
      company_id: site.company_id,
      url: site_url || site.url,
      scanners: Object.keys(scanners || {}),
      status: "complete",
      progress: 100,
      results: {
        plugin_version,
        wp_version,
        php_version,
        scanners,
      },
      total_findings: summary?.total || 0,
      severity_counts: {
        critical: summary?.critical || 0,
        high: summary?.high || 0,
        medium: summary?.medium || 0,
        low: summary?.low || 0,
        info: summary?.info || 0,
      },
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (scanError || !scan) {
    return NextResponse.json({ error: "Failed to create scan" }, { status: 500 });
  }

  // Create findings
  const findingsToInsert = (findings || []).map((finding: any) => ({
    scan_id: scan.id,
    site_id: site.id,
    company_id: site.company_id,
    scanner: finding.scanner || "unknown",
    severity: finding.severity || "info",
    type: finding.type || "unknown",
    description: finding.description || "",
    recommendation: finding.recommendation || "",
    metadata: finding.metadata || {},
  }));

  if (findingsToInsert.length > 0) {
    await supabase.from("findings").insert(findingsToInsert);
  }

  // Update site's last_scan summary
  await supabase
    .from("sites")
    .update({
      last_scan_id: scan.id,
      last_scan_at: new Date().toISOString(),
      last_scan_findings: {
        critical: summary?.critical || 0,
        high: summary?.high || 0,
        medium: summary?.medium || 0,
        low: summary?.low || 0,
        info: summary?.info || 0,
      },
    })
    .eq("id", site.id);

  return NextResponse.json({
    success: true,
    site_id: site.id,
    scan_id: scan.id,
    findings_count: findingsToInsert.length,
  });
}
