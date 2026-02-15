// app/api/sites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSites, createSite, getOrCreateDefaultCompany } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id") || undefined;

    const sites = await getSites(companyId);
    return NextResponse.json(sites);
  } catch (error) {
    console.error("Error fetching sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch sites" },
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

    const site = await createSite({
      url,
      name: name || null,
      notes: notes || "",
      company_id: finalCompanyId,
      default_scanners: ["observatory", "ssl", "crawler"],
      scan_schedule: "manual",
      is_active: true,
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    console.error("Error creating site:", error);
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 }
    );
  }
}
