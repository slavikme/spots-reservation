import * as db from "@/lib/db";
import { getSession } from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";

/**
 * GET /api/user
 * Gets the currently authenticated user
 * @returns NextResponse with user object or error
 * - 401 if no authenticated session
 * - 404 if user not found in database
 * - 500 if server error occurs
 */

export async function GET() {
  try {
    console.log("[API] Getting session user");
    const session = await getSession();
    if (!session?.user) {
      console.warn("[API] Unauthorized access attempt - no session user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[API] Fetching user data for:", session.user.email);
    const user = await db.getUser(session.user.email);

    if (!user) {
      console.warn("[API] User not found in database:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("[API] Successfully retrieved user data");
    return NextResponse.json(user);
  } catch (error) {
    console.error("[API] Error getting user:", error);
    return NextResponse.json(
      { error: "Error retrieving user data" },
      { status: 500 }
    );
  }
}
