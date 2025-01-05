import { UserContext } from "@/providers/UserProvider";
import { User as DbUser } from "@/types/db.types";
import { UserProfile } from "@auth0/nextjs-auth0/client";
import { render as rtlRender } from "@testing-library/react";
import { ReactElement } from "react";

const mockAuth0User: UserProfile = {
  email: "test@example.com",
  email_verified: true,
  name: "Test User",
  nickname: "testuser",
  picture: "https://example.com/picture.jpg",
  sub: "auth0|123456789",
  updated_at: "2024-03-14T12:00:00.000Z",
};

const mockDbUser: DbUser = {
  id: "1",
  email: "test@example.com",
  name: "Test User",
  role: "user",
  created_at: new Date("2024-03-14T12:00:00.000Z"),
};

const mockDbAdmin = {
  ...mockDbUser,
  role: "admin",
};

interface RenderOptions {
  isAuthenticated?: boolean;
  auth0User?: typeof mockAuth0User;
  dbUser?: typeof mockDbUser;
  isLoading?: boolean;
  error?: Error | null;
}

export function render(
  ui: ReactElement,
  {
    isAuthenticated = true,
    auth0User = mockAuth0User,
    dbUser = mockDbUser,
    isLoading = false,
    error = null,
  }: RenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    const value = {
      auth0User: isAuthenticated ? auth0User : null,
      dbUser: isAuthenticated ? dbUser : null,
      isLoading,
      error,
    };

    return (
      <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
  }

  return rtlRender(ui, { wrapper: Wrapper });
}

// Re-export everything
export * from "@testing-library/react";

// Export mock users for direct usage in tests
export { mockAuth0User, mockDbAdmin, mockDbUser };
