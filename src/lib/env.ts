import dotenv from "dotenv";
dotenv.config();

/**
 * The database URL.
 * This is used to configure the database connection.
 */
export const DATABASE_URL =
  process.env.DATABASE_URL ||
  // As a fallback, use a local Postgres instance.
  // This is useful also during build time.
  "postgres://postgres:postgres@localhost:5432/postgres";

/**
 * The base URL for the Auth0 authentication.
 * This is used as a callback URL for the Auth0 authentication.
 */
export const AUTH0_BASE_URL =
  // Use custom environment variable if set
  process.env.AUTH0_BASE_URL ||
  // If running in Vercel, use the VERCEL_URL environment variable
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  // Otherwise, fallback to local environment
  "http://localhost:3001";

/**
 * The secret for the Auth0 authentication.
 * This is used to sign the Auth0 session cookies.
 */
export const AUTH0_SECRET = process.env.AUTH0_SECRET || "dummy-secret";

/**
 * The issuer base URL for the Auth0 authentication.
 * This is used to configure the Auth0 library.
 */
export const AUTH0_ISSUER_BASE_URL =
  process.env.AUTH0_ISSUER_BASE_URL || "https://dummy-issuer.auth0.com";

/**
 * The client ID for the Auth0 authentication.
 * This is used to configure the Auth0 library.
 */
export const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID || "dummy-client-id";

/**
 * The client secret for the Auth0 authentication.
 * This is used to configure the Auth0 library.
 */
export const AUTH0_CLIENT_SECRET =
  process.env.AUTH0_CLIENT_SECRET || "dummy-client-secret";
