import dotenv from "dotenv";
dotenv.config();

export const DATABASE_URL =
  process.env.DATABASE_URL ||
  // As a fallback, use a local Postgres instance.
  // This is useful also during build time.
  "postgres://postgres:postgres@localhost:5432/postgres";
