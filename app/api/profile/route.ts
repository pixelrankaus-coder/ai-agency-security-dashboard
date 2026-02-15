// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProfile, updateProfile } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // TODO: Get user ID from auth session
    // For now, return error - this will be implemented with auth in Task 9
    return NextResponse.json(
      { error: "Authentication not yet implemented" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // TODO: Get user ID from auth session
    // For now, return error - this will be implemented with auth in Task 9
    return NextResponse.json(
      { error: "Authentication not yet implemented" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
