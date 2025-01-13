import auth0 from "@/lib/auth0";
import * as db from "@/lib/db";
import { logger } from "@/lib/log";
import { NextResponse } from "next/server";

const log = logger("[API]");

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
    const session = await log.measure("Getting session user", auth0.getSession);
    if (!session?.user) {
      log.warn("Unauthorized access attempt - no session user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user;
    try {
      log(`Fetching user data for: ${session.user.email}`);
      user = await db.getUser(session.user.email);
    } catch (error) {
      // Verify database initialization status - may need setup if this is first run
      // Will initialize database and attempt user fetch again if needed.
      // This check located here because this API route is the first one that is called
      // involving DB operations
      if (await db.isDatabaseInitialized()) {
        // If the database is initialized, then something went wrong while fetching the user
        log.error("Failed to fetch user", error);
        return NextResponse.json(
          { error: "Failed to fetch user" },
          { status: 500 }
        );
      }

      // It seems like the database is not initialized, so we'll initialize it and retry the user fetch
      log.warn("Database not initialized");
      await db.ensureInitialized();
    }

    if (!user) {
      log.warn("User not found in database");
      log(`Checking if there are any users in the database`);
      const hasAnyUsers = await db.hasUsers();
      if (!hasAnyUsers) {
        log("No users exist in database yet");
      }
      // If this is the first user, make them an owner
      const role = !hasAnyUsers ? "owner" : "user";
      const name = session.user.name || session.user.email;
      log(`Inserting ${role} account into database`);
      const newUser = await db.insertUser(session.user.email, name, role);
      return NextResponse.json(newUser);
    }

    log("Successfully retrieved user data");
    return NextResponse.json(user);
  } catch (error) {
    log.error("Error getting user", error);
    return NextResponse.json(
      { error: "Error retrieving user data" },
      { status: 500 }
    );
  }
}
