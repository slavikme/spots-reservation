import auth0 from "@/lib/auth0";
import * as db from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
    const session = await auth0.getSession();
    if (!session?.user) {
      console.warn("[API] Unauthorized access attempt - no session user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[API] Fetching user data for:", session.user.email);
    let user;
    try {
      user = await db.getUser(session.user.email);
    } catch (error) {
      // Check if database needs initialization since this could be a fresh database
      // If not initialized, we'll initialize it and retry the user fetch

      if (await db.isDatabaseInitialized()) {
        // If the database is initialized, then something went wrong while fetching the user
        console.error("[API] Failed to fetch user:", error);
        return NextResponse.json(
          { error: "Failed to fetch user" },
          { status: 500 }
        );
      }

      // It seems like the database is not initialized, so we'll initialize it and retry the user fetch
      console.log("[API] Database not initialized");
      await db.ensureInitialized();
      user = await db.getUser(session.user.email);
    }

    if (!user) {
      console.log(
        "[API] User not found in database, creating new user:",
        session.user.email
      );
      // If this is the first user, make them an owner
      const isFirstUser = !(await db.hasUsers());
      if (isFirstUser) {
        console.log("[API] First user detected, creating owner account");
      }
      const newUser = await db.insertUser(
        session.user.email,
        session.user.name || session.user.email,
        isFirstUser ? "owner" : "user"
      );
      return NextResponse.json(newUser);
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
