import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // No redirect - let Next.js routing handle dashboard pages naturally
  // /dashboard -> renders app/dashboard/(auth)/page.tsx (Ai Agency Dashboard)
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/"]
};
