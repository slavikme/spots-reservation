"use server";

import { Assignment, Spot, SpotStatus, User } from "@/types/db.types";
import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "./env";
import { logger } from "./log";

// Create a scoped logger for database operations
const log = logger("[DB]");

// Create a singleton SQL client
const sql = neon(DATABASE_URL);

let isInitialized = false;

/**
 * Checks if the database is initialized by checking if the tables exist
 * @returns Promise that resolves to true if the database is initialized, false otherwise
 * @throws Error if checking database initialization fails
 */
export async function isDatabaseInitialized() {
  if (isInitialized) return true;

  try {
    const [result] = await log.measure(
      "Checking if database is initialized",
      () => sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'spots'
        ) AND EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'users'
        ) AND EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'users_spots'
        ) as initialized;
      `
    );
    isInitialized = result.initialized;
    if (isInitialized) {
      log("Database is initialized");
    } else {
      log.warn("Database is not initialized");
    }
    return isInitialized;
  } catch (error) {
    log.error("Error checking database initialization", error);
    throw new Error("Failed to check database initialization status", {
      cause: error,
    });
  }
}

/**
 * Initializes the database schema and creates required tables
 * Creates:
 * - spots table for spots
 * - users table with role-based access
 * - users_spots table for spot reservations
 * Also creates necessary indexes and inserts the owner user
 * @throws Error if database initialization fails
 */
export async function initializeDatabase() {
  // Create spots table
  await log.measure(
    "Creating spots table",
    () => sql`
      CREATE TABLE IF NOT EXISTS spots (
        id character varying(255) NOT NULL,
        created_at timestamp without time zone NOT NULL DEFAULT now(),
        CONSTRAINT spots_pkey PRIMARY KEY (id)
      );
    `
  );

  // Create users table with role column
  await log.measure(
    "Creating users table",
    () => sql`
      CREATE TABLE IF NOT EXISTS users (
        email character varying(255) NOT NULL,
        created_at timestamp without time zone NOT NULL DEFAULT now(),
        name character varying(255) NOT NULL,
        role character varying(50) NOT NULL DEFAULT 'user',
        CONSTRAINT users_pkey PRIMARY KEY (email)
      );
    `
  );

  // Create users_spots table with foreign key constraints
  await log.measure(
    "Creating users_spots table",
    () => sql`
      CREATE TABLE IF NOT EXISTS users_spots (
        user_email character varying(255) NOT NULL,
        spot_id character varying(255) NOT NULL,
        start_time timestamp without time zone NOT NULL,
        end_time timestamp without time zone NULL,
        CONSTRAINT users_spots_pkey PRIMARY KEY (spot_id, start_time, user_email),
        CONSTRAINT fk_user FOREIGN KEY (user_email) 
          REFERENCES users(email) ON DELETE CASCADE ON UPDATE RESTRICT,
        CONSTRAINT fk_spot FOREIGN KEY (spot_id)
          REFERENCES spots(id) ON DELETE CASCADE ON UPDATE RESTRICT
      );
    `
  );

  // Add index for time range queries
  await log.measure(
    "Creating users_spots index",
    () => sql`  
      CREATE INDEX IF NOT EXISTS idx_users_spots_time_range 
      ON users_spots(start_time, end_time);
    `
  );

  isInitialized = true;
}

/**
 * Ensures database is initialized. Should be called during app startup.
 * Safe to call multiple times - will only initialize once.
 */
export async function ensureInitialized() {
  if (await isDatabaseInitialized()) return;

  log("Initializing database");
  try {
    await initializeDatabase();
    log("Database initialized successfully");
  } catch (error) {
    log.error("Failed to initialize database", error);
    throw error;
  }
}

/**
 * Creates a new user in the system
 * @param email User's email address (unique identifier)
 * @param name User's display name
 * @param role User's role in the system (defaults to "user")
 * @returns The created user object
 * @throws Error if user creation fails
 */
export async function insertUser(
  email: string,
  name: string,
  role: "user" | "admin" | "owner" = "user"
): Promise<User> {
  try {
    const [user] = (await log.measure(
      `Inserting user ${email}, ${name}, ${role}`,
      () => sql`
        INSERT INTO users (email, name, role)
        VALUES (${email}, ${name}, ${role})
        RETURNING email, name, role, created_at;
      `
    )) as User[];
    return user;
  } catch (error) {
    log.error("Error inserting user", error);
    throw new Error("Failed to insert user", { cause: error });
  }
}

/**
 * Creates a new spot
 * @param id Unique identifier for the spot
 * @returns The created spot object
 * @throws Error if spot creation fails
 */
export async function insertSpot(id: string): Promise<Spot> {
  try {
    const [spot] = (await log.measure(
      `Inserting spot ${id}`,
      () => sql`
        INSERT INTO spots (id)
        VALUES (${id})
        RETURNING id, created_at;
      `
    )) as Spot[];
    return spot;
  } catch (error) {
    log.error("Error inserting spot", error);
    throw new Error("Failed to insert spot", { cause: error });
  }
}

/**
 * Deletes a spot and all its reservations
 * @param id Spot identifier
 * @throws Error if spot deletion fails
 */
export async function deleteSpot(id: string): Promise<void> {
  try {
    await log.measure(
      `Deleting spot ${id}`,
      () => sql`
        DELETE FROM spots 
        WHERE id = ${id};
      `
    );
  } catch (error) {
    log.error("Error deleting spot", error);
    throw new Error("Failed to delete spot", { cause: error });
  }
}

/**
 * Deletes a user and all their spot reservations
 * @param email User's email address
 * @throws Error if user deletion fails
 */
export async function deleteUser(email: string): Promise<void> {
  try {
    await log.measure(
      `Deleting user ${email}`,
      () => sql`
        DELETE FROM users 
        WHERE email = ${email};
      `
    );
  } catch (error) {
    log.error("Error deleting user", error);
    throw new Error("Failed to delete user", { cause: error });
  }
}

/**
 * Retrieves all users in the system
 * @returns Array of users ordered by creation date (newest first)
 * @throws Error if fetching users fails
 */
export async function getUsers(): Promise<User[]> {
  try {
    const users = (await log.measure(
      "Fetching users",
      () => sql`
        SELECT email, name, role, created_at 
        FROM users
        ORDER BY created_at DESC;
      `
    )) as User[];
    return users;
  } catch (error) {
    log.error("Error fetching users", error);
    throw new Error("Failed to fetch users", { cause: error });
  }
}

/**
 * Checks if there are any users in the system
 * @returns Promise that resolves to true if there are users, false if empty
 * @throws Error if checking users fails
 */
export async function hasUsers(): Promise<boolean> {
  try {
    const [result] = await log.measure(
      "Checking if users exist",
      () => sql`
        SELECT EXISTS(SELECT 1 FROM users LIMIT 1) as has_users;
      `
    );
    return result.has_users;
  } catch (error) {
    log.error("Error checking if users exist", error);
    throw new Error("Failed to check if users exist", { cause: error });
  }
}

/**
 * Retrieves a specific user by their email
 * @param email User's email address
 * @returns The user object if found, undefined otherwise
 * @throws Error if fetching user fails
 */
export async function getUser(email: string): Promise<User | undefined> {
  try {
    const [user] = (await log.measure(
      `Fetching user ${email}`,
      () => sql`
        SELECT email, name, role, created_at
        FROM users 
        WHERE email = ${email}
        LIMIT 1;
      `
    )) as User[];
    return user;
  } catch (error) {
    log.error("Error fetching user by email", error);
    throw new Error("Failed to fetch user", { cause: error });
  }
}

/**
 * Retrieves all spots
 * @returns Array of spots ordered by ID
 * @throws Error if fetching spots fails
 */
export async function getSpots(): Promise<Spot[]> {
  try {
    const spots = (await log.measure(
      "Fetching spots",
      () => sql`
        SELECT id, created_at
        FROM spots
        ORDER BY id ASC;
      `
    )) as Spot[];
    return spots;
  } catch (error) {
    log.error("Error fetching spots", error);
    throw new Error("Failed to fetch spots", { cause: error });
  }
}

/**
 * Gets the current status of all spots at a specific time
 * @param timestamp_ms Unix timestamp in milliseconds
 * @returns Array of spot statuses with their current assignments
 * @throws Error if fetching spot status fails
 */
export async function getSpotStatus(
  timestamp_ms: number
): Promise<SpotStatus[]> {
  try {
    const timestamp = new Date(timestamp_ms);
    const spots_status = (await log.measure(
      `Fetching spot status for timestamp ${timestamp_ms}`,
      () => sql`
        WITH spot_assignments AS (
          SELECT 
            s.id as spot_id,
            u.name as user_name,
            us.start_time,
            us.end_time,
            CASE WHEN us.end_time IS NOT NULL THEN 1 ELSE 0 END as has_end_time
          FROM spots s
          LEFT JOIN users_spots us ON s.id = us.spot_id
          LEFT JOIN users u ON us.user_email = u.email
          WHERE 
            us.start_time <= ${timestamp} AND 
            (us.end_time IS NULL OR us.end_time > ${timestamp})
        )
        SELECT DISTINCT ON (spot_id)
          spot_id,
          user_name,
          start_time,
          end_time
        FROM spot_assignments
        ORDER BY spot_id ASC, has_end_time DESC, start_time DESC;
      `
    )) as SpotStatus[];
    log(
      `Fetched spot status for timestamp ${timestamp_ms} with ${spots_status.length} spots`
    );
    return spots_status;
  } catch (error) {
    log.error("Error fetching spot status", error);
    throw new Error("Failed to fetch spot status", { cause: error });
  }
}

/**
 * Checks for overlapping spot assignments in a given time period
 * @param spotId Spot identifier
 * @param startTime Start of the time period
 * @param endTime End of the time period (null for infinite)
 * @returns Array of overlapping assignments
 * @internal
 */
async function getOverlappingAssignments(
  spotId: string,
  startTime: Date,
  endTime: Date | null
) {
  return await log.measure(
    `Fetching overlapping assignments for spot ${spotId}`,
    () => sql`
      SELECT user_email, start_time, end_time
      FROM users_spots
      WHERE spot_id = ${spotId}
        AND start_time < ${endTime || "9999-12-31"}
        AND (end_time > ${startTime} OR end_time IS NULL);
    `
  );
}

/**
 * Makes a finite-duration spot reservation
 * @param userEmail User's email address
 * @param spotId Spot identifier
 * @param startTime Start of the reservation
 * @param endTime End of the reservation
 * @throws Error if the spot is already occupied during the requested time period
 */
export async function assignSpotWithEndTime(
  userEmail: string,
  spotId: string,
  startTime: Date,
  endTime: Date
): Promise<void> {
  log(
    `Assigning spot with end time. email: ${userEmail}, spot: ${spotId}, start: ${startTime}, end: ${endTime}`
  );
  try {
    // Validate input
    if (startTime >= endTime) {
      throw new Error("Start time must be before end time");
    }

    const overlapping = await getOverlappingAssignments(
      spotId,
      startTime,
      endTime
    );

    if (overlapping.length > 0) {
      log.warn(`Found overlapping assignments: ${overlapping}`);
      throw new Error(
        "Spot is already reserved during the requested time period"
      );
    }

    // Insert the new assignment
    await log.measure(
      `Inserting new assignment for spot ${spotId}`,
      () => sql`
        INSERT INTO users_spots (user_email, spot_id, start_time, end_time)
        VALUES (${userEmail}, ${spotId}, ${startTime}, ${endTime});
      `
    );
  } catch (error) {
    log.error("Error assigning spot with end time", error);
    throw new Error("Failed to assign spot", { cause: error });
  }
}

/**
 * Makes an infinite-duration spot reservation
 * If there's an existing infinite reservation, it will:
 * 1. Update the existing reservation to end at the new start time
 * 2. Create a new infinite reservation for the new user
 * If there are finite reservations that would overlap:
 * 1. Recursively try to create the infinite reservation after the last finite reservation ends
 * @param userEmail User's email address
 * @param spotId Spot identifier
 * @param startTime Start of the reservation
 * @throws Error if the reservation cannot be made
 */
export async function assignSpotInfinite(
  userEmail: string,
  spotId: string,
  startTime: Date
): Promise<void> {
  log(
    `Assigning spot infinitely. email: ${userEmail}, spot: ${spotId}, start: ${startTime}`
  );
  try {
    const overlapping = await getOverlappingAssignments(
      spotId,
      startTime,
      null
    );

    if (overlapping.length > 0) {
      log(`Found overlapping assignments: ${overlapping}`);
      // Find the latest end time among finite reservations
      const finiteReservations = overlapping.filter((a) => a.end_time !== null);

      if (finiteReservations.length > 0) {
        const latestEndTime = new Date(
          Math.max(...finiteReservations.map((a) => a.end_time.getTime()))
        );
        // Recursively try to assign the spot starting after the last finite reservation
        return assignSpotInfinite(userEmail, spotId, latestEndTime);
      }

      // Handle existing infinite reservation
      const existingInfiniteReservation = overlapping.find(
        (a) => a.end_time === null
      );
      if (existingInfiniteReservation) {
        // Update the existing infinite reservation to end at our start time
        await log.measure(
          `Updating existing infinite reservation for spot ${spotId}`,
          () => sql`
            UPDATE users_spots
            SET end_time = ${startTime}
            WHERE spot_id = ${spotId}
              AND user_email = ${existingInfiniteReservation.user_email}
              AND start_time = ${existingInfiniteReservation.start_time}
              AND end_time IS NULL;
          `
        );
      }
    }

    // No overlapping reservations, insert with current start time
    await log.measure(
      `Inserting new infinite reservation for spot ${spotId}`,
      () => sql`
        INSERT INTO users_spots (user_email, spot_id, start_time, end_time)
        VALUES (${userEmail}, ${spotId}, ${startTime}, NULL);
      `
    );
    log(
      `Successfully assigned spot infinitely. email: ${userEmail}, spot: ${spotId}, start: ${startTime}`
    );
  } catch (error) {
    log.error("Error assigning spot infinitely", error);
    throw new Error("Failed to assign spot", { cause: error });
  }
}

/**
 * Validates user authorization for releasing spot reservations
 * @throws Error if user not found or unauthorized
 */
async function validateReleaseAuthorization(
  requestingUserEmail: string,
  overlappingAssignments: Assignment[]
): Promise<void> {
  const [user] = (await log.measure(
    `Fetching user ${requestingUserEmail}`,
    () => sql`
      SELECT role FROM users WHERE email = ${requestingUserEmail}
    `
  )) as { role: string }[];

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "user") {
    const unauthorized = overlappingAssignments.some(
      (assignment) => assignment.user_email !== requestingUserEmail
    );
    if (unauthorized) {
      throw new Error("You can only release your own reservations");
    }
  }
}

/**
 * Handles different types of overlapping reservations
 */
async function handleOverlappingReservation(
  assignment: Assignment,
  spotId: string,
  startTime: Date,
  endTime: Date
): Promise<void> {
  // Case 1: Finite reservation completely within range
  if (isFiniteAssignmentWithinRange(assignment, startTime, endTime)) {
    await deleteFiniteAssignment(assignment, spotId);
    return;
  }

  // Case 2: Range within reservation (finite or infinite)
  if (isRangeWithinAssignment(assignment, startTime, endTime)) {
    await splitAssignment(assignment, spotId, startTime, endTime);
    return;
  }

  // Case 3: Range overlaps start
  if (isStartOverlap(assignment, startTime, endTime)) {
    await updateAssignmentStartTime(assignment, spotId, endTime);
    return;
  }

  // Case 4: Range overlaps end (finite reservations only)
  if (isEndOverlap(assignment, startTime, endTime)) {
    await updateAssignmentEndTime(assignment, spotId, startTime);
    return;
  }

  // Case 5: Infinite reservation starting within range
  if (isInfiniteAssignmentWithinRange(assignment, startTime, endTime)) {
    await updateInfiniteAssignmentStartTime(assignment, spotId, endTime);
    return;
  }
}

// Helper functions for checking overlap conditions
function isFiniteAssignmentWithinRange(
  assignment: Assignment,
  startTime: Date,
  endTime: Date
): boolean {
  return (
    assignment.start_time >= startTime &&
    assignment.end_time !== null &&
    assignment.end_time <= endTime
  );
}

function isRangeWithinAssignment(
  assignment: Assignment,
  startTime: Date,
  endTime: Date
): boolean {
  return (
    assignment.start_time < startTime &&
    (assignment.end_time === null || assignment.end_time > endTime)
  );
}

function isStartOverlap(
  assignment: Assignment,
  startTime: Date,
  endTime: Date
): boolean {
  return assignment.start_time < endTime && startTime <= assignment.start_time;
}

function isEndOverlap(
  assignment: Assignment,
  startTime: Date,
  endTime: Date
): boolean {
  return (
    assignment.end_time !== null &&
    assignment.end_time > startTime &&
    endTime >= assignment.end_time &&
    assignment.start_time < startTime
  );
}

function isInfiniteAssignmentWithinRange(
  assignment: Assignment,
  startTime: Date,
  endTime: Date
): boolean {
  return (
    assignment.end_time === null &&
    assignment.start_time >= startTime &&
    assignment.start_time < endTime
  );
}

// Helper functions for database operations
async function deleteFiniteAssignment(
  assignment: Assignment,
  spotId: string
): Promise<void> {
  await log.measure(
    `Deleting finite assignment for spot ${spotId}`,
    () => sql`
      DELETE FROM users_spots
      WHERE spot_id = ${spotId}
        AND user_email = ${assignment.user_email}
        AND start_time = ${assignment.start_time};
    `
  );
}

async function splitAssignment(
  assignment: Assignment,
  spotId: string,
  startTime: Date,
  endTime: Date
): Promise<void> {
  await log.measure(
    `Splitting assignment for spot ${spotId}`,
    () => sql`
      UPDATE users_spots
      SET end_time = ${startTime}
      WHERE spot_id = ${spotId}
        AND user_email = ${assignment.user_email}
        AND start_time = ${assignment.start_time};
    `
  );

  await log.measure(
    `Inserting new assignment for spot ${spotId}`,
    () => sql`
      INSERT INTO users_spots (user_email, spot_id, start_time, end_time)
      VALUES (
        ${assignment.user_email},
        ${spotId},
        ${endTime},
        ${assignment.end_time}
      );
    `
  );
}

async function updateAssignmentStartTime(
  assignment: Assignment,
  spotId: string,
  newStartTime: Date
): Promise<void> {
  await log.measure(
    `Updating assignment start time for spot ${spotId}`,
    () => sql`
      UPDATE users_spots
      SET start_time = ${newStartTime}
      WHERE spot_id = ${spotId}
        AND user_email = ${assignment.user_email}
        AND start_time = ${assignment.start_time};
    `
  );
}

async function updateAssignmentEndTime(
  assignment: Assignment,
  spotId: string,
  newEndTime: Date
): Promise<void> {
  await log.measure(
    `Updating assignment end time for spot ${spotId}`,
    () => sql`
      UPDATE users_spots
      SET end_time = ${newEndTime}
      WHERE spot_id = ${spotId}
        AND user_email = ${assignment.user_email}
        AND start_time = ${assignment.start_time};
    `
  );
}

async function updateInfiniteAssignmentStartTime(
  assignment: Assignment,
  spotId: string,
  newStartTime: Date
): Promise<void> {
  await log.measure(
    `Updating infinite assignment start time for spot ${spotId}`,
    () => sql`
      UPDATE users_spots
      SET start_time = ${newStartTime}
      WHERE spot_id = ${spotId}
        AND user_email = ${assignment.user_email}
        AND start_time = ${assignment.start_time}
        AND end_time IS NULL;
    `
  );
}

/**
 * Releases a spot reservation for a given time range
 * For users: can only release their own reservations
 * For admins/owners: can release any reservation
 * Handles partial overlaps by splitting existing reservations
 * Never deletes infinite reservations (end_time = null), only modifies them
 * @throws Error if user doesn't have permission to release the reservation
 */
export async function releaseSpotReservation(
  requestingUserEmail: string,
  spotId: string,
  startTime: Date,
  endTime: Date
): Promise<void> {
  log(
    `Releasing spot reservation. email: ${requestingUserEmail}, spot: ${spotId}, start: ${startTime}, end: ${endTime}`
  );
  try {
    // Validate input
    if (startTime >= endTime) {
      throw new Error("Start time must be before end time");
    }

    // Get all overlapping reservations
    const overlapping = (await log.measure(
      `Fetching overlapping assignments for spot ${spotId}`,
      () => sql`
        SELECT user_email, start_time, end_time
        FROM users_spots
        WHERE spot_id = ${spotId}
          AND start_time < ${endTime}
          AND (end_time > ${startTime} OR end_time IS NULL)
        ORDER BY start_time ASC;
      `
    )) as Assignment[];

    log(`Found overlapping assignments: ${overlapping}`);

    // Validate user authorization
    await validateReleaseAuthorization(requestingUserEmail, overlapping);

    // Handle each overlapping reservation
    for (const assignment of overlapping) {
      await handleOverlappingReservation(
        assignment,
        spotId,
        startTime,
        endTime
      );
    }

    log(
      `Successfully released spot reservation. Number of affected reservations: ${overlapping.length}`
    );
  } catch (error) {
    log.error("Error releasing spot reservation", error);
    throw new Error("Failed to release spot reservation", { cause: error });
  }
}
