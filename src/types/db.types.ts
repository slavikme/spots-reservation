export type UserRole = "user" | "admin" | "owner";

/** Represents a user in the system */
export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  created_at: Date;
}

/** Represents a spot */
export type Spot = {
  id: string;
  created_at: Date;
};

/** Represents the current status of a spot */
export type SpotStatus = {
  spot_id: string;
  user_name: string | null;
  start_time: Date | null;
  end_time: Date | null;
};

/** Represents a spot reservation/assignment */
export type Assignment = {
  user_email: string;
  start_time: Date;
  end_time: Date | null;
};
