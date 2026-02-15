// app/api/companies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCompanies, createCompany } from "@/lib/db";

export async function GET() {
  try {
    const companies = await getCompanies();
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, website, notes } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const company = await createCompany({
      name,
      slug,
      website: website || null,
      notes: notes || "",
      subscription_plan: "trial",
      subscription_status: "trialing",
      scans_per_month: 10,
      scans_used_this_month: 0,
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
