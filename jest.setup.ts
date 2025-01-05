import "@testing-library/jest-dom";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return "";
  },
}));

// Mock Auth0 hooks if needed
jest.mock("@auth0/nextjs-auth0/client", () => ({
  ...jest.requireActual("@auth0/nextjs-auth0/client"),
  useUser: jest.fn(() => ({
    user: null,
    error: null,
    isLoading: false,
  })),
}));
