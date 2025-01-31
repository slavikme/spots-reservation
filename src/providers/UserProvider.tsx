"use client";

import { getSessionUser } from "@/lib/api-client";
import { User as DbUser } from "@/types/db.types";
import {
  UserProvider as Auth0UserProvider,
  useUser as useAuth0User,
  UserProfile,
} from "@auth0/nextjs-auth0/client";
import { createContext, useContext, useEffect, useState } from "react";

interface UserContextType {
  dbUser: DbUser | null;
  auth0User: UserProfile | undefined | null;
  isLoading: boolean;
  error: Error | null;
}

export const UserContext = createContext<UserContextType>({
  dbUser: null,
  auth0User: null,
  isLoading: true,
  error: null,
});

export function useUser() {
  return useContext(UserContext);
}

function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: auth0User, isLoading: auth0Loading } = useAuth0User();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDbUser() {
      if (!auth0User?.sub) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getSessionUser();
        setDbUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    if (!auth0Loading) {
      fetchDbUser();
    }
  }, [auth0User?.sub, auth0Loading]);

  return (
    <UserContext.Provider
      value={{
        dbUser,
        auth0User,
        isLoading: isLoading || auth0Loading,
        error,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function UserProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Auth0UserProvider>
      <UserProvider>{children}</UserProvider>
    </Auth0UserProvider>
  );
}

export default UserProviderWrapper;
