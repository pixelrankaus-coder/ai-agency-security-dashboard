// app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getClients, saveClient } from "@/lib/storage";
import type { Client } from "@/types";

export async function GET() {
  const clients = getClients();
  return NextResponse.json(clients);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, website, notes } = body;

    if (!name || !website) {
      return NextResponse.json(
        { error: "Name and website are required" },
        { status: 400 }
      );
    }

    const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const client: Client = {
      id: clientId,
      name: name.trim(),
      website: website.trim(),
      notes: notes?.trim() || null,
      created_at: new Date().toISOString(),
    };

    saveClient(client);

    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    console.error("Error creating client:", err);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
