// app/api/scans/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getScan, deleteScan } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scan = await getScan(id);

    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    return NextResponse.json(scan);
  } catch (error) {
    console.error("Error fetching scan:", error);
    return NextResponse.json(
      { error: "Failed to fetch scan" },
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
    await deleteScan(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scan:", error);
    return NextResponse.json(
      { error: "Failed to delete scan" },
      { status: 500 }
    );
  }
}
