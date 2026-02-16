// app/api/sites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSites, createSite, getOrCreateDefaultCompany } from "@/lib/db";
import { normalizeUrl, addProtocol } from "@/lib/utils/url";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id") || undefined;

    const sites = await getSites(companyId);
    return NextResponse.json(sites);
  } catch (error: any) {
    console.error("Error fetching sites:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch sites" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, name, notes, company_id } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Get company_id (either from request or default company)
    let finalCompanyId = company_id;
    if (!finalCompanyId) {
      const defaultCompany = await getOrCreateDefaultCompany();
      finalCompanyId = defaultCompany.id;
    }

    // Normalize URL (strip protocol, www, trailing slashes)
    const normalizedUrl = normalizeUrl(url);

    // Check for duplicates
    const existingSites = await getSites(finalCompanyId);
    const duplicate = existingSites.find(
      (s) => normalizeUrl(s.url) === normalizedUrl
    );
    if (duplicate) {
      return NextResponse.json(
        { error: "This site already exists" },
        { status: 400 }
      );
    }

    // Store with protocol added back for scanning
    const site = await createSite({
      url: addProtocol(normalizedUrl),
      name: name || null,
      notes: notes || "",
      company_id: finalCompanyId,
      default_scanners: ["observatory", "ssl", "crawler"],
      scan_schedule: "manual",
      is_active: true,
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error: any) {
    console.error("Error creating site:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create site" },
      { status: 500 }
    );
  }
}
