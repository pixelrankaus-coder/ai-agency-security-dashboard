// app/api/sites/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSite, updateSite, deleteSite } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const site = await getSite(id);

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json(site);
  } catch (error) {
    console.error("Error fetching site:", error);
    return NextResponse.json(
      { error: "Failed to fetch site" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const site = await updateSite(id, body);
    return NextResponse.json(site);
  } catch (error) {
    console.error("Error updating site:", error);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteSite(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting site:", error);
    return NextResponse.json(
      { error: "Failed to delete site" },
      { status: 500 }
    );
  }
}
