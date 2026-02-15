// app/api/clients/[id]/scans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getScans, getClients } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Find client to get their name
  const clients = getClients();
  const client = clients.find(c => c.id === id);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Get scans matching this client's name
  const allScans = getScans();
  const clientScans = allScans.filter(s => s.client_name === client.name);

  return NextResponse.json(clientScans);
}
