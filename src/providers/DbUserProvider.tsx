"use client";

import { User as DbUser } from "@/types/db.types";
import { useUser as useAuth0User } from "@auth0/nextjs-auth0/client";
import { createContext, useContext, useEffect, useState } from "react";

interface DbUserContextType {
  dbUser: DbUser | null;
  isLoading: boolean;
  error: Error | null;
}

const DbUserContext = createContext<DbUserContextType>({
  dbUser: null,
  isLoading: true,
  error: null,
});

export function useDbUser() {
  return useContext(DbUserContext);
}

export function DbUserProvider({ children }: { children: React.ReactNode }) {
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
        const response = await fetch(`/api/users/${auth0User.sub}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        const userData = await response.json();
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
    <DbUserContext.Provider value={{ dbUser, isLoading, error }}>
      {children}
    </DbUserContext.Provider>
  );
}
