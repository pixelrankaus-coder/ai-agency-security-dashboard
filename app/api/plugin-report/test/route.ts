import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Verify Bearer token
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body
  const body = await request.json();
  const { site_key, site_url } = body;

  // Simple connectivity test - if we got here, authentication worked
  return NextResponse.json({
    success: true,
    message: "Connection successful",
    site_key,
    site_url,
    timestamp: new Date().toISOString(),
  });
}
