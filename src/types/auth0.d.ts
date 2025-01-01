import type { User } from "@/types/db.types";
import type { Session as Auth0Session, Claims } from "@auth0/nextjs-auth0";

declare module "@auth0/nextjs-auth0" {
  interface Session extends Auth0Session {
    user: Claims & {
      dbUser?: User;
    };
  }
}
