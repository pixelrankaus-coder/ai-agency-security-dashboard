// app/api/clients/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deleteClient } from "@/lib/storage";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteClient(id);

  return NextResponse.json({ success: true });
}
